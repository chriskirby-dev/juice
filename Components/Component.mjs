import { default as Styles, StyleSheet } from "../Style/Styles.mjs";
import ObjUtil from "../Util/Object.mjs";
import Emitter from "../Event/Emitter.mjs";
import Util, { type } from "../Util/Core.mjs";
import { camelCase } from "../Util/String.mjs";
import Observe from "../Dom/Observe/Observe.mjs";
import VirtualDom from "../VirtualDom/VirtualDom.mjs";
import VDom from "../VirtualDom/VDom.mjs";
import Attributes from "../Dom/Attributes.mjs";
import SyncedValue from "../DataTypes/SyncedValue.mjs";
import "../Dom/Extend.mjs";

//Default Configuration
const DEFAULT_CONFIG = {
    debug: false,
    shadow: true,
    closed: false,
    properties: {},
    renderable: true,
};

const Custom = {};
const Defined = {};

const CUSTOM_INSTANCES = {};

export class ComponentIndex {
    static get(id) {
        return CUSTOM_INSTANCES[id] || null;
    }
}

const defaultComponentStyle = `
    * {
        box-sizing:border-box;
    }
    :host{
        position:relative;
        display:block;
    }
    :host(.container) .component--html{
        container: component / inline-size;
    }
    .component--styles{
        display:none;
    }
    .component--html{
        display:block;
        position:relative;
        height:100%;
        width:100%;
    
    }
`;

/* Simple Template Creator
 *  Takes in styles and html and outputs both to structured html code
 */
class ComponentTemplate {
    #styles = [defaultComponentStyle];
    #html = [];
    changed = true;
    config = {};

    constructor(config = {}) {
        this.config = config;
    }

    addStyle(...styles) {
        this.#styles.push(...styles);
        this.changed = true;
    }

    async loadStyle(url) {
        return fetch(url)
            .then((r) => r.text())
            .then((css) => this.addStyle(css));
    }

    get style() {
        return new Styles(...this.#styles).asText(true);
    }

    addHTML(...html) {
        this.#html.push(...html);
        this.changed = true;
    }

    get html() {
        return this.#html.join(" \n ").trim();
    }

    compile(options = {}) {
        const { config } = this;
        const type = config.template || "default";

        this.dom = document.createElement("template");
        this.dom.innerHTML = `
            <div id="style-box" class="component--styles vdom-noupdate">${this.style}</div>
            <div id="html" class="component--html" >
                ${this.html}
            </div>
        `;
        this.changed = false;
    }

    clone() {
        if (this.changed) this.compile();
        return this.dom.content.cloneNode(true);
    }
}

//HTML Element Extend Class Creator
function ComponentCompiler(name, BaseHTMLElement) {
    //console.log('ComponentCompiler', name, BaseHTMLElement.name, BaseHTMLElement );

    return {
        [name]: class extends BaseHTMLElement {
            static template = null;

            static index = 0;
            rendered = 0;

            static initialized = false;

            static instances = [];

            static allowedStates = [""];

            /**
             * emitter: [boolean]
             * properties: {
             *  name: {
             *      linked: true,
             *      type: 'number'
             *  }
             * }
             *
             */

            static defaultTemplateData = {};

            //Static Initialization

            /**
             * Initializes the static configuration of the component.
             * This function merges the default configuration with the user-provided configuration,
             * creates a new ComponentTemplate object, and sets up the template styles.
             * If the component is not in shadow mode, the styles are appended to the current scope.
             *
             * @return {void} This function does not return anything.
             */
            static initialize() {
                const defaultConfig = DEFAULT_CONFIG;
                const componentConfig = this.config || {};
                const userConfig = window.JUICE_CONFIG?.components[this.tag] || {};
                const baseConfig = this.baseConfig || {};

                this.config = ObjUtil.merge(defaultConfig, userConfig, baseConfig, componentConfig, true);

                this.template = new ComponentTemplate(this.config);
                const styleProperties = ["baseStyle", "style", "_style"];

                styleProperties.forEach((property) => {
                    const value = this[property];
                    if (value) {
                        if (Util.isArray(value)) {
                            this.template.addStyle(...value);
                        } else if (type(value, "object")) {
                            this.template.addStyle(value);
                        } else if (type(value, "string")) {
                            if (value.includes("}")) {
                                this.template.addStyle(value);
                            } else if (!value.includes(" ")) {
                                //Process as Link
                            }
                        }
                        this.template.addStyle(...(Util.isArray(value) ? value : [value]));
                    }
                });

                this.initialized = true;
                this.initialize = null;
            }

            static renderProxy = {
                get: function (customElement, prop, receiver) {
                    if (customElement[prop]) return customElement[prop];
                    return "";
                },
            };

            // Override to set custom html to component as string or literal
            static html(data = {}) {
                return `<slot></slot>`;
            }

            // Override to set custom styles to component
            static get baseStyle() {
                return null;
            }

            // Override to listen to attribute changes
            static get observedAttributes() {
                return this.observed.all?.concat(this.observed.attributes) || [];
            }

            /**
             * List of properties that will invoke onPropertyChanged when changed
             * @type {string[]}
             */
            static get observedProperties() {
                return [...(this.observed.all || []), ...(this.observed.properties || [])];
            }

            static get observed() {
                return {
                    all: [],
                    attributes: [],
                    properties: [],
                };
            }

            //Returns root Dom of Component Either Component Element, Shadow Dom or set custom _root property
            get root() {
                return this._root || this.shadowDom || this;
            }

            /**
             * Returns the constructor of the current instance.
             *
             * @return {Function} The constructor of the current instance.
             */
            get static() {
                return this.constructor;
            }

            _ = { styleVars: {} };

            // Stores references to elements that have been created
            // by the component
            refs = {};

            // Stores the result of the `defined` method
            _defined = {};

            // Stores an array of properties that have changed
            changed = [];

            // Stores the index of the component
            _index = null;

            // Stores whether or not the component has been rendered
            rendered = false;

            // Stores the state of the component
            _state = { current: null };

            // Stores the resize action
            RESIZE_ACTION = "none";

            config;

            #content;

            #vdom;

            #styles = {};

            #stashed = [];

            #refs = {};

            #slots = {};

            #renderers = [];

            constructor() {
                super();

                //Increment Component Index
                this.constructor.index++;
                //Set Instance Accessable Index Prop
                this._index = this.constructor.index;

                this._id = this.tagName.toLowerCase() + "-" + this._index;

                CUSTOM_INSTANCES[this._id] = this;

                //Initialize Static Component Only on first time called.
                if (this.constructor.initialize) this.constructor.initialize();

                //Get Static Config Obj
                this.config = Object.freeze(this.constructor.config);

                if (this.config.useInternals) {
                    //Attach Form internals
                    this.internals = this.attachInternals();
                }

                if (this.config.shadow) {
                    try {
                        //Attached Shadow Dom
                        const shadowConfig = { mode: this.config.closed ? "closed" : "open" };
                        if (this.delegatesFocus) shadowConfig.delegatesFocus = true;
                        this.shadowDom = this.attachShadow(shadowConfig);
                    } catch (e) {
                        //Shadow Dom Not Supported
                        console.error(
                            "Shadow Dom not supported in this browser. You must set configuration property shadow to false."
                        );
                    }
                }

                //Bind Emitter to element if config set true
                if (this.config.emitter) Emitter.bind(this);
                //Set debug
                if (this.config.debug) this.debug = true;
                //Before Crreate Callback
                if (this.beforeCreate) this.beforeCreate();
                //Initialize Observable Properties
                if (this.static.observedProperties.length) {
                    this.static.observedProperties.forEach((prop) => this.#setObservable(prop));
                }

                ["beforeHTML", "html", "afterHTML"].map((placement) => {
                    if (this.constructor[placement]) {
                        this.#renderers.push(this.constructor[placement].bind(this));
                    }
                });

                //Add to Instance Index
                this.constructor.instances.push(this);
                if (this.onPropertyChanged) this.onPropertyChanged.bind(this);
                //Call onCreate
                if (this.onCreate) this.onCreate();
                debug("Created", this.constructor.name);

                if (this.constructor.template) {
                    //Clone Template and append to dom
                    const clone = this.constructor.template.clone();
                    this.root.appendChild(clone);
                    this.#content = this.root.querySelector(".component--html");
                    //Initialize VDOM by parsing the component html
                    //this.#vdom = VirtualDom.parseDom(this.#content);
                    this.#vdom = new VDom(this.#content, {
                        container: this.#content,
                        containerAsRoot: true,
                    });
                    this.#styles.default = new StyleSheet("default", this.root.querySelector("style"));
                }

                if (!this.render) {
                    this.render = this.#render;
                }
            }

            get disabled() {
                return this.hasAttribute("disabled");
            }

            set disabled(isDisabled) {
                if (isDisabled) {
                    this.setAttribute("disabled", "");
                } else {
                    this.removeAttribute("disabled");
                }
            }

            setStyleVar(key, value) {
                this.ref("html").style.setProperty(key, value);
            }

            setStyleVars(vars) {
                Object.assign(this._.styleVars, vars); //this.ref("html").style.setProperty(key, value);
            }

            writeStyleVars(vars) {
                const root = this.shadowRoot.host;
                if (vars) Object.assign(this._.styleVars, vars);
                root.style.cssText = Object.entries(this._.styleVars)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(";");

                //alert(this.ref("html").style.cssText);
            }

            /**
             * A function to manage styles for the component.
             *
             * @param {string} sheetName - The tag of the style sheet to manage (default is "default")
             * @return {Object} An object with methods to clear, add, update, and replace styles
             */
            get styles() {
                const self = this;

                function getStyleSheet(sheetName = "default") {
                    let styleSheet = self.#styles[sheetName];
                    if (!styleSheet) {
                        //If style tag does not exist create a empty one
                        styleSheet = new StyleSheet(`style--${sheetName}`);
                        const stylesContainer = (self.shadowDom || self).querySelector(".component--styles");
                        (sheetName == "global" ? document.head : stylesContainer || self.shadowDom || self).appendChild(
                            styleSheet.create()
                        );
                        self.#styles[sheetName] = styleSheet;
                    }
                    return styleSheet;
                }

                return {
                    clear: function (sheetName = "default") {
                        getStyleSheet(sheetName).clear();
                    },
                    add: function (styles, sheetName = "default") {
                        getStyleSheet(sheetName).add(styles);
                    },
                    update(selector, properties, sheetName = "default") {
                        getStyleSheet(sheetName).update(selector, properties);
                    },
                    replace: function (styles, sheetName = "default") {
                        getStyleSheet(sheetName).clear();
                        getStyleSheet(sheetName).add(styles);
                    },
                };
            }

            /**
             * Stash method calls made before element is connected
             * @method #stash Private
             * @param opperation
             * @param args
             */

            #stash(opperation, ...args) {
                if (this.debug) console.log("Stash", this.constructor.name, opperation, args);
                this.#stashed.push([opperation, args]);
            }

            /**
             * Unstash all stashed method calls
             * @method #unstash Private
             */

            #unstash() {
                // debug('UNSTASH',this.constructor.name, this.#stashed );
                while (this.#stashed.length > 0) {
                    const stashed = this.#stashed.shift();
                    if (this.debug) console.log("unStash", this.constructor.name, ...stashed);
                    if (this[stashed[0]]) this[stashed[0]](...stashed[1]);
                }
            }

            setDefined(prop, value) {
                this._defined[prop] = value;
            }

            #state = { current: "initial" };
            // Component state getter/setter
            set state(value) {
                if (this.constructor.allowedStates && !this.constructor.allowedStates.includes(value)) {
                    throw new Error(`State '${value}' not allowed for component`);
                }

                const previous = this.#state.current;
                this.#state.current = value;

                if (this.onStateChange) this.onStateChange(value, previous);
                this.dispatchEvent(new CustomEvent("statechange", { detail: { state: value } }));
            }

            get state() {
                return this.#state.current;
            }

            /**
             * Initialize Observable Property
             * @method #setObservable
             * @param property {string} Property Name
             * @param value {mixed} Property Value
             */

            #setProperty(property, value) {
                this[property] = value;
            }

            #setObservable(property, value = null) {
                const config = this.config.properties[property] || {};

                let routes = [{ route: property, parent: this._defined }];
                const synced = new SyncedValue();

                if (config.route !== undefined) {
                    if (!Array.isArray(config.route)) config.route = [config.route];
                    routes = config.route.map((path) => {
                        if (path.includes(".")) {
                            const parts = path.split(".");
                            const route = parts.pop();
                            const parent = parts.reduce((acc, part) => acc && acc[part], this);
                            return { route, parent };
                        } else {
                            return { route: path, parent: this };
                        }
                    });
                }

                if (this[property] !== undefined) {
                    value = this[property];
                    routes.forEach((r) => (r.parent[r.route] = value));
                    delete this[property];
                }

                value = value || config.default || null;

                routes.forEach((r) => {
                    if (!r.parent[r.route]) {
                        r.parent[r.route] = value;
                    }
                });

                Object.defineProperty(this, property, {
                    get: () => {
                        return routes[0].parent[routes[0].route];
                    },
                    set: (newValue) => {
                        if (newValue === "null") newValue = null;
                        if (routes[0].parent[routes[0].route] === newValue) return;
                        if (this.changed.indexOf(property) === -1) this.changed.push(property);
                        const oldValue = routes[0].parent[routes[0].route];
                        routes.forEach((r) => (r.parent[r.route] = newValue));

                        if (config.linked && newValue !== null) {
                            this.setAttribute(property, newValue);
                        }

                        if (!this._defined.connected) {
                            return this.#stash("_onPropertyChanged", property, oldValue, newValue, config);
                        } else {
                            if (
                                !this.onBeforePropertyChanged ||
                                this.onBeforePropertyChanged(property, oldValue, newValue)
                            ) {
                                this._onPropertyChanged(property, oldValue, newValue, config);
                            }
                        }

                        return true;
                    },
                });

                const aliases = property
                    .split("-")
                    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
                    .join("");
                if (aliases !== property) {
                    Object.defineProperty(this, aliases, {
                        get: () => this[property],
                        set: (value) => {
                            this[property] = value;
                        },
                    });
                }

                if (value !== null && config.linked && !this.hasAttribute(property)) {
                    this.#stash("setAttribute", property, value);
                }
            }

            dirty(...properties) {
                return properties.length
                    ? properties.some((property) => this.changed.includes(property))
                    : this.changed.length > 0;
            }

            clean(...properties) {
                if (properties.length) {
                    for (const property of properties) {
                        const index = this.changed.indexOf(property);
                        if (index > -1) {
                            this.changed.splice(index, 1);
                        }
                    }
                } else {
                    this.changed = [];
                }
            }

            // Handle property changes
            async _onPropertyChanged(property, oldValue, newValue, config) {
                if (this.onPropertyChanged) await this.onPropertyChanged(property, oldValue, newValue);

                // Dispatch property change event
                this.dispatchEvent(
                    new CustomEvent("propertychange", {
                        detail: { property, oldValue, newValue },
                    })
                );

                // If "after" function is set in property config
                if (config.after) {
                    const after = typeof config.after === "string" ? this[config.after] : config.after;
                    if (typeof after === "function") await after.call(this);
                }

                // If "render" is set in property config
                if (config.render) {
                    // Force render the component
                    clearTimeout(this.renderTO);
                    this.renderTO = setTimeout(() => {
                        this.#render();
                    }, 0);
                }
            }

            #resize(width, height) {
                const resizeAction = this.RESIZE_ACTION;
                console.log("resize");
                switch (resizeAction) {
                    case "width":
                        this.width = width;
                        break;
                    case "height":
                        this.height = height;
                        break;
                    case "fill":
                        this.width = width;
                        this.height = height;
                        break;
                    case "fill:pow2":
                        this.width = Math.pow(2, Math.ceil(Math.log2(width)));
                        this.height = Math.pow(2, Math.ceil(Math.log2(height)));
                        break;
                    case "none":
                        break;
                    default:
                        this.width = width;
                        this.height = height;
                }

                if (typeof this.onResize === "function") {
                    this.onResize(this.width, this.height, resizeAction);
                }
            }

            _onFirstConnect() {
                // Initialize the component
                if (!this.constructor.deferRender && !this.rendered) this.#render();

                // Set up resize observer if component has a resize method
                if (type(this.onResize, "function") || this.RESIZE_ACTION !== "none") {
                    this.mutationObserver = new MutationObserver(() =>
                        this.#resize(this.offsetWidth, this.offsetHeight)
                    );
                    this.mutationObserver.observe(this, {
                        attributes: true,
                    });
                }

                // Set up position observer if component has an onPosition method
                if (type(this.onPosition, "function")) {
                    this.positionObserver = new MutationObserver(() => {
                        const x = this.offsetLeft;
                        const y = this.offsetTop;
                        this.onPosition(x, y);
                    });
                    this.positionObserver.observe(this, {
                        attributes: true,
                        childList: true,
                        subtree: true,
                    });
                }

                // Call onReady on next tick
                setTimeout(() => {
                    if (this.onReady) this.onReady();
                    this.ready = true;
                    this.dispatchEvent(new Event("ready"));

                    if (this.parentElement?.onCustomChildReady) {
                        this.parentElement.onCustomChildReady(this);
                    } else if (this.getRootNode().host?.onCustomChildReady) {
                        this.getRootNode().host.onCustomChildReady(this);
                    }

                    if (this.ref("html")) this.ref("html").classList.add("connected");
                }, 0);

                // Call onSlotChange on slotchange event
                if (this.onSlotChange) {
                    const onSlotChange = this.onSlotChange.bind(this);
                    function setupSlotListener(slot) {
                        slot.addEventListener("slotchange", () => {
                            let nodes = slot.assignedNodes();
                            onSlotChange(slot, nodes);
                        });
                        let nodes = slot.assignedNodes();
                        if (nodes.length) onSlotChange(slot, nodes);
                    }
                    Array.from(this.root.querySelectorAll("slot")).forEach((slot) => setupSlotListener(slot));
                }

                // Call onChildren when children change
                if (this.onChildren) {
                    this.mutationObserver = new MutationObserver((mutations) => {
                        const added = [];
                        for (const mutation of mutations) {
                            if (mutation.type === "childList") {
                                added.push(...mutation.addedNodes);
                            }
                        }
                        if (added.length) clearTimeout(this.childTO);
                        this.onChildren(added.filter((el) => el.nodeType === Node.ELEMENT_NODE));
                    });

                    this.mutationObserver.observe(this, {
                        childList: true,
                    });

                    this.onChildren(Array.from(this.children));
                }

                if (this.onFirstConnect) this.onFirstConnect();
            }

            /**
             *  @method connectedCallback
             *  Invoked each time the custom element is appended into a document-connected element.
             *  This will happen each time the node is moved, and may happen before the element's contents have been fully parsed.
             */

            connectedCallback() {
                if (!this._defined.connected) {
                    this._defined.connected = true;

                    if (this.onBeforeConnect) this.onBeforeConnect();

                    if (this.onConnect) this.onConnect();
                    this.dispatchEvent(new CustomEvent("connect"));
                    if (this.parentNode._onCustomChildConnect) {
                        this.parentNode._onCustomChildConnect(this);
                    }

                    if (!this.ready) {
                        this._onFirstConnect();
                        this.#unstash();
                    }
                }
            }

            customChildren = [];

            /**
             *  @method _onCustomChildConnect
             *  Invoked when a custom child element is connected to this custom element.
             *  This will happen each time the child element is appended into this element.
             *  This will happen before the element's contents have been fully parsed.
             *  @param {Object} child - the custom child element that was connected
             */
            _onCustomChildConnect(child) {
                this.customChildren.push(child);
                if (this.onCustomChildConnect) {
                    this.onCustomChildConnect(child);
                }
            }

            /**
             *  @method disconnectedCallback
             *  Invoked each time the custom element is disconnected from the document's DOM
             */

            disconnectedCallback() {
                this._defined.connected = false;
                this.dispatchEvent(new Event("disconnect"));
                if (this.onDisconnect) return this.onDisconnect();
            }

            /**
             * Get Element ref from template
             * @method ref
             * @param name
             * @returns Dom Element
             */

            ref(id) {
                return this.#refs[id];
            }

            get refs() {
                return this.#refs;
            }

            /**
             *  @method adoptedCallback
             *  Invoked each time the custom element is moved to a new document.
             */

            adoptedCallback() {
                this.dispatchEvent(new Event("adopted"));
                if (this.onAdopted) return this.onAdopted();
            }

            /*
                @ _bindEvent
            */

            _bindEvent(event, element, handlerName) {
                const handlerFn = this[handlerName] || (() => {});
                const args = handlerName
                    .split("(")[1]
                    .split(")")[0]
                    .split(",")
                    .map((arg) => arg.replace(/['"]/g, "").trim());

                element.addEventListener(
                    event,
                    (event) =>
                        handlerFn.bind(this)(
                            event,
                            ...args.map((arg) => (arg === "this" ? element : element[arg.replace("this.", "")]))
                        ),
                    false
                );
                element.classList.add("events-set");
            }

            setRef(ref, el) {
                this.#refs[ref] = el;
            }

            slot(name = "default") {
                return this.#slots[name] || null;
            }

            /**
             * @method render
             */

            #render(refresh) {
                //console.trace( this.rendered );

                if (refresh) {
                    //Reset HTML
                    this.#content.innerHTML = "";
                }

                if (this.beforeFirstRender && this.rendered == 0) this.beforeFirstRender();
                if (this.beforeRender) this.beforeRender();
                //Scope static html fn to currentscope

                const dataProxy = new Proxy(this.compileData(), this.constructor.renderProxy);

                //Extrsact Wrapper attributes
                const attributes = new Attributes(Attributes.extract(this.#content)).toString();

                this.#vdom.render(
                    this.#renderers
                        .map((renderer) => {
                            return renderer(dataProxy);
                        })
                        .join("\n")
                );

                this.content = this.#content;

                if (this.rendered == 0) {
                    const refs = this.root.querySelectorAll("[id]:not(.ref)");
                    for (let i = 0; i < refs.length; i++) {
                        this.#refs[refs[i].getAttribute("id")] = refs[i];
                        refs[i].removeAttribute("ref");
                        refs[i].classList.add("ref");
                    }

                    const slots = this.root.querySelectorAll("slot");
                    for (let i = 0; i < slots.length; i++) {
                        this.#slots[slots[i].name || "default"] = slots[i];
                    }

                    const onEvents = this.root.querySelectorAll("[event]:not(.events-set)");
                    for (let i = 0; i < onEvents.length; i++) {
                        const eventHandle = onEvents[i].getAttribute("event");
                        if (eventHandle.includes("::")) {
                            const [event, call] = eventHandle.split("::");
                            this._bindEvent(event, onEvents[i], call);
                        } else {
                            console.error(
                                this.constructor.name,
                                "Event Auto Handel must include event and method",
                                eventHandle
                            );
                        }
                    }
                }

                this.rendered++;

                this.dispatchEvent(new CustomEvent("rendered"));
                if (this.afterRender) this.afterRender();
            }

            computedName() {
                return this.tagName.toLowerCase() + this._index;
            }
            /*
            getModel(name) {
                return this.#models[name];
            }

            addModel(model, props = [], reflect = true) {
                this.#models[model._static.name] = model;
                if (reflect) model.reflection(this, reflect);
                //Bind Model instance to component
                if (this.onModelAdded) {
                    const onModelAdded = this.onModelAdded.bind(this);
                    onModelAdded(model);
                }
            }

            model(name) {
                return this.#models[name];
            }

            with(...models) {
                for (let i = 0; i < models.length; i++) {
                    this.#models[models[i]._static.name] = models[i];
                    if (this.onModelAdded) this.onModelAdded(models[i]);
                }
                return this;
            }

            withReflected(...models) {
                for (let i = 0; i < models.length; i++) {
                    if (!Util.type(models[i], "array")) models[i] = [models[i]];
                    let [model, props] = models[i];
                    this.#models[model._static.name] = model;
                    model.reflection(this, props);
                    if (this.onModelAdded) this.onModelAdded(model);
                }
                return this;
            }
*/
            /**
             * @method compileData
             * @returns
             */

            compileData() {
                return this;
            }

            /**
             *  @method attributeChangedCallback
             *  Invoked each time one of the custom element's attributes is added, removed, or changed.
             *  Which attributes to notice change for is specified in a static get observedAttributes
             */

            attributeChangedCallback(property, oldValue, newValue) {
                const { type, unit, linked } = this.config.properties[property] || {};

                if (oldValue === newValue) return;

                if (newValue === null) {
                    if (this.hasAttribute(property)) this.removeAttribute(property);

                    if (!this._defined.connected) {
                        this.#stash("onAttributeDeleted", property);
                    } else if (this.onAttributeDeleted) {
                        this.onAttributeDeleted(property);
                    }
                }

                if (oldValue === null && this.onAttributeAdded) {
                    if (this.hasAttribute(property)) {
                        if (!this._defined.connected) {
                            this.#stash("onAttributeAdded", property);
                        } else {
                            this.onAttributeAdded(property);
                        }
                    }
                }

                if (unit && typeof newValue === "string") {
                    if (unit === "percent" && newValue.includes("%")) {
                        newValue = Number(newValue.replace("%", "")) / 100;
                    }
                }

                switch (type) {
                    case "int":
                        newValue = parseInt(newValue);
                    case "number":
                        newValue = Number(newValue);
                        break;
                    case "boolean":
                        if (["0", "false", 0].includes(newValue)) {
                            newValue = false;
                        } else if (["1", "true", 1].includes(newValue)) {
                            newValue = true;
                        }
                        break;
                    case "json":
                        if (typeof newValue === "string") newValue = JSON.parse(newValue);
                        break;
                    case "exists":
                        newValue = this.hasAttribute(property);
                        break;
                }

                if (linked && newValue !== undefined) {
                    this[property] = newValue;
                }

                if (!this._defined.connected) {
                    return this.#stash("attributeChangedCallback", property, oldValue, newValue);
                }

                if (this.onAttributeChanged) this.onAttributeChanged(property, oldValue, newValue);
            }
        },

        //END Custom Class
    }[name];
}

Custom.Compiler = ComponentCompiler;

Custom.has = function (name) {
    return Defined[name] ? true : false;
};

function createComponent(name, Extends) {
    Object.defineProperty(Custom, name, {
        get: () => {
            if (Defined[name]) return Defined[name];
            else Defined[name] = ComponentCompiler(name, Extends);
            return Defined[name];
        },
        set: () => false,
    });
}

createComponent("HTMLElement", HTMLElement);
createComponent("Canvas", HTMLCanvasElement);
createComponent("UL", HTMLUListElement);
createComponent("Anchor", HTMLAnchorElement);
createComponent("Label", HTMLLabelElement);

export default Custom;

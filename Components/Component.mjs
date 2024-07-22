import { default as Styles, StyleSheet } from "../Style/Styles.mjs";
import ObjUtil from "../Util/Object.mjs";
import Emitter from "../Event/Emitter.mjs";
import Util, { type } from "../Util/Core.mjs";
import { camelCase } from "../Util/String.mjs";
import Observe from "../Dom/Observe/Observe.mjs";
import VirtualDom from "../VirtualDom/VirtualDom.mjs";
import Attributes from "../Dom/Attributes.mjs";
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
        z-index:100;
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
    dom;
    #styles = [defaultComponentStyle];
    #html = [];
    changed = true;
    config = {};

    constructor(config = {}) {
        this.config = config;
        this.dom = document.createElement("template");
    }

    addStyle(...styles) {
        this.#styles = this.#styles.concat(styles);
        this.changed = true;
    }

    get style() {
        return new Styles(...this.#styles).asText(true);
    }

    addHTML(...html) {
        this.#html = this.#html.concat(html);
        this.changed = true;
    }

    get html() {
        return this.#html.join(" \n ").trim();
    }

    compile(options = {}) {
        const { config } = this;
        const type = config.template || "default";

        switch (type) {
            case "minimal":
                this.dom.innerHTML = `<div id="style-box" class="component--styles vdom-noupdate">${this.style}</div>${this.html}`;
            default:
                this.dom.innerHTML = `<div id="style-box" class="component--styles vdom-noupdate">${this.style}<slot name="style"></slot></div>`;
                this.dom.innerHTML += `
                ${this.config.before ? `<slot name="before-html"></slot>` : ``}
                <div id="html" class="component--html"  >${this.html}</div>
                ${this.config.after ? `<slot name="after-html"></slot>` : ``}
                `;
        }
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
                //Merge Default Config with Component static Config
                const userConfig = {};
                if (this.tag && window.JUICE_CONFIG?.components[this.tag]) {
                    userConfig = window.JUICE_CONFIG.components[this.tag];
                }

                //Merge Default Config with Component static Configs
                this.config = ObjUtil.merge(DEFAULT_CONFIG, userConfig, this.baseConfig || {}, this.config || {}, true);
                if (this.debug) console.log(this.name, this.config);

                //Create new Component Template
                this.template = new ComponentTemplate(this.config);

                //Setup template styles
                const staticStyleProperties = ["baseStyle", "style", "_style"];
                staticStyleProperties.forEach((property) => {
                    if (this[property])
                        this.template.addStyle(...(Util.isArray(this[property]) ? this[property] : [this[property]]));
                });

                //remove initialize function so it is not ran again
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

            // Override in order to listen to attribute changes
            static get observedAttributes() {
                return (this.observed.all || []).concat(this.observed.attributes || []);
            }

            //Any properties listed will invoke onPropertyChanged callback
            static get observedProperties() {
                return (this.observed.all || []).concat(this.observed.properties || []);
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

            refs = {};
            #slots = {};
            _defined = {};
            #refs = {};
            changed = [];
            #_stash = [];
            #data = {};
            #styles = {};
            #content = null;
            #vdom;
            #models = {};
            _index = null;
            rendered = false;
            #config;
            _state = { current: null };

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
                this.#config = Object.freeze(this.constructor.config);

                if (this.#config.useInternals) {
                    //Attach Form internals
                    this.internals = this.attachInternals();
                }

                if (this.#config.shadow) {
                    try {
                        //Attached Shadow Dom
                        const shadowConfig = { mode: this.#config.closed ? "closed" : "open" };
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
                if (this.#config.emitter) Emitter.bind(this);
                //Set debug
                if (this.#config.debug) this.debug = true;
                //Before Crreate Callback
                if (this.beforeCreate) this.beforeCreate();
                //Initialize Observable Properties
                if (this.static.observedProperties.length) {
                    this.static.observedProperties.forEach((prop) => this.#setObservable(prop));
                }

                this.htmlFactory = this.constructor.html.bind(this);

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
                    this.#vdom = VirtualDom.parseDom(this.#content);
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

            /**
             * A function to manage styles for the component.
             *
             * @param {string} tag - The tag of the style sheet to manage (default is "default")
             * @return {Object} An object with methods to clear, add, update, and replace styles
             */
            get styles() {
                const self = this;

                function getSheet(tag = "default") {
                    let sheet = self.#styles[tag];
                    if (!sheet) {
                        //If style tag does not exist create a empty one
                        sheet = new StyleSheet("style--" + tag);
                        const styleBox = (self.shadowDom || self).querySelector(".component--styles");
                        (styleBox || self.shadowDom || self).appendChild(sheet.create());
                        self.#styles[tag] = sheet;
                    }
                    return sheet;
                }

                return {
                    clear: function (tag = "default") {
                        getSheet(tag).clear();
                    },
                    add: function (styles, tag = "default") {
                        getSheet(tag).add(styles);
                    },
                    update(selector, properties, tag = "default") {
                        getSheet(tag).update(selector, properties);
                    },
                    replace: function (styles, tag = "default") {
                        getSheet(tag).clear();
                        getSheet(tag).add(styles);
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
                this.#_stash.push([opperation, args]);
            }

            /**
             * Unstash all stashed method calls
             * @method #unstash Private
             */

            #unstash() {
                // debug('UNSTASH',this.constructor.name, this.#_stash );
                while (this.#_stash.length > 0) {
                    const stashed = this.#_stash.shift();
                    if (this.debug) console.log("unStash", this.constructor.name, ...stashed);
                    if (this[stashed[0]]) this[stashed[0]](...stashed[1]);
                }
            }

            setDefined(prop, value) {
                this._defined[prop] = value;
            }

            #state = { current: "initial" };
            //Component State Getter/Setter
            set state(value) {
                if (this.constructor.allowedStates && !this.constructor.allowedStates.includes(value)) {
                    throw new Error("State not allowed for component");
                }
                this.#state.last = this._state.current;
                this.#state.current = value;
                if (this.onStateChange) this.onStateChange(value, this.#state.last);
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
                //Check Config Properties Obj for Property Configs
                const config = this.#config.properties[property] || {};
                let aliases = [];

                if (property.includes("-")) {
                    //If property is dashed create alias for it in camelCase
                    let alias = camelCase(property);
                    aliases.push(alias);
                }

                let route = property,
                    parent = this._defined;
                // console.trace(config.route);
                if (config.route !== undefined && config.route.includes(".")) {
                    const parts = config.route.split(".");
                    route = parts.pop();
                    //  console.log(config);
                    //   console.trace(parts);
                    parent = parts.reduce((acc, part) => acc && acc[part], this);
                }

                //   console.log(this[route], parent, route, property);

                if (this[property] !== undefined) {
                    //If property is already set get value and delete from component
                    console.log("Property already set", property);
                    value = this[property];
                    parent[route] = value;
                    delete this[property];
                }

                if (!parent[route]) {
                    if (value !== null) {
                        //If value is passed set it
                        parent[route] = value;
                    } else if (config.default !== undefined && (value === null || value == config.default)) {
                        //If value is not passed and default is set in property config set default
                        value = config.default;
                        parent[route] = value;
                    }
                }

                // debug('setObservable', this.constructor.name, property, value);

                if (this.debug) console.log("setObservable", this.constructor.name, property, value);

                //Define Property to instance
                Object.defineProperty(this, property, {
                    get: () => {
                        return parent[route];
                    },
                    set: (value) => {
                        if (value == "null") value = null;
                        // console.log(this._defined[property], value);
                        //If value is same return
                        if (parent[route] === value) return;
                        //Value has changed mark in changed array
                        if (this.changed.indexOf(property) === -1) this.changed.push(property);
                        //Grab previous value
                        const old = parent[route];
                        //Set New Value
                        parent[route] = value;

                        //If Property Attr is Linked Update it.
                        if (config.linked && value !== null) {
                            this.setAttribute(property, value);
                        }

                        if (!this._defined.connected) {
                            return this.#stash("_onPropertyChanged", property, old, value, config);
                        } else {
                            if (!this.onBeforePropertyChanged || this.onBeforePropertyChanged(property, old, value)) {
                                this._onPropertyChanged(property, old, value, config);
                            }
                        }

                        return true;
                    },
                });

                if (aliases.length) {
                    //Route all aliases to the property
                    aliases.forEach((alias) => {
                        Object.defineProperty(this, alias, {
                            get: () => this[property],
                            set: (value) => {
                                this[property] = value;
                            },
                        });
                    });
                }

                if (value !== null) {
                    //Set Value to start things off
                    this[property] = value;
                }

                if (value && config.linked && !this.hasAttribute(property)) {
                    //Create Set Attr event to complete when ready
                    this.#stash("setAttribute", property, value);
                }
            }

            dirty(...props) {
                if (props.length) return props.some((p) => this.changed.includes(p));
                return this.changed.length > 0;
            }

            clean(...props) {
                if (props.length) return props.forEach((p) => this.changed.splice(this.changed.indexOf(p), 1));
                this.changed = [];
            }

            //Handle Property Changes
            _onPropertyChanged(property, old, value, config) {
                if (this.debug) console.log("onPropertyChanged", this.constructor.name, property, old, value, config);

                if (this.onPropertyChanged) this.onPropertyChanged(property, old, value);

                //Dispatch Property Change Event
                this.dispatchEvent(
                    new CustomEvent("propertychange", {
                        detail: { property: property, value: value, old: old },
                    })
                );

                //if After function is set in property Config
                if (config.after) {
                    if (typeof config.after == "string" && this[config.after]) {
                        this[config.after]();
                    } else if (typeof config.after == "function") {
                        const fn = config.after.bind(this);
                        fn();
                    }
                }

                //if render s set in property config
                if (config.render) {
                    //Force render the component
                    this.#render();
                }
            }

            /**
             *  @method connectedCallback
             *  Invoked each time the custom element is appended into a document-connected element.
             *  This will happen each time the node is moved, and may happen before the element's contents have been fully parsed.
             */

            connectedCallback() {
                console.log("CONNECTED", this);
                //If Ready below code already ran
                if (!this.ready) {
                    //If Component has a template prepare for initialization

                    if (this.debug) debug(this.constructor.name, "CONNECTED");

                    //If component has resize method create resize observer
                    if (type(this.onResize, "function")) {
                        debug("Observing Resize", this.constructor.name);
                        this.onResize = this.onResize.bind(this);
                        Observe.resize(this.#content).change((w, h) => this.onResize(w, h));
                    }

                    //If component has onPosition method create position observer
                    if (type(this.onPosition, "function")) {
                        debug("Observing Position", this.constructor.name);
                        this.onPosition = this.onPosition.bind(this);
                        Observe.position(this).change((x, y) => this.onPosition(x, y));
                    }

                    //Check for defer render
                    if (!this.constructor.deferRender && this.rendered == false) this.#render();

                    if (this.onBeforeConnect) this.onBeforeConnect();

                    //Called on first connection try.
                    if (this.onFirstConnect) this.onFirstConnect();

                    setTimeout(() => {
                        //Call onReady on next tick
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
                }

                if (this.onConnect) this.onConnect();

                this._defined.connected = true;
                //Unstash all stashed events

                //Run all stashed events
                this.#unstash();

                if (this.onConnect) this.onConnect();
                this.dispatchEvent(new Event("connect"));

                if (this.parentNode._onCustomChildConnect) {
                    //If elements parent is a custom element.then broadcast child connect.
                    this.parentNode._onCustomChildConnect(this);
                }

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

                if (this.onChildren) {
                    //Broadcast all child element updates
                    //If onChildren is set then watch for child node changes
                    this.childTO = setTimeout(() => {
                        this.onChildren(null);
                        clearTimeout(this.childTO);
                    }, 0);

                    this.mutationObserver = new MutationObserver((mutations) => {
                        const added = [];
                        for (const mutation of mutations) {
                            // Could test for `mutation.type` here, but since we only have
                            // set up one observer type it will always be `childList`
                            added.push(...mutation.addedNodes);
                        }
                        if (added.length) clearTimeout(this.childTO);
                        this.onChildren(added.filter((el) => el.nodeType === Node.ELEMENT_NODE));
                    });

                    // Watch the Light DOM for child node changes
                    this.mutationObserver.observe(this, {
                        childList: true,
                    });
                }
            }

            customChildren = [];

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

            _bindEvent(event, element, handler) {
                const self = this;
                let args = [];
                if (handler.includes("(")) {
                    args = handler
                        .split("(")
                        .pop()
                        .split(")")
                        .shift()
                        .split(",")
                        .map((arg) => arg.replace(/['"]/g, "").trim());
                    //  debug(args);
                    handler = handler.split("(").shift();
                }
                let handlerFn = this[handler] ? this[handler].bind(this) : function () {};

                element.classList.add("events-set");

                element.addEventListener(
                    event,
                    (e) => {
                        //Allow this context in callbacks
                        const respArgs = args.map((arg) => {
                            if (arg === "this") return element;
                            if (typeof arg == "string" && arg.indexOf("this.") === 0)
                                return element[arg.replace("this.", "")];
                            return arg;
                        });
                        handlerFn = handlerFn.bind(self);
                        return handlerFn(e, ...respArgs);
                    },
                    false
                );
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
                const className = this.#content ? this.#content.className : "component--html";

                const html = `<div id="html" ${attributes} >${this.htmlFactory(dataProxy)}</div>`;
                let virtual = VirtualDom.parseHTML(html);

                if (this.beforeRender) virtual = this.beforeRender(virtual);

                const patch = VirtualDom.diff(this.#vdom, virtual);

                if (this.debug) debug(this.#content.innerHTML);
                patch(this.#content);

                this.#vdom = virtual;

                this.content = this.#content;

                if (this.rendered == 0) {
                    const refs = this.root.querySelectorAll("[id]");
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

            attributeChangedCallback(property, old, value) {
                if (this.debug)
                    console.log(this.constructor.name, property, "old:", old, "value", value == "" ? "empty" : value);
                //If values are the same return
                if (old === value) return;

                //GEt property config
                const config = this.#config.properties[property] || {};
                //If config type is set set var type from string
                if (value === null) {
                    if (this.hasAttribute(property)) this.removeAttribute(property);

                    if (!this._defined.connected) {
                        this.#stash("onAttributeDeleted", property);
                    } else {
                        if (this.onAttributeDeleted) this.onAttributeDeleted(property);
                    }
                }

                if (old === null && this.onAttributeAdded) {
                    if (this.hasAttribute(property)) {
                        if (!this._defined.connected) {
                            this.#stash("onAttributeAdded", property);
                        } else {
                            if (this.onAttributeAdded) this.onAttributeAdded(property);
                        }
                    }
                }

                if (config.unit && typeof value == "string") {
                    console.log(value);
                    if (config.unit == "percent" && value.includes("%")) {
                        value = Number(value.replace("%", "")) / 100;
                    }
                }

                if (config.type) {
                    switch (config.type) {
                        case "int":
                            value = parseInt(value);
                        case "number":
                            value = Number(value);
                            break;
                        case "boolean":
                            if (["0", "false", 0].includes(value)) {
                                value = false;
                            } else if (["1", "true", 1].includes(value)) {
                                value = true;
                            }
                            break;
                        case "json":
                            if (typeof value == "string") value = JSON.parse(value);
                            break;
                        case "exists":
                            value = this.hasAttribute(property);
                            break;
                    }
                }

                //Set Property if linked
                if (config.linked && value !== undefined) {
                    this[property] = value;
                }

                if (!this._defined.connected) {
                    return this.#stash("attributeChangedCallback", property, old, value);
                }

                if (this.debug) console.log("onAttributeChanged", this.constructor.name, property, old, value, config);

                if (this.onAttributeChanged) this.onAttributeChanged(property, old, value);
                // if( this.render && !this.defer ) this.render();
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

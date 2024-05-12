import Styles from "../Style/Styles.mjs";
import ObjUtil from "../Util/Object.mjs";
import Emitter from "../Event/Emitter.mjs";
import Util, { type } from "../Util/Core.mjs";
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
        this.dom.innerHTML = `<div id="style-box" class="component--styles vdom-noupdate">${this.style}<slot name="style"></slot></div>`;
        this.dom.innerHTML += `
        ${this.config.before ? `<slot name="before-html"></slot>` : ``}
        <div class="component--html" ref="html" >${this.html}</div>
        ${this.config.after ? `<slot name="after-html"></slot>` : ``}
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
    //app.log('ComponentCompiler', name, BaseHTMLElement.name, BaseHTMLElement );

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
            static config = {};

            static defaultTemplateData = {};

            //Static Initialization

            static initialize() {
                //Merge Default Config with Component static Config
                const cfgs = [DEFAULT_CONFIG, this.config];
                if (this.tag && window.JUICE_CONFIG?.components[this.tag]) {
                    cfgs.push(window.JUICE_CONFIG.components[this.tag]);
                }
                this.config = ObjUtil.merge(DEFAULT_CONFIG, this.config, false);

                //Merge Default Config with Component static Configs
                const _configs = [DEFAULT_CONFIG];
                if (this.baseConfig) _configs.push(this.baseConfig);
                if (this.config) _configs.push(this.config);
                this.config = ObjUtil.merge(..._configs, true);
                console.log(this.config);
                if (this.debug) console.log(this.name, this.config);

                //Create new Component Template
                this.template = new ComponentTemplate(this.config);
                //If baseStyle is set then add it to template
                if (this.baseStyle) {
                    this.template.addStyle(...(Util.isArray(this.baseStyle) ? this.baseStyle : [this.baseStyle]));
                }

                //Setup template styles
                if (this.style) {
                    //Prepend Styles to Shadow Template
                    this.template.addStyle(...(Util.isArray(this.style) ? this.style : [this.style]));
                    if (this._style) this.template.addStyle(this._style);
                } else {
                    //If not shadow Append Styles to current scope
                    const styleSheet = new Styles(...style).asSheet("dom-component-sheet");
                    document.getElementsByTagName("head")[0].appendChild(styleSheet);
                }

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

            refs = {};
            #slots = {};
            #defined = {};
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
                if (this.#config.debug) this.debug = true;

                //Initialize Observable Properties
                if (this.constructor.observedProperties.length) {
                    for (let i = 0; i < this.constructor.observedProperties.length; i++) {
                        this.#setObservable(this.constructor.observedProperties[i]);
                    }
                }

                // this._style = this.style;

                this.constructor.instances.push(this);
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

            #style(tag = "default") {
                if (!this.#styles[tag]) {
                    //If style tag does not exist create a empty one
                    this.#styles[tag] = document.createElement("style");
                    this.#styles[tag].id = "style--" + tag;
                    const styleBox = (this.shadowDom || this).querySelector(".component--styles");
                    (styleBox || this.shadowDom || this).appendChild(this.#styles[tag]);
                }
                //Return Created Style Tag
                return this.#styles[tag];
            }

            get styles() {
                const self = this;
                return {
                    clear: function (tag = "default") {
                        const styleTag = self.#style(tag);
                        if (styleTag.styleSheet) {
                            styleTag.styleSheet.cssText = "";
                        } else {
                            styleTag.innerHTML = "";
                            styleTag.appendChild(document.createTextNode(""));
                        }
                    },
                    add: function (styles, tag = "default") {
                        const styleTag = self.#style(tag);
                        const styleContent = Util.type(styles, "string")
                            ? styles
                            : new Styles(...(Util.type(styles, "array") ? styles : [styles])).asText();
                        if (styleTag.styleSheet) {
                            styleTag.styleSheet.cssText += styleContent;
                        } else {
                            styleTag.appendChild(document.createTextNode(styleContent));
                        }
                    },
                    replace: function (styles, tag = "default") {
                        const styleTag = self.#style(tag);
                        const styleContent = Util.type(styles, "string")
                            ? styles
                            : new Styles(...(Util.type(styles, "array") ? styles : [styles])).asText();
                        if (styleTag.styleSheet) {
                            styleTag.styleSheet.cssText = styleContent;
                        } else {
                            styleTag.innerHTML = "";
                            styleTag.appendChild(document.createTextNode(styleContent));
                        }
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
                if (this.debug) app.log("Stash", this.constructor.name, opperation, args);
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
                    if (this.debug) app.log("unStash", this.constructor.name, ...stashed);
                    if (this[stashed[0]]) this[stashed[0]](...stashed[1]);
                }
            }

            setDefined(prop, value) {
                this.#defined[prop] = value;
            }

            set state(value) {
                if (!this.constructor.allowedStates.includes(value)) {
                    throw new Error("State not allowed for component");
                }
                this._state.last = this._state.current;
                this._state.current = value;
                if (this.onStateChange) this.onStateChange(value, this._state.last);
            }

            get state() {
                return this._state.current;
            }

            /**
             * Initialize Observable Property
             * @method #setObservable
             * @param property
             * @param value
             */

            #setObservable(property, value = null) {
                //Check Config Properties Obj for Property Configs
                const config = this.#config.properties[property] || {};
                let aliases = [];

                if (property.includes("-")) {
                    //If property is dashed create alias for it in camelCase
                    let alias = property.split("-");
                    alias =
                        alias.shift() + alias.map((alias) => alias.charAt(0).toUpperCase() + alias.slice(1)).join("");
                    aliases.push(alias);
                }

                if (value !== null) {
                    //If value is passed set it
                    this.#defined[property] = value;
                } else if (config.default !== undefined && value === null) {
                    //If value is not passed and default is set in property config set default
                    value = config.default;
                    this.#defined[property] = value;
                }

                if (this[property] !== undefined) {
                    //If property is already set get value and delete from component
                    value = this[property];
                    this.#defined[property] = value;
                    delete this[property];
                }

                // debug('setObservable', this.constructor.name, property, value);

                if (this.debug) console.log("setObservable", this.constructor.name, property, value);

                //Define Property to instance
                Object.defineProperty(this, property, {
                    get: () => {
                        return this.#defined[property];
                    },
                    set: (value) => {
                        if (value == "null") value = null;
                        // app.log(this.#defined[property], value);
                        //If value is same return
                        if (this.#defined[property] === value) return;
                        //Value has changed mark in changed array
                        if (this.changed.indexOf(property) == -1) this.changed.push(property);
                        //Grab previous value
                        const old = this.#defined[property];
                        //Set New Value
                        this.#defined[property] = value;

                        //If Property Attr is Linked Update it.
                        if (config.linked) {
                            if (value !== null) this.setAttribute(property, value);
                        }

                        if (!this.#defined.connected) {
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

            _onPropertyChanged(property, old, value, config) {
                if (this.debug) app.log("onPropertyChanged", this.constructor.name, property, old, value, config);

                if (this.onPropertyChanged) this.onPropertyChanged(property, old, value);

                this.dispatchEvent(
                    new CustomEvent("propertychange", {
                        detail: { property: property, value: value, old: old },
                    })
                );

                if (config.after) {
                    if (typeof config.after == "string" && this[config.after]) {
                        this[config.after]();
                    } else if (typeof config.after == "function") {
                        const fn = config.after.bind(this);
                        fn();
                    }
                }
                if (config.forceRender) {
                    //Force render the component
                    this.render();
                }
            }

            /**
             *  @method connectedCallback
             *  Invoked each time the custom element is appended into a document-connected element.
             *  This will happen each time the node is moved, and may happen before the element's contents have been fully parsed.
             */

            connectedCallback() {
                if (this.onCreate) this.onCreate();

                //If Ready below code already ran
                if (!this.ready) {
                    //If Component has a template prepare for initialization

                    if (this.constructor.template) {
                        //Clone Template and append to dom
                        const clone = this.constructor.template.clone();
                        this.root.appendChild(clone);
                        this.#content = this.root.querySelector(".component--html");
                        //Initialize VDOM by parsing the component html
                        this.#vdom = VirtualDom.parseDom(this.#content);
                    }

                    if (this.debug) app.log(this.constructor.name, "CONNECTED");

                    if (type(this.resize, "function")) {
                        debug("Observing Resize", this.constructor.name);
                        Observe.size(this.#content).change((w, h) => this.resize(w, h));
                    }

                    if (type(this.onPosition, "function")) {
                        debug(Observe.position(this));
                        Observe.position(this).change((x, y) => this.onPosition(x, y));
                    }

                    if (!this.constructor.deferRender && this.rendered == false) this.render();
                    //Called on first connection try.
                    if (this.onFirstConnect) this.onFirstConnect();

                    setTimeout(() => {
                        //Call onReady on next tick
                        if (this.onReady) this.onReady();
                        this.ready = true;
                        this.dispatchEvent(new Event("ready"));
                        if (this.parentElement?.onCustomChildReady) {
                            this.parentElement.onCustomChildReady(this);
                        } else if (this.$.inShadow?.onCustomChildReady) {
                            this.$.shadowHost.onCustomChildReady(this);
                        }
                        if (this.ref("html")) this.ref("html").classList.add("connected");
                    }, 0);
                }

                this.#defined.connected = true;
                //Unstash all stashed events
                if (this.onBeforeConnect) this.onBeforeConnect();

                //Run all stashed events
                this.#unstash();

                if (this.onConnect) this.onConnect();
                this.dispatchEvent(new Event("connect"));

                if (this.$.customParent && this.$.customParent._onCustomChildConnect) {
                    //If elements parent is a custom element.then broadcast child connect.
                    this.$.customParent._onCustomChildConnect(this);
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
                this.#defined.connected = false;
                this.dispatchEvent(new Event("disconnect"));
                if (this.onDisconnect) return this.onDisconnect();
            }

            /**
             * Get Element ref from template
             * @method ref
             * @param name
             * @returns Dom Element
             */

            ref(name) {
                return this["#$" + name];
            }

            exportRefs() {
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
                this["#$" + ref] = el;
            }

            slot(name = "default") {
                return this.#slots[name] || null;
            }

            /**
             * @method render
             */

            render(fullRender) {
                //console.trace( this.rendered );

                if (fullRender) {
                    this.#content.innerHTML = "";
                }

                if (this.debug) console.warn(this.constructor.name, "RENDERING");
                if (this.beforeFirstRender && this.rendered == 0) this.beforeFirstRender();
                //Scope static html fn to currentscope
                const boundHTML = this.constructor.html.bind(this);
                const dataProxy = new Proxy(this.compileData(), this.constructor.renderProxy);
                //debug(this.#content);
                //debug(Attributes.extract(this.#content));
                const attributes = new Attributes(Attributes.extract(this.#content)).toString();
                const className = this.#content ? this.#content.className : "component--html";

                const html = `<div ref="html" ${attributes} >${boundHTML(dataProxy)}</div>`;
                let virtual = VirtualDom.parseHTML(html);

                if (this.beforeRender) virtual = this.beforeRender(virtual);

                const patch = VirtualDom.diff(this.#vdom, virtual);

                if (this.debug) debug(this.#content.innerHTML);
                patch(this.#content);

                this.#vdom = virtual;

                const refs = this.root.querySelectorAll("[ref]");
                for (let i = 0; i < refs.length; i++) {
                    const ref = refs[i].getAttribute("ref");
                    this.#refs[Util.String.camel(ref)] = refs[i];
                    if (!this["#$" + ref]) this["#$" + ref] = refs[i];
                    refs[i].removeAttribute("ref");
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

                const onClicks = this.root.querySelectorAll("[click]:not(.events-set)");
                for (let i = 0; i < onClicks.length; i++) {
                    const clickHandle = onClicks[i].getAttribute("click");
                    this._bindEvent("click", onClicks[i], clickHandle);
                }

                this.rendered++;

                this.dispatchEvent(new CustomEvent("rendered"));
                if (this.afterRender) this.afterRender();
            }

            renderEach(items) {
                return items.map((item) => tpl(item)).join(" \n ");
            }

            computedName() {
                return this.tagName.toLowerCase() + this._index;
            }

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

                    if (!this.#defined.connected) {
                        this.#stash("onAttributeDeleted", property);
                    } else {
                        if (this.onAttributeDeleted) this.onAttributeDeleted(property);
                    }
                }

                if (old === null && this.onAttributeAdded) {
                    if (this.hasAttribute(property)) {
                        if (!this.#defined.connected) {
                            this.#stash("onAttributeAdded", property);
                        } else {
                            if (this.onAttributeAdded) this.onAttributeAdded(property);
                        }
                    }
                }

                if (config.type) {
                    switch (config.type) {
                        case "int":
                        case "number":
                            value = Number(value);
                            break;
                        case "boolean":
                            if (value == "0" || value == "false" || value == 0) {
                                value = false;
                            } else if (value == "1" || value == "true" || value == 1) {
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

                if (!this.#defined.connected) {
                    return this.#stash("attributeChangedCallback", property, old, value);
                }

                if (this.debug) app.log("onAttributeChanged", this.constructor.name, property, old, value, config);

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

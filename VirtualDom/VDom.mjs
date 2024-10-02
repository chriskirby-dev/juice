import { type, empty } from "../Util/Core.mjs";
import VirtualDom from "./VirtualDom.mjs";
import VDomParser from "./Parser.mjs";

/**
 * VDom
 * @constructor
 * @param {*} content - HTML or VirtualDom object.
 * @param {*} options - Options object.
 */

class VDom {
    #references = {};
    html = "";
    tpl;
    vdom;
    dom;
    virtual;
    #staged = null;
    #rendered = null;
    CONTAINER_VDOM = {
        tag: "div",
        attributes: { class: "vdom--container" },
        children: [],
    };

    constructor(content = "", options = {}) {
        this.options = options;

        if (options.container) {
            this.container = type(options.container, "string")
                ? document.querySelector(options.container)
                : options.container;
        } else {
            this.container = document.createElement("div");
        }

        if (options.scope) {
            this.scope = options.scope;
        }

        this.tpl = document.createElement("template");
        this.root = document.createDocumentFragment();

        this.initialize();

        if (this.container.innerHTML.trim() !== "") {
        }

        if (content) this.stage(content);

        if (options.render) this.render();
    }

    package(vdom) {
        this.#staged = { ...this.CONTAINER_VDOM };
        this.#staged.children = type(vdom, "array") ? [...vdom] : [vdom];

        return this.#staged;
    }

    /**
     * Prepare new content  to be loaded on next render call
     * @param content {*}
     * @returns
     */

    stage(content) {
        let vdom;

        if (empty(content)) {
            return this.package([]);
        }

        switch (VDomParser.type(content)) {
            case "html":
                vdom = VDomParser.fromHTML(content);
                break;
            case "text":
                vdom = VDomParser.fromText(content);
                break;
            case "dom":
                vdom = VDomParser.fromDom(content);
                break;
            case "vdom":
                vdom = content;
                break;
        }

        //Insert content into a vdom wrapper
        this.package(vdom);

        return this.#staged;
    }

    //Add element to one or more references.

    addReference(element, ref = null) {
        if (!ref) return;
        const refs = ref.includes(",") ? ref.split(",").map((r) => r.trim()) : [ref];
        refs.map((ref) => {
            if (!this.#references[ref]) this.#references[ref] = [];
            this.#references[ref].push(element);
        });
    }

    hasRef(ref) {
        return this.#references[ref] ? this.#references[ref].length : false;
    }

    refs(ref) {
        return this.#references[ref] || [];
    }

    ref(ref) {
        return (this.#references[ref] && this.#references[ref][0]) || null;
    }

    /** Apply event handlers */

    applyEventHandel(el, eventHandle) {
        const handles = [eventHandle];
        if (eventHandle.includes("||")) handles = eventHandle.split("||");

        handles.forEach((handler) => {
            const [event, call] = handler.split("::");
            debug(event, call);
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
            let handlerFn = this.scope[handler] ? this.scope[handler].bind(this.scope) : function () {};

            el.addEventListener(event, (e) => {
                const respArgs = args.map((arg) => {
                    if (arg === "this") return element;
                    if (typeof arg == "string" && arg.indexOf("this.") === 0) return element[arg.replace("this.", "")];
                    return arg;
                });
                handlerFn = handlerFn.bind(self);
                return handlerFn(e, ...respArgs);
            });

            el.classList.add("events-set");
        });

        el.removeAttribute("event");
    }
    /**
     * Add all elements taht include a id attribute to index
     * @param {*} staged
     */
    indexStage(staged) {
        if (!staged && this.#staged) {
            staged = this.#staged;
            this.index = { ids: {} };
        }
        if (staged) {
            if (staged.attributes && staged.attributes.id) {
                this.index.ids[staged.attributes.id] = staged;
            }

            if (staged.children) {
                staged.children.forEach((child) => this.indexStage(child));
            }
        }
    }

    render(content) {
        if (content) this.stage(content);
        //Build new VDom from html
        if (!this.#staged) return false;

        //Create Patch for Current VDom with Staged VDom
        const patch = VirtualDom.diff(this.virtual, this.#staged);

        //Apply Patch to root node
        patch(this.root);

        //Pull References from new dom
        const refs = this.root.querySelectorAll("[ref]");
        for (let i = 0; i < refs.length; i++) {
            const ref = refs[i].getAttribute("ref");
            console.log(ref);
            this.addReference(refs[i], ref);
            refs[i].removeAttribute("ref");
        }

        const eventsEls = this.root.querySelectorAll("[event]");

        for (let i = 0; i < eventsEls.length; i++) {
            const el = eventsEls[i];
            const eventHandle = el.getAttribute("event");
            this.applyEventHandel(eventHandle);
        }

        this.indexStage();
        this.virtual = this.#staged;
        this.#staged = null;

        //If container is set but not currently parent
        if (this.container && this.root.parentNode !== this.container && this.container !== this.root) {
            this.container.appendChild(this.root);
        }

        return this.root;
    }

    find(id) {
        if (!this.#staged) {
            this.#staged = JSON.parse(JSON.stringify(this.virtual));
            this.indexStage();
        }
        const virtualElement = this.index.ids[id];
        return {
            replace() {},
            alter(tagName, attributes) {
                if (tagName) {
                    virtualElement.tag = tagName;
                }
                if (attributes) {
                    Object.assign(virtualElement.attributes, attributes);
                }
            },
            children(children) {
                virtualElement.children = [...arguments];
            },
            append(child) {
                virtualElement.children.push(...arguments);
            },
            prepend(child) {
                virtualElement.children.unshift(...arguments);
            },
        };
    }

    toHTML() {
        return this.root.innerHTML;
    }

    toVDom() {
        return this.#staged;
    }

    initialize() {
        //Initialize empty stage
        this.stage("");
        //Set empty virtual dom
        this.virtual = this.#staged;

        if (this.options.containerAsRoot) {
            this.container.classList.add("vdom--container");
            this.root = this.container;
            this.CONTAINER_VDOM = {
                tag: this.root.tagName,
                attributes: {},
            };
            for (let i = 0; i < this.container.attributes.length; i++) {
                this.CONTAINER_VDOM.attributes[this.container.attributes[i].name] = this.container.attributes[i].value;
            }
            return;
        }

        //Create container div if not set
        const initDiv = document.createElement("div");
        initDiv.classList.add("vdom--container");
        this.container.appendChild(initDiv);
        //Set Container to root
        this.root = initDiv;
    }
}

export default VDom;

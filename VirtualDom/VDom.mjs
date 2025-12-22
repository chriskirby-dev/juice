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
    template;
    vdom;
    dom;
    virtual;
    #staged = null;
    #rendered = null;
    containerVDom = {
        tag: "div",
        attributes: { class: "vdom--container" },
        children: []
    };

    /**
     * @param {string|VDom} [content] - HTML string or VDom object to be rendered.
     * @param {Object} [options] - Options object.
     * @param {HTMLElement} [options.container] - Element to render the VDom into.
     * @param {Object} [options.scope] - Object to scope the rendering to.
     * @param {boolean} [options.render=false] - Whether to render the VDom immediately.
     * @param {boolean} [options.containerAsRoot=false] - Whether to use the container as the root element.
     */
    constructor(content = "", options = {}) {
        this.options = options;
        this.container = this.initializeContainer(options.container);
        this.scope = options.scope || null;
        this.template = document.createElement("template");
        this.rootFragment = document.createDocumentFragment();

        this.initialize();

        if (content) {
            this.stage(content);
        }

        if (options.render) {
            this.render();
        }
    }

    initializeContainer(containerOption) {
        if (containerOption) {
            return typeof containerOption === "string" ? document.querySelector(containerOption) : containerOption;
        }
        return document.createElement("div");
    }

    /**
     * Packages the provided virtual DOM (vdom) into a container structure.
     * This container structure is a copy of the current containerVDom with the
     * provided vdom set as its children. The resulting structure is stored in
     * the #staged property.
     *
     * @param {Array|Object} vdom - The virtual DOM to be packaged. Can be a single
     *                              vdom object or an array of vdom objects.
     * @returns {Object} The packaged container structure with the vdom as children.
     */

    package(vdom) {
        const container = { ...this.containerVDom };
        container.children = Array.isArray(vdom) ? [...vdom] : [vdom];

        this.#staged = container;
        return this.#staged;
    }

    /**
     * Prepare new content  to be loaded on next render call
     * @param content {*}
     * @returns
     */

    stage(content) {
        let stagedVdom;

        if (empty(content)) {
            stagedVdom = this.package([]);
        } else {
            stagedVdom = this.package(VDomParser.parse(content, this.scope));
        }
        //console.log(stagedVdom);
        return stagedVdom;
    }

    //Add element to one or more references.

    addReferences(element, ref) {
        const references = ref.includes(",") ? ref.split(",") : [ref];
        references.forEach((ref) => {
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

    applyEventHandlers(el, eventHandlers) {
        const handlers = eventHandlers.split("||");
        handlers.forEach((handler) => {
            const [event, fnName] = handler.split("::");
            const args = handler.includes("(")
                ? handler
                      .split("(")
                      .pop()
                      .split(")")
                      .shift()
                      .split(",")
                      .map((arg) => arg.replace(/['"]/g, "").trim())
                : [];

            const handlerFn = this.scope[fnName] ? this.scope[fnName].bind(this.scope) : function () {};

            el.addEventListener(event, (e) => {
                const respArgs = args.map((arg) => {
                    if (arg === "this") return el;
                    if (typeof arg === "string" && arg.indexOf("this.") === 0) {
                        return el[arg.replace("this.", "")];
                    }
                    return arg;
                });
                const boundHandler = handlerFn.bind(this);
                return boundHandler(e, ...respArgs);
            });

            el.classList.add("events-set");
        });

        el.removeAttribute("event");
    }
    /**
     * Index elements with an 'id' attribute in the staged VDom
     * @param {Object} node - The node to index
     */
    indexVDom(node) {
        if (!node) return;

        this.index = this.index || { ids: {} };

        if (node.attributes?.id) {
            this.index.ids[node.attributes.id] = node;
        }

        if (node.children) {
            node.children.forEach((child) => this.indexVDom(child));
        }
    }

    render(content) {
        if (content) this.stage(content);

        if (!this.#staged) return false;

        const patch = VirtualDom.diff(this.currentVDom, this.#staged);
        //console.log("rootFragment", this.rootFragment);
        patch(this.rootFragment);

        const refs = this.rootFragment.querySelectorAll("[id]");
        for (const refEl of refs) {
            const ref = refEl.getAttribute("id");
            this.addReferences(refEl, ref);
            // refEl.removeAttribute("ref");
        }

        const eventEls = this.rootFragment.querySelectorAll("[event]");
        for (const eventEl of eventEls) {
            const eventHandle = eventEl.getAttribute("event");
            this.applyEventHandle(eventHandle);
        }

        this.indexVDom(this.#staged);
        this.currentVDom = this.#staged;
        this.#staged = null;

        if (!this.options.containerAsRoot && this.container && this.rootFragment.parentNode !== this.container) {
            this.container.appendChild(this.rootFragment);
        }

        return this.rootFragment;
    }

    find(id) {
        if (!this.#staged) {
            this.#staged = JSON.parse(JSON.stringify(this.virtual));
            this.indexVDom();
        }

        const element = this.index.ids[id];
        return {
            replace() {},
            alter(tagName, attributes) {
                if (tagName) {
                    element.tag = tagName;
                }
                if (attributes) {
                    Object.assign(element.attributes, attributes);
                }
            },
            children(...children) {
                element.children = children;
            },
            append(...children) {
                element.children.push(...children);
            },
            prepend(...children) {
                element.children.unshift(...children);
            }
        };
    }

    toHTML() {
        return this.rootFragment.innerHTML;
    }

    toVDom() {
        return this.#staged;
    }

    initialize() {
        // Initialize empty stage
        this.stage("");
        // Set empty virtual dom
        this.virtual = this.#staged;

        if (this.options.containerAsRoot) {
            this.container.classList.add("vdom--container");
            this.rootFragment = this.container;
            this.containerVDom = {
                tag: this.container.tagName,
                attributes: {}
            };

            for (const attribute of this.container.attributes) {
                this.containerVDom.attributes[attribute.name] = attribute.value;
            }

            return;
        }

        // Create container div if not set
        const containerDiv = document.createElement("div");
        containerDiv.classList.add("vdom--container");
        this.container.appendChild(containerDiv);
        // Set container to root
        this.rootFragment = containerDiv;
    }
}

export default VDom;

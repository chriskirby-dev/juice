/**
 * VDom class for virtual DOM management and rendering.
 * Provides staging, rendering, and diffing capabilities.
 * @module VirtualDom/VDom
 */

import { type, empty } from "../Util/Core.mjs";
import VirtualDom from "./VirtualDom.mjs";
import VDomParser from "./Parser.mjs";

/**
 * VDom
 * @constructor
 * @param {*} content - HTML or VirtualDom object.
 * @param {*} options - Options object.
 */

/**
 * Virtual DOM manager for staging, rendering, and updating DOM content.
 * Manages the lifecycle of virtual DOM nodes and their rendering to actual DOM.
 * @class VDom
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

    /**
     * Initializes container element from options.
     * @private
     * @param {string|Element} containerOption - Container selector or element
     * @returns {Element} The container element
     */
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
        // If containerAsRoot, don't wrap in container - content goes directly into root
        if (this.options.containerAsRoot) {
            this.#staged = Array.isArray(vdom) ? vdom : [vdom];
        } else {
            // Otherwise wrap in container
            const container = { ...this.containerVDom };
            container.children = Array.isArray(vdom) ? [...vdom] : [vdom];
            this.#staged = container;
        }
        return this.#staged;
    }

    /**
     * Prepares new content to be loaded on next render call.
     * Parses HTML or VDom objects and packages them into the staging area.
     * @param {string|Object|Array} content - HTML string, VDom object, or array of VDom objects
     * @returns {Object|Array} The staged virtual DOM structure
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

    /**
     * Adds an element to one or more reference collections.
     * References can be comma-separated to add to multiple collections.
     * @param {HTMLElement} element - The DOM element to add
     * @param {string} ref - Reference ID(s), comma-separated for multiple
     */
    addReferences(element, ref) {
        const references = ref.includes(",") ? ref.split(",") : [ref];
        references.forEach((ref) => {
            if (!this.#references[ref]) this.#references[ref] = [];
            this.#references[ref].push(element);
        });
    }

    /**
     * Checks if a reference ID exists and returns the count of elements.
     * @param {string} ref - Reference ID to check
     * @returns {number|boolean} Number of elements with this ref, or false if none
     */
    hasRef(ref) {
        return this.#references[ref] ? this.#references[ref].length : false;
    }

    /**
     * Gets all elements with a specific reference ID.
     * @param {string} ref - Reference ID to retrieve
     * @returns {HTMLElement[]} Array of elements with this reference
     */
    refs(ref) {
        return this.#references[ref] || [];
    }

    /**
     * Gets the first element with a specific reference ID.
     * @param {string} ref - Reference ID to retrieve
     * @returns {HTMLElement|null} First element with this reference, or null if not found
     */
    ref(ref) {
        return (this.#references[ref] && this.#references[ref][0]) || null;
    }

    /**
     * Applies event handlers to an element from a handler string.
     * Handler format: "event::functionName(arg1, arg2)" separated by "||" for multiple.
     * @param {HTMLElement} el - Element to attach handlers to
     * @param {string} eventHandlers - Handler string(s) to parse and apply
     */
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
     * Recursively indexes elements with 'id' attributes in the virtual DOM.
     * Creates an index map for fast lookups by ID.
     * @param {Object} node - The virtual DOM node to index
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

    /**
     * Renders the staged virtual DOM to actual DOM elements.
     * Optionally stages new content before rendering. Uses diffing to efficiently update only changed elements.
     * @param {string|Object|Array} [content] - Optional content to stage before rendering
     * @returns {DocumentFragment|boolean} The root fragment, or false if nothing staged
     */
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

    /**
     * Finds a virtual DOM element by ID and returns manipulation methods.
     * @param {string} id - The ID of the element to find
     * @returns {Object} Object with methods: replace, alter, children, append, prepend
     */
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

    /**
     * Appends virtual DOM elements to the staged content.
     * @param {...(Object|string)} elements - VDom objects or HTML strings to append
     * @returns {VDom} This instance for chaining
     */
    append(...elements) {
        if (!this.#staged) {
            this.#staged = JSON.parse(JSON.stringify(this.currentVDom || this.virtual));
        }

        const parsed = elements
            .map((el) => {
                if (typeof el === "string") {
                    return VDomParser.parse(el, this.scope);
                }
                return el;
            })
            .flat();

        if (this.options.containerAsRoot) {
            this.#staged.push(...parsed);
        } else {
            if (!this.#staged.children) {
                this.#staged.children = [];
            }
            this.#staged.children.push(...parsed);
        }

        return this;
    }

    /**
     * Prepends virtual DOM elements to the staged content.
     * @param {...(Object|string)} elements - VDom objects or HTML strings to prepend
     * @returns {VDom} This instance for chaining
     */
    prepend(...elements) {
        if (!this.#staged) {
            this.#staged = JSON.parse(JSON.stringify(this.currentVDom || this.virtual));
        }

        const parsed = elements
            .map((el) => {
                if (typeof el === "string") {
                    return VDomParser.parse(el, this.scope);
                }
                return el;
            })
            .flat();

        if (this.options.containerAsRoot) {
            this.#staged.unshift(...parsed);
        } else {
            if (!this.#staged.children) {
                this.#staged.children = [];
            }
            this.#staged.children.unshift(...parsed);
        }

        return this;
    }

    /**
     * Inserts virtual DOM elements at a reference ID within the staged content.
     * @param {string} refId - The ID of the reference element to insert at
     * @param {string} position - Position relative to ref: 'before', 'after', 'prepend', 'append'
     * @param {...(Object|string)} elements - VDom objects or HTML strings to insert
     * @returns {VDom} This instance for chaining
     */
    insertAt(refId, position = "after", ...elements) {
        if (!this.#staged) {
            this.#staged = JSON.parse(JSON.stringify(this.currentVDom || this.virtual));
        }

        this.indexVDom(this.#staged);

        const refNode = this.index?.ids?.[refId];
        if (!refNode) {
            console.warn(`Reference ID "${refId}" not found in virtual DOM`);
            return this;
        }

        const parsed = elements
            .map((el) => {
                if (typeof el === "string") {
                    return VDomParser.parse(el, this.scope);
                }
                return el;
            })
            .flat();

        // Find parent and index of reference node
        const findParentAndIndex = (node, target, parent = null) => {
            if (node === target) {
                return { parent, index: -1 };
            }

            if (node.children) {
                const index = node.children.indexOf(target);
                if (index !== -1) {
                    return { parent: node, index };
                }

                for (const child of node.children) {
                    const result = findParentAndIndex(child, target, node);
                    if (result) return result;
                }
            }
            return null;
        };

        const { parent, index } = findParentAndIndex(this.#staged, refNode) || {};

        if (!parent || index === -1) {
            console.warn(`Could not find parent of reference ID "${refId}"`);
            return this;
        }

        switch (position) {
            case "before":
                parent.children.splice(index, 0, ...parsed);
                break;
            case "after":
                parent.children.splice(index + 1, 0, ...parsed);
                break;
            case "prepend":
                if (!refNode.children) refNode.children = [];
                refNode.children.unshift(...parsed);
                break;
            case "append":
                if (!refNode.children) refNode.children = [];
                refNode.children.push(...parsed);
                break;
            default:
                console.warn(`Invalid position "${position}". Use: before, after, prepend, or append`);
        }

        return this;
    }

    /**
     * Converts the rendered virtual DOM to an HTML string.
     * @returns {string} HTML representation of the root fragment
     */
    toHTML() {
        return this.rootFragment.innerHTML;
    }

    /**
     * Returns the currently staged virtual DOM structure.
     * @returns {Object|Array|null} The staged virtual DOM, or null if nothing staged
     */
    toVDom() {
        return this.#staged;
    }

    /**
     * Initializes the VDom instance with empty stage and container setup.
     * Sets up root fragment and container structure based on options.
     * @private
     */
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

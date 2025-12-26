/**
 * Virtual DOM utilities for rendering and diffing.
 * Provides functions for rendering vNodes to DOM elements and updating elements.
 * @module VirtualDom/Render
 */

import { default as vElement, nextId } from "./Element.mjs";
import Parser from "./Parser.mjs";

import { type, empty } from "../Util/Core.mjs";

/**
 * Property name aliases for virtual DOM nodes.
 * Maps canonical names to alternative property names.
 * @private
 */
const aliases = {
    attributes: ["attrs"],
    ns: ["namespace"],
    tag: ["tagName"],
    children: ["content"],
};

/**
 * Conforms a vNode to standard property names using aliases.
 * @param {Object} vNode - Virtual node to conform
 * @returns {Object} Conformed virtual node
 * @private
 */
function conform(vNode) {
    for (const key in aliases) {
        if (empty(vNode[key])) {
            const aliasKey = aliases[key].find((alias) => vNode[alias] !== undefined);
            if (aliasKey) {
                vNode[key] = vNode[aliasKey];
                delete vNode[aliasKey];
            }
        }
    }

    if (vNode.ns) {
        vNode.options.namespace = vNode.ns;
        delete vNode.ns;
    }

    return vNode;
}

/**
 * Mounts a virtual node to the DOM.
 * @param {Object} vnode - Virtual node to mount
 * @param {Element} container - Container element
 * @private
 */
function mount(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.tag));
}

/**
 * Checks if two nodes have changed and need updating.
 * @param {*} node1 - First node
 * @param {*} node2 - Second node
 * @returns {boolean} True if nodes are different
 * @private
 */
function changed(node1, node2) {
    return typeof node1 !== typeof node2 || (typeof node1 === "string" && node1 !== node2) || node1.type !== node2.type;
}

/**
 * Updates a DOM element by comparing old and new virtual nodes.
 * Efficiently patches only the changed parts of the DOM tree.
 * @param {Element} $parent - Parent DOM element
 * @param {Object} newNode - New virtual node
 * @param {Object} oldNode - Old virtual node
 * @param {number} [index=0] - Child index
 */
export const updateElement = ($parent, newNode, oldNode, index = 0) => {
    if (!oldNode) {
        $parent.appendChild(render(newNode));
    } else if (!newNode) {
        $parent.removeChild($parent.childNodes[index]);
    } else if (changed(newNode, oldNode)) {
        $parent.replaceChild(render(newNode), $parent.childNodes[index]);
    } else if (newNode.tag) {
        const newLength = newNode.children.length;
        const oldLength = oldNode.children.length;
        for (let i = 0; i < newLength || i < oldLength; i++) {
            updateElement($parent.childNodes[index], newNode.children[i], oldNode.children[i], i);
        }
    }
};

//vNode: Virtual dom element In the form of the object consisting of:
//tag: The tag name of the element

const renderElement = (vNode, withRefs, refs = {}) => {
    vNode = conformVNode(vNode);
    if (!vNode) return document.createTextNode("");
    if (typeof vNode === "string") return document.createTextNode(vNode);
    if (Array.isArray(vNode)) {
        const fragment = document.createDocumentFragment();
        vNode.forEach((node) => fragment.appendChild(renderElement(node)));
        return fragment;
    }
    let tag = vNode.tag;
    const { attributes = {}, children = [], options = {} } = vNode;
    if (!tag && attributes) tag = "div";
    if (!tag) return "";
    const element = options.namespace ? document.createElementNS(options.namespace, tag) : document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        if (key === "ref") refs[key] = element;
        try {
            element.setAttribute(key, value);
        } catch (error) {
            console.warn(error);
        }
    }
    if (options.events) {
        for (const event in options.events) {
            element.addEventListener(event, options.events[event], false);
        }
    }
    if (!attributes["data-vid"]) {
        attributes["data-vid"] = nextId();
    }
    if (typeof children === "string") children = [children];
    for (const child of children) {
        if (tag.toLowerCase() === "template") {
            element.innerHTML += child;
        } else {
            const renderedChild = renderElement(child, withRefs, refs);
            element.appendChild(renderedChild);
        }
    }
    return withRefs ? [element, refs] : element;
};

const conformVNode = (vNode) => {
    if (vNode === undefined) return "";
    for (const key in aliases) {
        if (vNode[key] === undefined) {
            const aliasKey = aliases[key].find((alias) => vNode[alias] !== undefined);
            if (aliasKey) {
                vNode[key] = vNode[aliasKey];
                delete vNode[aliasKey];
            }
        }
    }
    if (vNode.ns) {
        vNode.options.namespace = vNode.ns;
        delete vNode.ns;
    }
    return vNode;
};

function VDomRender(vNode) {
    this.vdom = renderElement(vNode, {});
    console.log(this.vdom);

    this.ref = function (id) {
        return this.vdom[1][id];
    };
}

VDomRender.prototype.valueOf = function () {
    return this.vdom[0];
};

const render = (vNode) => {
    if (type(vNode, "array")) {
    } else if (type(vNode, "string")) {
        return document.createTextNode(vNode);
    }

    return renderElement(vNode);
};

export const renderWithRefs = (vNode, refs = {}) => {
    if (typeof vNode === "string") {
        return document.createTextNode(vNode);
    }
    return renderElement(vNode, {});
};

export default render;
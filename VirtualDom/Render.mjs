import { default as vElement, nextId } from "./Element.mjs";
import Parser from "./Parser.mjs";

import { type, empty } from "../Util/Core.mjs";

function conform(vNode) {
    const aliases = {
        attributes: ["attrs"],
        ns: ["namespace"],
        tag: ["tagName"],
        children: ["content"],
    };
    for (let alias in aliases) {
        if (empty(vNode[alias])) {
            const existing = aliases[alias].filter((a) => vNode[a] !== undefined);
            if (existing.length > 0) {
                vNode[alias] = vNode[existing[0]];
                delete vNode[existing[0]];
            }
        }
    }

    if (vNode.ns) {
        vNode.options.namespace = vNode.ns;
        delete vNode.ns;
    }

    return vNode;
}

function mount(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.tag));
}

function changed(node1, node2) {
    return typeof node1 !== typeof node2 || (typeof node1 === "string" && node1 !== node2) || node1.type !== node2.type;
}

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

const renderEl = (vNode, refs = null) => {
    conform(vNode);

    //If V node is null or undefined create empty text node
    if (!vNode) return document.createTextNode("");
    //If the vnode is the text node representing that strings a type of string
    if (type(vNode, "string")) return document.createTextNode(vNode);
    //If V node is in an array create a document fragment and add each node to it
    else if (type(vNode, "array")) {
        const fragment = document.createDocumentFragment();
        vNode.forEach((node) => fragment.append(renderEl(node)));
        return fragment;
    }
    if (!vNode.options) vNode.options = {};
    const { tag, attributes, children = [], options = {} } = vNode;

    //If tag is not specified but attributes are present and must be an element default to div
    if (!tag && attributes) tag = "div";
    if (!tag) return "";
    ///console.log(vNode);
    let el = options.namespace ? document.createElementNS(options.namespace, tag) : document.createElement(tag);

    for (const [k, v] of Object.entries(attributes)) {
        if (refs && k == "ref") refs[k] = el;
        // console.log(el);
        try {
            el.setAttribute(k, v);
        } catch (e) {
            console.warn(e);
        }
    }

    if (options.events) {
        for (let event in options.events) {
            el.addEventListener(event, options.events[event], false);
        }
    }

    if (!attributes["data-vid"]) {
        attributes["data-vid"] = nextId();
    }

    if (typeof children == "string") children = [children];

    for (const child of children) {
        if (tag.toLowerCase() == "template") {
            el.innerHTML += child;
        } else {
            const _child = renderEl(child, refs);
            el.appendChild(Array.isArray(_child) ? _child[0] : _child);
        }
    }

    return refs ? [el, refs] : el;
};

function VDomRender(vNode) {
    this.vdom = renderEl(vNode, {});
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

    return renderEl(vNode);
};

export const renderWithRefs = (vNode, refs = {}) => {
    if (typeof vNode === "string") {
        return document.createTextNode(vNode);
    }
    return renderEl(vNode, {});
};

export default render;

import { ipcRenderer } from "electron";
let resetting = false;

export function resetComplete() {
    return (resetting = false);
}

function line(content) {
    const l = document.createElement("div");
    l.innerHTML = content;
    return l;
}

let busyElement;

const STATE_VALS = {};

export const state = {
    get busy() {
        return STATE_VALS.busy;
    },
    set busy(value) {
        if (value === STATE_VALS.busy) return;
        STATE_VALS.busy = value;
        const attrVal = value ? "busy" : "idle";
        if (busyElement) busyElement.setAttribute("state", attrVal);
        return value;
    },
};

function createStyleSheet() {
    const styleSheetId = "vdom-styles";
    const exists = document.getElementById(styleSheetId);
    if (exists) return;

    busyElement = document.getElementById("status");
    if (state.busy) busyElement.setAttribute("state", "busy");

    const styleEl = document.createElement("style");
    styleEl.id = styleSheetId;
    styleEl.ref = "stylesheet";

    styleEl.appendChild(document.createTextNode(""));

    document.head.appendChild(styleEl);

    const sheet = styleEl.sheet;

    sheet.insertRule(
        `.vdom-element {
            display: block;
            white-space: pre-wrap;
            font-size: 10px;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element:not(.children) .vdom-content {
            display: none;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element.children .vdom-content {
            display: block;
            white-space: pre-wrap;
            padding-left: 15px;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-string {
            display: block;
            white-space: pre-wrap;
            padding-left: 20px;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-open {
            color: #13167d;
            font-weight: bold;
            white-space: pre-wrap;
            display: inline-block;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-close {
            color: #13167d;
            font-weight: bold;
            display: inline-block;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.open-tag:after {
            content: " >";
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element:not(.children) .open-tag:after {
            content: " />";
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element:not(.children) .vdom-close {
            display: none;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element .attr-name {
            color: #0b4fe0;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element .attr-value {
            color: #e0520b;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element.comment {
            color: #999999;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element.comment:before {
            content: "/* ";
            display: inline-block;
        }`,
        sheet.cssRules.length
    );

    sheet.insertRule(
        `.vdom-element.comment:after {
            content: " */";
            display: inline-block;
        }`,
        sheet.cssRules.length
    );

    console.log("StyleSheet created", sheet.cssRules.length);
}

export function toVCode(node, indent = 0, index = []) {
    let open, close, content;

    let { attributes = [], children = [] } = node;

    const tag = node.localName || node.nodeName;

    /* console.log("tag", tag);
    console.log("attributes", attributes);
    console.log("children", children);
    */

    const element = document.createElement("div");
    element.classList.add("vdom-element");

    const openElement = document.createElement("div");
    openElement.classList.add("vdom-open");
    const closeElement = document.createElement("div");
    closeElement.classList.add("vdom-close");
    const contentElement = document.createElement("div");
    contentElement.classList.add("vdom-content");

    if (index.length == 0) createStyleSheet();

    if (node.nodeId) {
        element.setAttribute("node-id", node.nodeId);
        index[node.nodeId] = element;
        attributes.push("node-id", node.nodeId);
    }
    if (node.backendNodeId) {
        element.setAttribute("backend-id", node.backendNodeId);
        attributes.push("backend-id", node.backendNodeId);
    }

    if (node.nodeType == 3) {
        element.classList.add("string");
        contentElement.innerHTML = node.nodeValue
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        element.appendChild(contentElement);
        return { element, index };
    }

    if (node.nodeType == 8) {
        element.classList.add("comment");
        contentElement.innerHTML = node.nodeValue.trim();
        element.appendChild(contentElement);
        return { element, index };
    }

    if (tag) {
        element.classList.add(`tag-${tag.toLowerCase()}`);
        open = `<span class="open-tag">&lt;${tag}`;
        if (attributes && Object.keys(attributes).length > 0) {
            let attrString = "";
            for (let i = 0; i < attributes.length; i += 2) {
                const attr = attributes[i];

                attrString += ` <span class="attr-name">${attr}</span>="<span class="attr-value">${
                    attributes[i + 1]
                }</span>"`;
            }
            open += ` ${attrString} `;
        }
        open += "</span>";
        openElement.innerHTML = open;
        close = `<span class="vdom-close-text">&lt;/${tag}&gt;</span>`;
        closeElement.innerHTML = close;

        if (children && children.length > 0) {
            for (let child of children) {
                const { element: childElement } = toVCode(child, indent + 1, index);
                if (childElement) contentElement.appendChild(childElement);
            }
            element.classList.add("children");
        }
        element.appendChild(openElement);
        element.appendChild(contentElement);
        element.appendChild(closeElement);
    }

    return { element, index };
}

export function resetVDom() {
    resetting = true;
    ipcRenderer.send("vdom:reset");
}

export class alterVCode {
    static createElement(tag, attributes, children) {
        if (resetting) return;
        const el = document.createElement(tag);
        if (attributes && Object.keys(attributes).length > 0) {
            for (let attr in attributes) {
                el.setAttribute(attr, attributes[attr]);
            }
        }
        if (children && children.length > 0) {
            for (let child of children) {
                alterVCode.appendChild(el, child);
            }
        }
        return el;
    }

    static createNode(nodeId, tag, attributes, children) {
        if (resetting) return;
    }

    static removeElement(e, { nodeId }) {
        if (resetting) return;
        console.log("removeElement", arguments);
        document.querySelector(`[node-id="${nodeId}"]`).remove();
    }

    static appendChild(e, { nodeId, previousNodeId }) {
        if (resetting) return;
        console.log("appendChild", arguments);
        const node = document.querySelector(`[node-id="${nodeId}"]`);
        const previous = document.querySelector(`[node-id="${previousNodeId}"]`);
        previous.parentNode.insertBefore(node, previous.nextSibling);
    }

    static updateCharacterData(e, { nodeId, characterData }) {
        if (resetting) return;
        console.log("updateCharacterData", arguments);
        const node = document.querySelector(`[node-id="${nodeId}"]`);
        node.textContent = characterData;
    }

    static insertBefore(e, { node, previousNodeId, parentNodeId }) {
        if (resetting) return;
        console.log("insertBefore", node, previousNodeId, parentNodeId);
        const { element, index } = toVCode(node);
        const parent = document.querySelector(`[node-id="${parentNodeId}"]`);
        if (!parent) return resetVDom();
        const previous = document.querySelector(`[node-id="${previousNodeId}"]`);
        console.log(parent, previous);
        if (!previous) return resetVDom();
        previous.parentNode.insertBefore(element, previous);
    }

    static updateAttribute(e, { nodeId, name, value }) {
        if (resetting) return;
        console.log("updateAttribute", arguments);
        const node = document.querySelector(`[node-id="${nodeId}"]`);
        node.setAttribute(name, value);
    }

    static removeAttribute(e, { nodeId, name }) {
        if (resetting) return;
        console.log("removeAttribute", nodeId, name);
        const node = document.querySelector(`[node-id="${nodeId}"]`);
        node.removeAttribute(name);
    }
}

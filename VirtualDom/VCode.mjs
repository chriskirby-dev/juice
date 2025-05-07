function line(content) {
    const l = document.createElement("div");
    l.innerHTML = content;
    return l;
}

function createStyleSheet() {
    const styleSheetId = "vdom-styles";
    const exists = document.getElementById(styleSheetId);
    if (exists) return;

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

    console.log("StyleSheet created", sheet.cssRules.length);
}

export function toVCode(vdom, indent = 0, index = []) {
    let open, close, content;

    const element = document.createElement("div");
    element.classList.add("vdom-element");

    const openElement = document.createElement("div");
    openElement.classList.add("vdom-open");
    const closeElement = document.createElement("div");
    closeElement.classList.add("vdom-close");
    const contentElement = document.createElement("div");
    contentElement.classList.add("vdom-content");

    if (index.length == 0) createStyleSheet();

    if (vdom.nodeId) {
        element.setAttribute("node-id", vdom.nodeId);
        index[vdom.nodeId] = element;
    }
    if (vdom.backendNodeId) {
        element.setAttribute("backend-id", vdom.backendNodeId);
    }

    if (typeof vdom === "string") {
        element.classList.add("string");
        contentElement.innerHTML = vdom;
        element.appendChild(contentElement);
        return { element, index };
    }

    if (typeof vdom === "object" && vdom.tag) {
        element.classList.add(vdom.tag);
        open = `<span class="open-tag">&lt;${vdom.tag}`;
        if (vdom.attributes && Object.keys(vdom.attributes).length > 0) {
            let attrString = "";
            for (let attr in vdom.attributes) {
                attrString += ` <span class="attr-name">${attr}</span>="<span class="attr-value">${vdom.attributes[attr]}</span>"`;
            }
            open += ` ${attrString} `;
        }
        open += "</span>";
        openElement.innerHTML = open;
        close = `<span class="vdom-close-text">&lt;/${vdom.tag}&gt;</span>`;
        closeElement.innerHTML = close;

        if (vdom.children && vdom.children.length > 0) {
            for (let child of vdom.children) {
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

export class alterVCode {
    static createElement(tag, attributes, children) {
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

    static createNode(nodeId, tag, attributes, children) {}

    static removeElement(nodeId) {
        console.log("removeElement", arguments);
        document.querySelector(`[node-id="${nodeId}"]`).remove();
    }

    static appendChild(nodeId, previousNodeId) {
        console.log("appendChild", arguments);
        const node = document.querySelector(`[node-id="${nodeId}"]`);
        const previous = document.querySelector(`[node-id="${previousNodeId}"]`);
        previous.parentNode.insertBefore(node, previous.nextSibling);
    }

    static updateCharacterData(nodeId, characterData) {
        console.log("updateCharacterData", arguments);
        const node = document.querySelector(`[node-id="${nodeId}"]`);
        node.textContent = characterData;
    }

    static insertBefore(newNode, previousNodeId) {
        console.log("insertBefore", arguments);
        const node = document.querySelector(`[node-id="${nodeId}"]`);
        const previous = document.querySelector(`[node-id="${previousNodeId}"]`);
        previous.parentNode.insertBefore(node, previous);
    }

    static updateAttribute(nodeId, name, value) {
        console.log("updateAttribute", arguments);
    }

    static removeAttribute(nodeId, name) {
        console.log("removeAttribute", arguments);
    }
}

export function testing() {
    let output = "";
    const indentation = "  ".repeat(indent);

    if (typeof vdom === "string") {
        return `${indentation}${vdom}\n`;
    }

    if (typeof vdom === "object" && vdom.tag) {
        output += `${indentation}&lt;${vdom.tag}`;

        if (vdom.attrs && Object.keys(vdom.attrs).length > 0) {
            for (let attr in vdom.attrs) {
                output += ` ${attr}="${vdom.attrs[attr]}"`;
            }
        }

        output += "&gt;\n";

        if (vdom.children && vdom.children.length > 0) {
            for (let child of vdom.children) {
                output += testing(child, indent + 1);
            }
        }

        output += `${indentation}&lt;/${vdom.tag}&gt;\n`;
    }

    return output;
}

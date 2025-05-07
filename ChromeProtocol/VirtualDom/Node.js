import DomHelper from "../Dom/Helper.js";
import Helper from "./Helper.js";

const NODE_TYPES = [];
NODE_TYPES[1] = "Element";
NODE_TYPES[2] = "Attribute";
NODE_TYPES[3] = "Text";
NODE_TYPES[4] = "CDATA";
NODE_TYPES[5] = "EntityReference";
NODE_TYPES[6] = "Entity";
NODE_TYPES[7] = "ProcessingInstruction";
NODE_TYPES[8] = "Comment";
NODE_TYPES[9] = "Document";
NODE_TYPES[10] = "DocumentType";
NODE_TYPES[11] = "DocumentFragment";

class ClassList extends Array {
    node;

    constructor(node) {
        super();
        this.node = node;
        this.update();
    }

    add(className) {
        this.push(className);
        this.node.setAttribute("class", this.join(" "), true);
    }

    remove(className) {
        this.splice(this.indexOf(className), 1);
        this.node.setAttribute("class", this.join(" "), true);
    }

    toggle(className) {
        if (this.indexOf(className) === -1) {
            this.push(className);
        } else {
            this.splice(this.indexOf(className), 1);
        }
        this.node.setAttribute("class", this.join(" "), true);
    }

    contains(className) {
        return this.indexOf(className) !== -1;
    }

    update() {
        if (this.node.attributes && this.node.attributes.class) {
            this.push(...this.node.attributes.class.split(" "));
        }
    }
}

export class TextNode {
    constructor(data) {
        this.update(data);
    }

    get nodeId() {
        return this.data.nodeId;
    }

    get backendId() {
        return this.data.backendNodeId;
    }

    get textContent() {
        return this.data.nodeValue;
    }

    set textContent(text) {
        this.data.nodeValue = text;
        this.constructor.DOM.setNodeValue({ nodeId: this.nodeId, value: text });
    }

    toObject() {
        return this.data;
    }

    update(data) {
        this.data = data;
    }
}

export class Node {
    static DOM;
    static classIndex = {};

    data;

    constructor(data) {
        this.update(data);
    }

    get tagName() {
        return this.data.localName;
    }

    get isFrame() {
        return this.data.frameId ? true : false;
    }

    get shadowRoot() {
        return this.data.shadowRoots || null;
    }

    get id() {
        return this.data.attributes.id;
    }

    get nodeId() {
        return this.data.nodeId;
    }

    get backendId() {
        return this.data.backendNodeId;
    }

    get type() {
        return NODE_TYPES[this.data.nodeType];
    }

    get children() {
        return this.data.children;
    }

    get parent() {
        return this.constructor.vdom.getNodeById(this.data.parentId);
    }

    get textContent() {
        return this.data.nodeValue;
    }

    set textContent(text) {
        this.data.nodeValue = text;
        this.constructor.DOM.setNodeValue({ nodeId: this.nodeId, value: text });
    }

    get outerHTML() {
        return this.constructor.DOM.getOuterHTML({ backendNodeId: this.backendId });
    }

    async resolve() {
        return await this.constructor.DOM.resolveNode({ backendNodeId: this.backendId });
    }

    async objectId() {
        const remoteObject = await this.resolve();
        return remoteObject.objectId;
    }

    callFunction() {
        this.constructor.Runtime.callFunctionOn();
    }

    setAttribute(name, value, apply) {
        this.attributes[name] = value;
        if (apply) this.constructor.DOM.setAttributeValue({ nodeId: this.nodeId, name, value });
    }

    removeAttribute(name, apply) {
        delete this.attributes[name];
        if (apply) this.constructor.DOM.removeAttribute({ nodeId: this.nodeId, name });
    }

    async querySelector(selector) {
        return await this.constructor.vdom.querySelector(selector, this.nodeId);
    }

    async querySelectorAll(selector) {
        return await this.constructor.vdom.querySelectorAll(selector, this.nodeId);
    }

    scrollIntoView() {
        this.constructor.DOM.scrollIntoViewIfNeeded({ backendNodeId: this.backendId });
    }

    async getClientBoundingRect() {
        // Get the content quads for the element (assuming the element is not transformed)
        const { quads } = await this.constructor.DOM.getContentQuads({ backendNodeId: this.backendId });
        //debug('quads', quads);
        // Extract the first quad (assuming the element is not transformed)
        const quad = quads[0];
        if (quad) {
            // Calculate client rect
            this.rect = {
                top: Math.min(quad[1].y, quad[2].y),
                left: Math.min(quad[0].x, quad[1].x),
                width: Math.abs(quad[2].x - quad[1].x),
                height: Math.abs(quad[2].y - quad[0].y),
            };
        }
        return this.rect;
    }

    get children() {
        return this.data.children.map((child) => this.constructor.vdom.getNodeByBackendId(child));
    }

    set children(children) {
        this.data.children = children;
    }

    child(index) {
        return this.constructor.vdom.getNodeByBackendId(this.children[index]);
    }

    addChild(childNode, previousNode, apply = true) {
        if (childNode === previousNode) return;
        console.log(childNode);
        if (!this.data.children) this.data.children = [];
        if (!(childNode instanceof Node) && !(childNode instanceof TextNode)) {
            childNode = this.constructor.vdom.getNodeByBackendId(childNode);
        }

        if (previousNode && !(previousNode instanceof Node) && !(previousNode instanceof TextNode)) {
            previousNode = this.constructor.vdom.getNodeByBackendId(previousNode);
        }

        if (!previousNode) {
            this.data.children.push(childNode.backendId);
        } else {
            this.data.children.splice(this.data.children.indexOf(previousNode.backendId), 0, childNode);
        }
    }

    removeChild(childNode) {
        if (!(childNode instanceof Node) && !(childNode instanceof TextNode) && typeof childNode === "number") {
            //If childNode is number, it's backendId
            childNode = this.constructor.vdom.getNodeByBackendId(childNode);
        }

        if (!childNode) return;

        //Remove from this nodes child list
        this.data.children = this.data.children.filter((backendId) => backendId == childNode.backendId);

        this.constructor.DOM.removeNode({ nodeId: childNode.nodeId });

        this.constructor.vdom.removeNode(childNode);
    }

    remove() {
        //Remove All Children
        this.children.forEach((child) => child.remove());
        //Remove Nodefrom Parent
        if (this.parent) this.parent.removeChild(this);
        //Cleanup Virtual Dom
        this.constructor.vdom.removeNode(this);
    }

    addEventListener(type, callback) {
        this.classList.add(`node-b${this.backendId}`);
    }

    toVDom() {
        const vdom = Object.create(null);
        Object.assign(vdom, this.data);
        vdom.tag = this.tagName.toLowerCase();
        vdom.attributes = { ...this.attributes };
        if (vdom.children)
            vdom.children = vdom.children.map((c) => this.constructor.vdom.getNodeByBackendId(c).toVDom());
        return vdom;
    }

    toObject() {
        const data = Object.create(null);
        Object.assign(data, this.data);

        if (data.children.length > 0) {
            data.children = data.children.map((c) => {
                const node = this.constructor.vdom.getNodeByBackendId(c);
                return node.toObject ? node.toObject() : node.data;
            });
        }

        return data;
    }

    update(data = {}) {
        this.data = data;

        if (data.attributes) this.attributes = Helper.parseAttributeArray(data.attributes);

        if (this.classList) {
            this.classList.forEach((cls) =>
                Node.classIndex[cls] > 1 ? Node.classIndex[cls]-- : delete Node.classIndex[cls]
            );
        } else {
            this.classList = new ClassList(this);
        }

        if (this.attributes && this.attributes.class) {
            this.classList.forEach((cls) =>
                Node.classIndex[cls] ? Node.classIndex[cls]++ : (Node.classIndex[cls] = 1)
            );
        }

        if (data.children) {
            //Map children to backend ids
            data.children = data.children.map((child) => child.backendNodeId);
        } else {
            data.children = [];
        }

        this.selector = Helper.makeSelector(this);
    }
}

export class Document extends Node {
    static instances = [];

    constructor(data) {
        super(data);
        Document.instances.push(this);
    }
}

export class Frame extends Node {
    static instances = [];

    constructor(data) {
        super(data);
        Frame.instances.push(this);
    }
}

export default Node;

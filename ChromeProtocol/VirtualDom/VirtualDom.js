import { Node, TextNode, Document, Frame } from "./Node.js";
import DomainWrapper from "../DomainWrapper.js";
import Helper from "./Helper.js";
import Tree from "./Tree.js";

import { createDelay } from "../../Util/Timers.mjs";

class VirtualDom extends DomainWrapper {
    static uses = ["DOM", "Page", "DOMDebugger", "Runtime"];

    nodes = [];
    index = { id: [], backend: [] };

    async getRootElement(depth = -1) {
        const { DOM } = this.domains;

        const { root: rootElement } = await DOM.getDocument({
            depth,
            pierce: true,
        });

        if (!rootElement) {
            throw new Error("Failed to retrieve the root document element.");
        }

        return rootElement;
    }

    get rootNode() {
        return this.getNodeByBackendId(this.root.backendNodeId);
    }

    async getTree() {
        return new Tree(this);
    }

    async querySelectorBackend(selector, backendNodeId) {
        const { DOM } = this.domains;
        if (!backendNodeId) {
            const root = await this.getRootElement(0);
            backendNodeId = root.backendNodeId;
        }
        const { node } = await DOM.describeNode({ backendNodeId });
        debug("querySelectorBackend", selector, backendNodeId, node);
        return await this.querySelector(selector, node.nodeId);
    }

    async querySelector(selector, contextNodeId) {
        const { DOM } = this.domains;
        if (contextNodeId) contextNodeId = await this.getRootElement(0).nodeId;
        debug("querySelector", selector, contextNodeId);
        const { nodeId } = await DOM.querySelector({ nodeId: contextNodeId, selector: selector });
        // const frame = this.viewport.frameByNodeId(frameNodeId);
        return this.getNodeById(nodeId);
    }

    async querySelectorAllBackend(selector, backendNodeId) {
        const { DOM } = this.domains;
        if (!backendNodeId) {
            const root = await this.getRootElement(0);
            backendNodeId = root.backendNodeId;
        }
        const { node } = await DOM.describeNode({ backendNodeId });
        debug("querySelectorAllBackend", selector, backendNodeId, node);
        return await this.querySelectorAll(selector, node.nodeId);
    }

    async querySelectorAll(selector, contextNodeId) {
        const { DOM } = this.domains;
        if (contextNodeId === undefined) contextNodeId = await this.getRootElement(0).nodeId;
        debug("querySelectorAll", selector, contextNodeId);
        const { nodeIds } = await DOM.querySelectorAll({ nodeId: contextNodeId, selector: selector });
        debug("nodeIds", nodeIds);
        for (let nodeId of nodeIds) {
            const node = this.getNodeById(nodeId);
            const descr = await DOM.describeNode({ nodeId });
            debug("node", node, descr);
        }

        return nodeIds.map((nodeId) => this.getNodeById(nodeId));
    }

    registerNode(node, frame) {
        const { nodeId, backendNodeId } = node;
        //debug("registerNode", node, nodeId, backendNodeId);

        let children = [];
        let shadows = [];
        let element;

        if ((element = this.getNodeByBackendId(backendNodeId))) {
            //if already registered, update it
            element.update(node);
        } else {
            if (node.children && node.children.length) children = node.children;
            if (node.shadowRoots && node.shadowRoots.length) shadows = node.shadowRoots;

            if (node.frameId) {
                //If Frame, create Frame object
                element = new Frame(node);
                frame = node.frameId;
            } else if (node.nodeName === "#document") {
                //If Document, create Document object
                element = new Document(node);
            } else if (node.nodeName === "#document-fragment") {
                // node.localName = 'DOCUMENT-FRAGMENT';
            } else if (node.nodeName === "#text") {
                //If Text, create TextNode object
                element = new TextNode(node);
            } else {
                //If Node, create Node object
                element = new Node(node);
            }

            this.index.backend[backendNodeId] = element;
            this.index.id[nodeId] = element;
        }

        if (children && children.length) {
            children.forEach((child) => this.registerNode(child, frame));
        }

        if (shadows && shadows.length) {
            shadows.forEach((shadow) => this.registerNode(shadow, frame));
        }

        if (node.frameId) {
        }

        if (node.contentDocument) {
            this.registerNode(node.contentDocument, frame);
        }

        return element;
    }

    removeNode(node) {
        const { nodeId, backendId, parentId } = node;
        //debug("removeNode", node, nodeId, backendId);

        delete this.index.backend[backendId];
        delete this.index.id[nodeId];

        if (parentId) this.getNodeById(parentId).removeChild(backendId);

        if (node.shadowRoots && node.shadowRoots.length) {
            node.shadowRoots.forEach((shadow) => this.removeNode(shadow));
        }
    }

    getNodeById(id) {
        return this.index.id[id] || null;
    }

    getNodeByBackendId(id) {
        return this.index.backend[id] || null;
    }

    async toJson() {
        function jsonifyNode(node) {
            let children;
            let shadows;

            const attrs = Helper.parseAttributeArray(node.attributes);

            if (node.nodeName === "#comment") {
                node.localName = "#comment";
            } else if (node.frameId) {
                if (!node.localName) node.localName = "FRAME";
                attrs["frameId"] = node.frameId;
            } else if (node.nodeName === "#document") {
                node.localName = "DOCUMENT";
            } else if (node.nodeName === "#document-fragment") {
                node.localName = "DOCUMENT-FRAGMENT";
            } else if (node.nodeName === "#text") {
                return node.nodeValue;
            } else if (node.localName == "body") {
            } else {
                if (attrs && node.nodeId) {
                    attrs["nodeId"] = `${node.nodeId}`;
                    attrs["backendNodeId"] = `${node.backendNodeId}`;
                }
            }

            if (node.children && node.children.length) {
                children = node.children.map((child) => jsonifyNode(child));
            }
            if (node.shadowRoots && node.shadowRoots.length) shadows = node.shadowRoots;

            return { tag: node.localName, attributes: attrs, children: children };
        }

        const { DOM, Page } = this.domains;

        const { root } = await DOM.getDocument({
            depth: -1,
            pierce: true,
        });

        return jsonifyNode(root);
    }

    async onDomContentReady() {
        const { DOM, Page } = this.domains;
        if (this.readyBusy == true) return;
        this.readyBusy = true;

        console.log("onDomContentReady");

        const { root } = await DOM.getDocument({
            depth: -1,
            pierce: true,
        });

        this.reset(root);

        console.log("root", root);

        this.registerNode(root);

        this.emit("update", "reset", root);

        this.delay(500).then(() => {
            // this.emit("ready");
            this.readyBusy = false;
        });

        if (!this.contentFirstLoaded) {
            this.emit("first-loaded");
            this.contentFirstLoaded = true;
        }
        return true;
    }

    reset(root) {
        this.nodes = [];
        this.index = { id: [], backend: [] };
        this.root = root || {};
    }

    get documents() {
        return Document.instances;
    }

    async initialize() {
        this.delay = createDelay();
        const { DOM, Page, DOMDebugger } = this.domains;

        Node.DOM = DOM;
        Node.vdom = this;

        this.reset();

        await this.onDomContentReady();

        DOM.childNodeCountUpdated((data) => {
            const node = this.getNodeById(data.nodeId);
            if (node) {
                node.data.childNodeCount = data.newChildNodeCount;
            }
            this.emit("update", "child-nodes-count", data);
        });

        DOM.attributeModified(({ nodeId, name, value }) => {
            const node = this.getNodeById(nodeId);
            if (node) {
                node.setAttribute(name, value);
            }
            this.emit("update", "attribute-change", { nodeId, name, value });
        });

        DOM.attributeRemoved(({ nodeId, name }) => {
            const node = this.getNodeById(nodeId);
            if (node) {
                node.removeAttribute(name);
            }
            this.emit("update", "attribute-remove", { nodeId, name });
        });

        DOM.characterDataModified(({ nodeId, characterData }) => {
            const vNode = this.getNodeById(nodeId);
            if (vNode) {
                vNode.data.nodeValue = characterData;
            }
            this.emit("update", "character-data", { nodeId, characterData });
        });

        DOM.setChildNodes(({ parentId, nodes }) => {
            const parent = this.getNodeById(parentId);
            if (parent) {
                parent.data.children = [];
                nodes.forEach((node) => {
                    node.parentId = parentId;
                    parent.data.children.push(node.backendNodeId);
                    this.registerNode(node);
                });
            }
            this.emit("update", "child-nodes", { parentId, nodes });
        });

        DOM.childNodeInserted(({ parentNodeId, previousNodeId, node }) => {
            const parent = this.getNodeById(parentNodeId);
            if (parent) {
                const element = this.registerNode(node);
                parent.addChild(element, previousNodeId);
            }
            this.emit("update", "node-insert", { parentNodeId, previousNodeId, node });
        });

        DOM.childNodeRemoved(({ parentNodeId, nodeId }) => {
            const parent = this.getNodeById(parentNodeId);
            const child = this.getNodeById(nodeId);
            if (parent) {
                parent.removeChild(child);
            }
            this.emit("update", "node-remove", { parentNodeId, nodeId });
        });

        DOM.distributedNodesUpdated((data) => {
            this.emit("update", "distributed-nodes", data);
        });

        DOM.shadowRootPopped((data) => {
            this.emit("update", "shadow-root-popped", data);
        });

        DOM.shadowRootPushed((data) => {
            this.emit("update", "shadow-root-pushed", data);
        });

        DOM.topLayerElementsUpdated((data) => {
            this.emit("update", "top-layer-elements", data);
        });

        //DOM.documentUpdated(this.onDomContentReady.bind(this));
        //Page.domContentEventFired(this.onDomContentReady.bind(this));

        this.cdp.webContents.on("dom-ready", this.onDomContentReady.bind(this));
        this.onDomContentReady();
    }
}

export default VirtualDom;

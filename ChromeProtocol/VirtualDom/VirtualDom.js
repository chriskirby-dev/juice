import { Node, TextNode, Document, Frame } from "./Node.js";
import DomainWrapper from "../DomainWrapper.js";
import Helper from "./Helper.js";

class VirtualDom extends DomainWrapper {
    static uses = ["DOM", "Page", "DOMDebugger", "Runtime"];

    nodes = [];
    index = { id: [], backend: [] };

    async getRootElement(depth = -1) {
        const { DOM } = this.domains;
        const { root } = await DOM.getDocument({
            depth: depth,
            pierce: true,
        });
        if (!root) {
            throw new Error("Failed to retrieve the root document node.");
        }
        debug("getRootElement", root);
        return root;
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
        debug("registerNode", node, nodeId, backendNodeId);

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
        debug("removeNode", node, nodeId, backendId);

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
        this.ReadyTO = setTimeout(async () => {
            this.readyBusy = false;
        }, 500);

        this.reset();

        const { root } = await DOM.getDocument({
            depth: -1,
            pierce: true,
        });

        debug("root", root);
        this.root = root;

        this.registerNode(root);
    }

    reset() {
        this.nodes = [];
        this.index = { id: [], backend: [] };
        this.root = {};
    }

    get documents() {
        return Document.instances;
    }

    async initialize() {
        debug("VDOM init");
        const { DOM, Page, DOMDebugger } = this.domains;

        Node.DOM = DOM;
        Node.vdom = this;

        // await Page.loadEventFired();
        // Subscribe to DOM mutation events
        await DOMDebugger.setEventListenerBreakpoint({ eventName: "subtree-modified" });

        // Get the root Document node1

        DOM.childNodeCountUpdated((data) => {
            debug("childNodeCountUpdated", data);
            const node = this.getNodeById(data.nodeId);
            debug(node);
        });

        const attributeModified = ({ nodeId, name, value }) => {
            this.getNodeById(nodeId).setAttribute(name, value);
        };

        const attributeRemoved = ({ nodeId, name }) => {
            this.getNodeById(nodeId).removeAttribute(name);
        };

        const characterDataModified = ({ nodeId, characterData }) => {
            const vNode = this.getNodeById(nodeId);
            if (vNode) {
                vNode.data.nodeValue = characterData;
            }
        };

        const nodeInserted = ({ parentNodeId, previousNodeId, node }) => {
            debug("nodeInserted", node);
            node.parentId = parentNodeId;
            const parent = this.getNodeById(parentNodeId);
            const previous = this.getNodeById(previousNodeId);
            if (parent) {
                const element = this.registerNode(node);
                parent.addChild(element, previous);
            }
        };

        const nodeRemoved = ({ parentNodeId, nodeId }) => {
            debug("childNodeRemoved", nodeId);
            const parent = this.getNodeById(parentNodeId);
            const child = this.getNodeById(nodeId);
            if (parent) {
                parent.removeChild(child);
            }
        };

        const setChildNodes = ({ parentId, nodes }) => {
            debug("setChildNodes", parentId, nodes);
            const parent = this.getNodeById(parentId);

            if (parent) {
                parent.data.children = [];
                nodes.map((node) => {
                    node.parentId = parentId;
                    parent.data.children.push(node.backendNodeId);
                    return this.registerNode(node);
                });
            }
        };

        DOM.childNodeInserted(nodeInserted);
        DOM.childNodeRemoved(nodeRemoved);
        DOM.characterDataModified(characterDataModified);
        DOM.attributeModified(attributeModified);
        DOM.attributeRemoved(attributeRemoved);

        DOM.setChildNodes(setChildNodes);

        DOM.distributedNodesUpdated((data) => {
            debug("distributedNodesUpdated", data);
            // if(this.state == 'loading') this.resetContentReadyEvent();
        });

        DOM.shadowRootPopped((data) => {
            debug("shadowRootPopped ", data);
            // if(this.state == 'loading') this.resetContentReadyEvent();
        });

        DOM.shadowRootPushed((data) => {
            debug("shadowRootPushed", data);
            // if(this.state == 'loading') this.resetContentReadyEvent();
        });

        DOM.topLayerElementsUpdated((data) => {
            debug("topLayerElementsUpdated", data);
            // if(this.state == 'loading') this.resetContentReadyEvent();
        });

        DOM.documentUpdated(this.onDomContentReady.bind(this));
        Page.domContentEventFired(this.onDomContentReady.bind(this));
        this.onDomContentReady();
        debug("VDOM Listeners Added");

        return;
    }
}

export default VirtualDom;

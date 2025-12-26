/**
 * Virtual document representation for Chrome DevTools Protocol DOM.
 * Creates a lightweight virtual DOM structure from Chrome Protocol nodes.
 * @module ChromeProtocol/Dom/VirtualDoc
 */

import DomHelper from './Helper.js';
import Element from './Element.js';

/**
 * Represents a virtual DOM document created from Chrome DevTools Protocol DOM data.
 * Provides efficient indexing and navigation of the DOM structure.
 * @class VirtualDoc
 */
class VirtualDoc {

    documents = [];
    frames = {};
    nodes = {};
    index = { id: [], backend: [] };

    /**
     * Creates a new VirtualDoc instance from a root node.
     * @param {Object} root - The root DOM node from Chrome DevTools Protocol
     */
    constructor(root) {
        this.nodes = this.parseNodes(root);
    }

    /**
     * Retrieves a node by its backend node ID.
     * @param {number} backendNodeId - The backend node ID to look up
     * @returns {Object} The virtual element
     */
    getNode( backendNodeId ){
        return this.index.backend[backendNodeId];
    }

    /**
     * Converts a Chrome Protocol element to a virtual element representation.
     * @param {Object} element - The Chrome Protocol element to convert
     * @returns {Object|string} The virtual element object or text content
     */
    toVirtualElement( element ){

        const toVirtualElement = this.toVirtualElement.bind(this);

        const velement = Object.create(null);

        velement.nodeId = element.nodeId;
        velement.backendNodeId = element.backendNodeId;
        velement.parentId = element.parentId;
        velement.nodeType = element.nodeType;

        this.index.id[element.nodeId] = velement;
        this.index.backend[element.backendNodeId] = velement;

        if( element.nodeType === 1 ){

            velement.tag = element.localName;

            if( element.attributes ){
                velement.attributes = DomHelper.parseAttributeArray(element.attributes);
            }

            if( element.frameId && element.contentDocument ){
                velement.frameId = element.frameId;
                this.frames[element.frameId] = velement.backendNodeId;
                velement.document = toVirtualElement(element.contentDocument);
                
            }

            if( element.children?.length ){

                velement.children = element.children.map( (child) => toVirtualElement(child) );
            } 

            

            return velement;

        }else if( element.nodeType === 3 ){
            //Text Node
            return element.nodeValue;
        }else if( element.nodeType === 9 ){
            //Document
            this.documents.push(velement.backendNodeId);
            if( element.childNodeCount || element.children?.length ){
                velement.children = element.children.map( (child) => this.toVirtualElement(child) );
            } 
            return velement;
        }
    }

    /**
     * Parses nodes into virtual element representations.
     * @param {Object|Array} nodeList - Node or array of nodes to parse
     * @returns {Object|Array} Parsed virtual element(s)
     */
    parseNodes( nodeList ){
        if(Array.isArray(nodeList)){
            return nodeList.map( (node) => this.toVirtualElement(node) );
        }else{
            return this.toVirtualElement( nodeList );
        }
    }

}

export default VirtualDoc;
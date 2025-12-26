/**
 * DomNode and related classes for managing Chrome DevTools Protocol DOM nodes.
 * @module ChromeProtocol/Dom/Node
 */

import DomHelper from './Helper.js';
import EventEmitter from 'events';

/**
 * Mapping of node type numbers to their string representations.
 * @constant {Array<string>}
 */
const NODE_TYPES = [];
NODE_TYPES[1] = 'Element';
NODE_TYPES[2] = 'Attribute';
NODE_TYPES[3] = 'Text';
NODE_TYPES[4] = 'CDATA';
//NODE_TYPES[5] = 'EntityReference';
//NODE_TYPES[6] = 'Entity';
NODE_TYPES[7] = 'ProcessingInstruction';
NODE_TYPES[8] = 'Comment';
NODE_TYPES[9] = 'Document';
NODE_TYPES[10] = 'DocumentType';
NODE_TYPES[11] = 'DocumentFragment';

/**
 * Base class representing a DOM node in Chrome DevTools Protocol.
 * Extends EventEmitter to support event handling.
 * @class DomNode
 * @extends EventEmitter
 */
class DomNode extends EventEmitter{

    children = [];
    #dom;

    /**
     * Creates a new DomNode instance.
     * @param {Object} node - The node object from Chrome DevTools Protocol
     */
    constructor( node ){
        super();
        this.node = node;
    }

    /**
     * Gets the associated DOM instance.
     * @returns {Object} The DOM instance
     */
    get dom(){
        return this.#dom;
    }

    /**
     * Gets the node ID.
     * @returns {number} The node ID
     */
    get nodeId(){
        return this.node.nodeId;
    }

    /**
     * Sets the node ID.
     * @param {number} value - The new node ID
     */
    set nodeId( value ){
        this.node.nodeId = value;
    }

    /**
     * Gets the backend node ID.
     * @returns {number} The backend node ID
     */
    get backendNodeId(){
        return this.node.backendNodeId;
    }

    /**
     * Gets the parent node ID.
     * @returns {number} The parent node ID
     */
    get parentId(){
        return this.node.parentId;
    }

    /**
     * Gets the node type as a string.
     * @returns {string} The node type (e.g., 'Element', 'Text', 'Document')
     */
    get type(){
        return NODE_TYPES[this.node.nodeType];
    }
    
    /**
     * Gets the node value.
     * @returns {*} The node value
     */
    get value(){
        return this.node.nodeValue;
    }

    /**
     * Updates the node with new data.
     * @param {Object} obj - The new node data
     */
    update(obj){
        this.node = obj;
    }

    /**
     * Initializes the node with a DOM instance.
     * @param {Object} dom - The DOM instance
     */
    initialize( dom ){
        this.#dom = dom;
    }

}

/**
 * Represents a DOM node that can contain children.
 * @class ChildBearingNode
 * @extends DomNode
 */
class ChildBearingNode extends DomNode {
    children = [];

    /**
     * Creates a new ChildBearingNode instance.
     * @param {Object} node - The node object from Chrome DevTools Protocol
     */
    constructor( node ){
        super(node);
    }

    /**
     * Adds a child node by its backend ID.
     * @param {number} backendNodeId - The backend node ID of the child
     * @param {number} [after] - Optional index to insert after
     */
    addChild( backendNodeId, after ){
        if(after)
        this.children.splice( after, 0, backendNodeId );
        else
        this.children.push( backendNodeId );
    
    }

    /**
     * Removes a child node by its ID.
     * @param {number} childId - The child node ID to remove
     */
    removeChild(childId){
        this.children = this.children.filter( childBackendId => childBackendId !== childId );
    }

    /**
     * Updates the node with new data, processing child nodes.
     * @param {Object} obj - The new node data
     */
    update(obj){
        super.update(obj);
        if(this.node.children){
            this.children = this.node.children.map( child => child.backendNodeId );
            delete this.node.children;
        }
    }

    /**
     * Initializes the node with a DOM instance, processing child nodes.
     * @param {Object} dom - The DOM instance
     */
    initialize( dom ){
        super.initialize(dom);
        if(this.node.children){
            this.children = this.node.children.map( child => child.backendNodeId );
            delete this.node.children;
        }
    }
}

/**
 * Represents a Document node in the DOM tree.
 * @class Document
 * @extends ChildBearingNode
 */
export class Document extends ChildBearingNode {

    /**
     * Creates a new Document instance.
     * @param {Object} node - The document node object from Chrome DevTools Protocol
     */
    constructor( node ){
        super(node);
    }

    /**
     * Gets the document URL.
     * @returns {string} The document URL
     */
    get documentURL(){
        return this.node.documentURL;
    }

   

}

/**
 * Represents an Element node in the DOM tree.
 * @class Element
 * @extends ChildBearingNode
 */
export class Element extends ChildBearingNode {

    /**
     * Creates a new Element instance.
     * @param {Object} node - The element node object from Chrome DevTools Protocol
     */
    constructor( node ){
        super( node );
    }

    /**
     * Gets the element's tag name.
     * @returns {string} The tag name (e.g., 'DIV', 'SPAN')
     */
    get tagName(){
        return this.node.nodeName;
    }

    /**
     * Updates the element with new data, processing attributes.
     * @param {Object} obj - The new node data
     */
    update(obj){
        super.update(obj);


        if(this.node.attributes){
            this.attributes = DomHelper.parseAttributeArray(this.node.attributes);
            delete this.node.attributes;
        }
    }

    /**
     * Gets the client bounding rectangle for the element.
     * @returns {Promise<Object>} The bounding rectangle with top, left, width, height
     */
    async getClientBoundingRect(){
        const {DOM} = this.dom.domains;
        // Get the content quads for the element (assuming the element is not transformed)
        const { quads } = await DOM.getContentQuads({ backendNodeId: this.backendNodeId });
        //debug('quads', quads);
        // Extract the first quad (assuming the element is not transformed)
        const quad = quads[0];
        if(quad){        // Calculate client rect
            this.rect = {
                top: Math.min(quad[1].y, quad[2].y),
                left: Math.min(quad[0].x, quad[1].x),
                width: Math.abs(quad[2].x - quad[1].x),
                height: Math.abs(quad[2].y - quad[0].y),
            };
        }
        return this.rect;
    }

    /**
     * Initializes the element with a DOM instance, processing attributes and layout.
     * @param {Object} dom - The DOM instance
     * @returns {Promise<boolean>} True when initialization is complete
     */
    async initialize( dom ){
    
        super.initialize(dom);

        if(this.node.attributes){
            this.attributes = DomHelper.parseAttributeArray(this.node.attributes);
            delete this.node.attributes;
        }

        const {DOM} = dom.domains;
        
        // Get the content quads for the element (assuming the element is not transformed)
        await this.getClientBoundingRect();

        return true;

    }

}

export default DomNode;
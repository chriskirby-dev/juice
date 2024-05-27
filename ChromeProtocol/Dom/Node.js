import DomHelper from './Helper.js';
import EventEmitter from 'events';

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

class DomNode extends EventEmitter{

    children = [];
    #dom;

    constructor( node ){
        super();
        this.node = node;
    }

    get dom(){
        return this.#dom;
    }

    get nodeId(){
        return this.node.nodeId;
    }

    set nodeId( value ){
        this.node.nodeId = value;
    }

    get backendNodeId(){
        return this.node.backendNodeId;
    }

    get parentId(){
        return this.node.parentId;
    }

    get type(){
        return NODE_TYPES[this.node.nodeType];
    }
    
    get value(){
        return this.node.nodeValue;
    }

    update(obj){
        this.node = obj;
    }

    initialize( dom ){
        this.#dom = dom;
    }

}

class ChildBearingNode extends DomNode {
    children = [];

    constructor( node ){
        super(node);
    }

    addChild( backendNodeId, after ){
        if(after)
        this.children.splice( after, 0, backendNodeId );
        else
        this.children.push( backendNodeId );
    
    }

    removeChild(childId){
        this.children = this.children.filter( childBackendId => childBackendId !== childId );
    }

    update(obj){
        super.update(obj);
        if(this.node.children){
            this.children = this.node.children.map( child => child.backendNodeId );
            delete this.node.children;
        }
    }

    initialize( dom ){
        super.initialize(dom);
        if(this.node.children){
            this.children = this.node.children.map( child => child.backendNodeId );
            delete this.node.children;
        }
    }
}

export class Document extends ChildBearingNode {

    constructor( node ){
        super(node);
    }

    get documentURL(){
        return this.node.documentURL;
    }

   

}


export class Element extends ChildBearingNode {

    constructor( node ){
        super( node );
    }

    get tagName(){
        return this.node.nodeName;
    }

    update(obj){
        super.update(obj);


        if(this.node.attributes){
            this.attributes = DomHelper.parseAttributeArray(this.node.attributes);
            delete this.node.attributes;
        }
    }

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
import DomHelper from './Helper.js';
import Element from './Element.js';


class VirtualDoc {

    documents = [];
    frames = {};
    nodes = {};
    index = { id: [], backend: [] };

    constructor(root) {
        this.nodes = this.parseNodes(root);
    }

    getNode( backendNodeId ){
        return this.index.backend[backendNodeId];
    }

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

    parseNodes( nodeList ){
        if(Array.isArray(nodeList)){
            return nodeList.map( (node) => this.toVirtualElement(node) );
        }else{
            return this.toVirtualElement( nodeList );
        }
    }

}

export default VirtualDoc;
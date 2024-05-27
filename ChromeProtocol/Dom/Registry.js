import { default as Node, Document, Element } from './Node.js';

class DomRegistry {

    #dom;
    #document = [];
    #iframe = [];

    #registry = { node: [], backend: [] };

    constructor( dom ){
        this.#dom = dom;
    }

    update(obj){
        const node = this.#registry.backend[obj.backendNodeId];
        if( node.nodeId !== obj.nodeId ){
            delete this.#registry.node[node.nodeId];
            this.#registry.node[obj.nodeId] = node;
        }
        node.update(obj);
        return node;
    }

    async register( obj ){
        if(this.#registry.backend[obj.backendNodeId]){
            return this.update(obj);
        }
        let node;
        switch(obj.nodeType){
            case 1:
            //Element
            node = new Element({ ...obj });
            if(obj.nodeName == 'IFRAME'){
                this.#iframe.push(node);
            }
            break;
            case 2:
            //Attribute
            break;
            case 3:
            //Text
            node = new Node({ ...obj });
            break;
            case 9:
            //Document
            node = new Document({ ...obj });
            this.#document.push(node);
            break;
            case 11:
            //Document Fragment
            
            break;
            //Doc Type
            break;
            default:
            node = new Node({ ...obj });
        }

       
        this.#registry.node[obj.nodeId] = node;
        this.#registry.backend[obj.backendNodeId] = node;

        await node.initialize(this.#dom);

        if(obj.children && obj.children.length){
            obj.children.forEach(child => this.register(child));
        }

        if(obj.contentDocument){
            this.register(obj.contentDocument);
        }

        return node;
    
    }

    byNodeId(nodeId){
        return nodeId ? this.#registry.node[nodeId] : this.#registry.node;
    }

    byBackendNodeId(nodeId){
        return nodeId ? this.#registry.backend[nodeId] : this.#registry.backend;
    }

    allNodeIds(){
        return this.#registry.node;
    }

    allBackendNodeIds(){
        return this.#registry.backend;
    }

    reset(){
        this.#registry = { node: [], backend: [] };
    }

}

export default DomRegistry;
/**
 * Registry for managing DOM nodes in Chrome DevTools Protocol.
 * Maintains mappings between node IDs, backend node IDs, and node objects.
 * @module ChromeProtocol/Dom/Registry
 */

import { default as Node, Document, Element } from './Node.js';

/**
 * Manages a registry of DOM nodes with efficient lookup by node ID or backend node ID.
 * @class DomRegistry
 */
class DomRegistry {

    #dom;
    #document = [];
    #iframe = [];

    #registry = { node: [], backend: [] };

    /**
     * Creates a new DomRegistry instance.
     * @param {Object} dom - The DOM instance to associate with this registry
     */
    constructor( dom ){
        this.#dom = dom;
    }

    /**
     * Updates an existing node in the registry with new data.
     * @param {Object} obj - The updated node object
     * @returns {Object} The updated node
     */
    update(obj){
        const node = this.#registry.backend[obj.backendNodeId];
        if( node.nodeId !== obj.nodeId ){
            delete this.#registry.node[node.nodeId];
            this.#registry.node[obj.nodeId] = node;
        }
        node.update(obj);
        return node;
    }

    /**
     * Registers a new node or updates an existing one in the registry.
     * Creates appropriate node types (Element, Document, Text, etc.) based on nodeType.
     * @param {Object} obj - The node object to register
     * @returns {Promise<Object>} The registered node
     */
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

    /**
     * Retrieves a node by its node ID.
     * @param {number} [nodeId] - The node ID to look up. If omitted, returns all nodes.
     * @returns {Object|Array} The node object or array of all nodes
     */
    byNodeId(nodeId){
        return nodeId ? this.#registry.node[nodeId] : this.#registry.node;
    }

    /**
     * Retrieves a node by its backend node ID.
     * @param {number} [nodeId] - The backend node ID to look up. If omitted, returns all nodes.
     * @returns {Object|Array} The node object or array of all nodes
     */
    byBackendNodeId(nodeId){
        return nodeId ? this.#registry.backend[nodeId] : this.#registry.backend;
    }

    /**
     * Gets all nodes indexed by node ID.
     * @returns {Array} Array of all nodes indexed by node ID
     */
    allNodeIds(){
        return this.#registry.node;
    }

    /**
     * Gets all nodes indexed by backend node ID.
     * @returns {Array} Array of all nodes indexed by backend node ID
     */
    allBackendNodeIds(){
        return this.#registry.backend;
    }

    /**
     * Resets the registry, clearing all nodes.
     */
    reset(){
        this.#registry = { node: [], backend: [] };
    }

}

export default DomRegistry;
/**
 * Document management for Chrome DevTools Protocol DOM.
 * @module ChromeProtocol/Dom/Document
 */

import EventEmitter from 'events';
import DomRegistery from './DomRegistery';

const registry = new DomRegistery();

/**
 * Manages document-level operations and event listening for DOM debugging.
 * @class Document
 * @extends EventEmitter
 */
class Document extends EventEmitter {

    domains = {};
    frames = [];
    nodes = [];

    /**
     * Creates a new Document instance.
     * @param {Object} cdp - Chrome DevTools Protocol instance
     */
    constructor( cdp ){
        super();
        const { DOM, DOMDebugger } = cdp.enable('DOM', 'DOMDebugger');
        this.domains = {
            DOM,
            DOMDebugger
        }
    }

    /**
     * Sets up event listener breakpoints for debugging.
     * Configures breakpoints for click, input, and scroll events.
     */
    setListeners(){
        const { DOMDebugger } = this.domains;

        DOMDebugger.setEventListenerBreakpoint({
            eventName: 'click',
            targetName: '*'
        });

        DOMDebugger.setEventListenerBreakpoint({
            eventName: 'input',
            targetName: '*'
        });

        DOMDebugger.setEventListenerBreakpoint({
            eventName: 'scroll',
            targetName: '*'
        });


    }

    /**
     * Recursively traverses DOM nodes.
     * @param {Object} node - The node to traverse
     */
    traverseNodes(node){

        if(node.nodeType == 9){

        }
        // recursively check child nodes
        if(node.childNodeCount > 0) {
            node.children.forEach(child => traverseNodes(child) );
        }
    }

    /**
     * Maps all nodes in the document by fetching the document with full depth.
     */
    mapNodes(){
        const {DOM} = this.domains;
        DOM.getDocument({ depth: -1 }).then(root => this.traverseFrames(root) );
    }


}


export default EventEmitter;
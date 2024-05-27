import EventEmitter from 'events';
import DomRegistery from './DomRegistery';

const registry = new DomRegistery();

class Document extends EventEmitter {

    domains = {};
    frames = [];
    nodes = [];

    constructor( cdp ){
        super();
        const { DOM, DOMDebugger } = cdp.enable('DOM', 'DOMDebugger');
        this.domains = {
            DOM,
            DOMDebugger
        }
    }

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

    traverseNodes(node){

        if(node.nodeType == 9){

        }
        // recursively check child nodes
        if(node.childNodeCount > 0) {
            node.children.forEach(child => traverseNodes(child) );
        }
    }

    mapNodes(){
        const {DOM} = this.domains;
        DOM.getDocument({ depth: -1 }).then(root => this.traverseFrames(root) );
    }


}


export default EventEmitter;
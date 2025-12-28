/**
 * MutationObserver wrapper for DOM change detection.
 * Monitors DOM mutations including attributes, children, and subtree changes.
 * @module Dom/Observe/Mutation
 */

import Emitter from '../../Event/Emitter.mjs';

/**
 * Wrapper for MutationObserver with event emission.
 * @class Mutation
 * @extends Emitter
 * @param {Element} el - Element to observe
 * @param {Object} [config={}] - MutationObserver configuration
 * @example
 * const mutation = new Mutation(element, { attributes: true, childList: true });
 * mutation.on('update', (type) => console.log('Mutation:', type));
 */
class Mutation extends Emitter {

    observer;

    constructor( el, config={} ){
        super();
        this.initialize();
        if(el)this.observe(el, config);
    }
  

    observe( el, config = {} ){
        this.observer.observe( el, config);
        //const config = { attributes: true, childList: true, subtree: true };
    }

    stop(){
        this.observer.disconnect();
    }

    initialize(){

        const callback = function(mutationsList, observer) {
            // Use traditional 'for loops' for IE 11
            for(const mutation of mutationsList) { 
                if (mutation.type === 'childList') {
                    app.log('A child node has been added or removed.');
                    this.emit('update', mutation.type );
                }
                else if (mutation.type === 'attributes') {
                    app.log('The ' + mutation.attributeName + ' attribute was modified.');
                    this.emit('update', mutation.type, mutation.attributeName );
                }
            }
        
        }.bind(this);

        this.observer = new MutationObserver(callback);
    }
}

export default Mutation;
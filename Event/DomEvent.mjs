/**
 * DomEvent provides utilities for managing DOM event listeners.
 * Simplifies binding and unbinding event listeners to multiple elements.
 * @module Event/DomEvent
 */

/**
 * DomEvent class for managing DOM event listeners.
 * @class DomEvent
 * @example
 * const domEvent = new DomEvent();
 * domEvent.bind(elements, 'click', handleClick);
 */
class DomEvent {

    /**
     * Binds an event listener to one or more elements.
     * @param {Element|Array<Element>} elements - Element or array of elements to bind to
     * @param {string} event - Event name (e.g., 'click', 'mousedown')
     * @param {Function} eventFn - Event handler function
     * @param {boolean} [useCapture=false] - Whether to use capture phase
     */
    bind( elements, event, eventFn, useCapture=false ){
        if(typeof elements !== 'array') elements = [elements];
        for(let i=0;i<elements.length;i++){
            elements[i].addEventListener( event, eventFn, useCapture );
        }
    }

    /**
     * Unbinds an event listener from one or more elements.
     * @param {Element|Array<Element>} elements - Element or array of elements to unbind from
     * @param {string} event - Event name
     * @param {Function} eventFn - Event handler function to remove
     */
    unbind( elements, event, eventFn ){
        if(typeof elements !== 'array') elements = [elements];
        for(let i=0;i<elements.length;i++){
            elements[i].removeEventListener( event, eventFn );
        }
    }

}

export default DomEvent;
/**
 * MutationObserver wrapper for child element changes.
 * Monitors additions and removals of child elements in the DOM tree.
 * @module Dom/Observe/Children
 */

import Emitter from "../../Event/Emitter.mjs";

/**
 * Observes changes to an element's children.
 * @class ObserveChildren
 * @extends Emitter
 * @param {Element} element - Element to observe
 * @param {Function} [callback] - Callback function for changes
 * @example
 * const observer = new ObserveChildren(container);
 * observer.on('update', () => console.log('Children changed'));
 */
class ObserveChildren extends Emitter {
    observer;

    constructor(element, callback) {
        super();

        this.initialize();
        if (element ) this.observe(element);
        if(callback) this.callback = callback;
        
    }

    observe(el) {
        this.observer.observe(el, { childList: true, subtree: true });
    }

    disconnect() {
        this.observer.disconnect();
    }

    initialize() {
        const callback = function (mutationsList, observer) {
            // Use traditional 'for loops' for IE 11
            for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                    debug("A child node has been added or removed.");
                    this.emit("update", mutation.type);
                } else if (mutation.type === "attributes") {
                    debug("The " + mutation.attributeName +" attribute was modified.");
                    this.emit("update", mutation.type, mutation.attributeName);
                }
            }
        }.bind(this);

        this.observer = new MutationObserver(callback);
    }
}

export default ObserveChildren;
/**
 * Event utility module providing event-related functionality.
 * @module Event
 */

import { default as _Emitter } from "./Emitter.mjs";

/**
 * Cancels an event by preventing default behavior and stopping propagation.
 * @param {Event} e - The DOM event to cancel
 * @returns {boolean} Always returns false
 * @example
 * element.addEventListener('click', cancel); // Completely cancels click events
 */
export function cancel(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

/**
 * EventEmitter class for pub/sub functionality.
 * @type {EventEmitter}
 */
export const Emitter = _Emitter;

/**
 * Event class providing static access to event utilities.
 * @class Event
 */
class Event {
    /**
     * Static reference to EventEmitter class.
     * @static
     * @type {EventEmitter}
     */
    static Emitter = _Emitter;
}

export default Event;

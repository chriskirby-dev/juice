/**
 * Timer utility module providing promise-based delay functions with debouncing capabilities.
 * Includes global delays, scoped delays, and delay factory for creating isolated delay contexts.
 * @module Timers
 */

/**
 * Object to store global delay timeouts by ID.
 * @private
 * @type {Object<string, number>}
 */
let delays = {};

/**
 * Creates a promise that resolves after a specified delay.
 * Debounces: if called again with the same ID before resolution, the previous delay is cancelled.
 * @param {number} ms - Milliseconds to delay
 * @param {string} [id="default"] - Identifier for the delay (for debouncing)
 * @returns {Promise<void>} Promise that resolves after the delay
 * @example
 * await globalDelay(1000); // wait 1 second
 * await globalDelay(500, "myDelay"); // wait 500ms with ID
 */
export function globalDelay(ms, id = "default") {
    if (delays[id]) clearTimeout(delays[id]);
    return new Promise((resolve) => {
        delays[id] = setTimeout(resolve, ms);
    });
}

/**
 * Creates a new isolated delay function with its own delay context.
 * Useful for creating multiple independent delay handlers that don't interfere with each other.
 * @returns {Function} A delay function with isolated delay tracking
 * @example
 * const myDelay = createDelay();
 * await myDelay(1000); // independent delay context
 */
export function createDelay() {
    let delays = {};

    return function delay(ms, id = "default") {
        if (delays[id]) clearTimeout(delays[id]);
        return new Promise((resolve) => {
            delays[id] = setTimeout(resolve, ms);
        });
    };
}

/**
 * Default export: A delay function with its own isolated context.
 * Creates a promise that resolves after a specified delay with debouncing support.
 * @function
 * @param {number} ms - Milliseconds to delay
 * @param {string} [id="default"] - Identifier for the delay (for debouncing)
 * @returns {Promise<void>} Promise that resolves after the delay
 * @example
 * import delay from './Timers.mjs';
 * await delay(1000); // wait 1 second
 */
export default (() => {
    let delays = {};

    return function delay(ms, id = "default") {
        if (delays[id]) clearTimeout(delays[id]);
        return new Promise((resolve) => {
            delays[id] = setTimeout(resolve, ms);
        });
    };
})();

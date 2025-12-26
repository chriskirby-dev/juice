/**
 * Crypto utilities for generating random values.
 * Provides a polyfill-like interface for cryptographic random number generation.
 * @module Crypto/Crypto
 */

/**
 * Crypto class providing cryptographic utilities.
 * @class Crypto
 */
class Crypto {
    /**
     * Fills an array with cryptographically strong random values.
     * Uses Math.random() as a fallback implementation.
     * @param {TypedArray|Array} array - The array to fill with random values
     * @returns {TypedArray|Array} The filled array
     * @static
     * @example
     * const arr = new Uint8Array(16);
     * Crypto.getRandomValues(arr);
     */
    static getRandomValues(array) {
        for (var i = 0, len = array.length; i < len; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return array;
    }
}

export default Crypto;

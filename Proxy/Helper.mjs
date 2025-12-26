/**
 * Helper utilities for working with Proxy objects in the Juice framework.
 * Provides functionality to unwrap proxied objects back to plain objects.
 * @module Proxy/Helper
 */

import { default as Util, type, empty } from '../Util/Core.mjs';

/**
 * Unwraps a proxied object to its original form.
 * Recursively converts proxied objects and arrays back to plain JavaScript objects.
 * @param {Object|Array} proxy - The proxied object to unwrap
 * @returns {Object|Array} The unwrapped plain object or array
 * @example
 * const plain = unproxy(proxiedObject);
 */
export function unproxy( proxy ){
    const unproxied = type(proxy, 'array') ? [] : {};
    if(proxy._isProxy) return proxy[Symbol.for('UNPROXY')];
    for( let prop in proxy ){
        unproxied[prop] = (  type(proxy[prop], 'object') && proxy[prop]._isProxy ) ? unproxy(proxy[prop]) : proxy[prop];
    }
    return unproxied;
}
 

export default { unproxy };
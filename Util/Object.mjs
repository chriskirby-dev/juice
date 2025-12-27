/**
 * Object manipulation and comparison utilities.
 * Provides deep comparison, diff, merge, and transformation functions.
 * @module Util/Object
 */

import ArrayUtil from "./Array.mjs";

/**
 * Returns an object containing the differences between two objects, a and b.
 * Each key in the returned object corresponds to a key in either a or b, and the value is an array containing the value from a and the value from b respectively.
 * If the values are the same, the key is not included in the returned object.
 * If the objects are identical, null is returned.
 * @param {Object} a - The first object to compare.
 * @param {Object} b - The second object to compare.
 * @returns {Object|null} The differences between a and b, or null if they are identical.
 */
export function diff(a, b) {
    const diff = {};
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    const keys = new Set([...aKeys, ...bKeys]);

    for (let prop of keys) {
        if (a[prop] !== b[prop]) {
            diff[prop] = [a[prop], b[prop]];
        }
    }

    return Object.keys(diff).length === 0 ? null : diff;
}

/**
 * Returns an object containing the key-value pairs that have changed between two objects.
 * The returned object will have the same keys as the second object, and the values will be an array containing the old and new values.
 * If a key does not exist in the first object, the value in the returned object will be [undefined, <new value>]
 * If a key does not exist in the second object, it will not be included in the returned object.
 * @param {Object} a The first object to compare.
 * @param {Object} b The second object to compare.
 * @returns {Object} An object containing the key-value pairs that have changed.
 */
export function change(a, b) {
    const diff = {};
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    for (let i = 0; i < aKeys.length; i++) {
        const key = aKeys[i];
        if (bKeys.includes(key) && a[key] !== b[key]) {
            diff[key] = [a[key], b[key]];
        }
    }

    for (let i = 0; i < bKeys.length; i++) {
        const key = bKeys[i];
        if (!aKeys.includes(key)) {
            diff[key] = [undefined, b[key]];
        }
    }

    return diff;
}

/**
 * Sets the enumerability of a set of properties in an object.
 * @param {Object} target - The object to set the enumerability of.
 * @param {Array<string>} [props=[]] - The properties to set the enumerability of.
 * @param {boolean} [enumerable=true] - Whether to set the properties as enumerable.
 * @param {boolean} [enumRest=false] - If true, only properties not in the set of props will be set as enumerable.
 */

export function setEnumerability(target, props = [], enumerable = true, enumRest = false) {
    const descriptors = Object.getOwnPropertyDescriptors(target);
    const propsSet = new Set(props);

    const newDescriptors = Object.fromEntries(
        Object.entries(descriptors).map(([property, descriptor]) => {
            const newDescriptor = { ...descriptor };
            newDescriptor.enumerable = enumRest ? propsSet.has(property) : propsSet.has(property) === enumerable;
            return [property, newDescriptor];
        })
    );

    Object.defineProperties(target, newDescriptors);
}

/**
 * Flatten an object into a single level object.
 *
 * @param {Object} obj - The object to flatten.
 * @param {string} [parentKey=""] - The parent key to prefix the property names with.
 * @param {Object} [result={}] - The object to store the flattened result in.
 * @returns {Object} The flattened object.
 */
export function flatten(obj, parentKey = "", result = {}) {
    const entries = Object.entries(obj);
    const len = entries.length;
    for (let i = 0; i < len; i++) {
        const [key, value] = entries[i];
        const path = parentKey ? `${parentKey}.${key}` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            flattenObject(value, path, result);
        } else {
            result[path] = value;
        }
    }
    return result;
}

/**
 * Filter an object by a given filter function.
 *
 * The filter function takes two parameters: key and value.
 * If the filter function returns true, the key-value pair is included in the result.
 * Otherwise, it is excluded.
 *
 * @param {Object} obj - The object to filter.
 * @param {function} filter - The filter function.
 * @returns {Object} The filtered object.
 */
export function objectFilter(obj, filter) {
    const result = {};
    for (const key in obj) {
        if (filter(key, obj[key])) {
            result[key] = obj[key];
        }
    }
    return result;
}

export function merge(...objects) {
    return objects.reduce((mergedObject, obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                // If both properties are objects, merge them recursively
                if (
                    mergedObject[key] !== undefined &&
                    typeof mergedObject[key] === "object" &&
                    typeof obj[key] === "object" &&
                    !Array.isArray(mergedObject[key]) &&
                    !Array.isArray(obj[key])
                ) {
                    mergedObject[key] = merge(mergedObject[key], obj[key]);
                } else {
                    // Otherwise, overwrite obj1's property with obj2's property
                    mergedObject[key] = obj[key];
                }
            }
        }
        return mergedObject;
    }, {});
}

class ObjectUtil {
    static arrPluck(arr, path) {
        return arr.map((item) => ObjectUtil.pluck(item, path));
    }

    static pluck(obj, path) {
        let scope = obj;
        const paths = path.split(".");
        while (paths.length) {
            scope = scope[paths.shift()];
            if (scope === undefined) return null;
        }
        return scope;
    }

    static merge = merge;

    static diff = diff;

    static enumerize(target, props = [], unenumRest = false) {
        const prototype = Object.getPrototypeOf(target);
        if (unenumRest) {
            const prototype_property_descriptors = Object.getOwnPropertyDescriptors(target);
            for (const [property, descriptor] of Object.entries(prototype_property_descriptors)) {
                const is_enumerable = !props.length || props.includes(property);
                descriptor.enumerable = is_enumerable;
                Object.defineProperty(target, property, descriptor);
            }
        } else {
            for (let i = 0; i < props.length; i++) {
                const property = props[i];
                const descriptor = Object.getOwnPropertyDescriptor(target, property);
                descriptor.enumerable = true;
                Object.defineProperty(target, property, descriptor);
            }
        }
    }
    static unEnumerize(target, props = [], enumRest = false) {
        const prototype = Object.getPrototypeOf(target);
        if (enumRest) {
            const prototype_property_descriptors = Object.getOwnPropertyDescriptors(target);
            for (const [property, descriptor] of Object.entries(prototype_property_descriptors)) {
                const is_enumerable = !(!props.length || props.includes(property));
                descriptor.enumerable = is_enumerable;
                Object.defineProperty(target, property, descriptor);
            }
        } else {
            for (let i = 0; i < props.length; i++) {
                const property = props[i];
                const descriptor = Object.getOwnPropertyDescriptor(target, property);
                descriptor.enumerable = false;
                Object.defineProperty(target, property, descriptor);
            }
        }
    }
}

export default ObjectUtil;
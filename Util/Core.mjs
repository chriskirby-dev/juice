/**
 * Core utility module providing fundamental utility functions and type checking.
 * Aggregates utilities from other modules and provides common helper functions.
 * @module Core
 */

import ArrayUtil from "./Array.mjs";
import DateUtil from "./Date.mjs";
import StringUtil from "./String.mjs";
import ObjectUtil from "./Object.mjs";
import NumberUtil from "./Number.mjs";
import operators from "./Operators.mjs";
import crypto from "../Crypto/Crypto.mjs";

/**
 * Determines the type of a value and optionally checks if it matches a specific type.
 * Supports negation by prefixing type with "!".
 * @param {*} o - The value to check
 * @param {string} [is_type] - Optional type to check against (e.g., "string", "!array")
 * @returns {string|boolean} The type name if is_type is not provided, or boolean if checking
 * @example
 * type([]) // returns "array"
 * type([], "array") // returns true
 * type([], "!object") // returns true
 */
export function type(o, is_type) {
    if (is_type) is_type = is_type.toLowerCase();
    var t = Object.prototype.toString.call(o).split(" ").pop().replace("]", "").toLowerCase();
    if (is_type && is_type.charAt(0) == "!") {
        return is_type.substr(1) !== t;
    }
    return is_type ? is_type === t : t;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, or empty object).
 * @param {*} val - The value to check
 * @returns {boolean} True if the value is considered empty
 * @example
 * empty("") // returns true
 * empty([]) // returns true
 * empty({}) // returns true
 * empty(0) // returns false
 */
export function empty(val) {
    var empty = false;
    if (val === undefined || val === null || val === "") return true;

    switch (Util.type(val)) {
        case "string":
            return val.trim().length == 0;
            break;
        case "array":
            return val.length == 0;
            break;
        case "object":
            return Object.keys(val).length == 0;
            break;
        case "date":
            break;
        default:
            empty = val === null || val === undefined;
    }

    return empty;
}

/**
 * Generates a UUID v4 (random UUID).
 * Uses crypto.getRandomValues for secure random number generation.
 * @returns {string} A UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * @example
 * uuid() // returns "550e8400-e29b-41d4-a716-446655440000"
 */
export function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
}

/**
 * Checks if an item exists (is not undefined).
 * @param {*} item - The item to check
 * @returns {boolean} True if item is not undefined
 * @example
 * exists(null) // returns true
 * exists(undefined) // returns false
 */
export function exists(item) {
    return item !== undefined;
}

/**
 * Checks strict equality between two values.
 * @param {*} a - The first value
 * @param {*} b - The second value
 * @returns {boolean} True if a === b
 * @example
 * equals(1, 1) // returns true
 * equals(1, "1") // returns false
 */
export function equals(a, b) {
    return a === b;
}

/**
 * Util class aggregates utility modules and provides convenience methods.
 * Centralizes access to Array, Date, String, Object, Number utilities and operators.
 * @class Util
 * @example
 * Util.Array.first([1, 2, 3]) // returns 1
 * Util.type([]) // returns "array"
 * Util.isArray([]) // returns true
 */
class Util {
    /** @type {ArrayUtil} Array utility methods */
    static Array = ArrayUtil;
    /** @type {DateUtil} Date utility methods */
    static Date = DateUtil;
    /** @type {StringUtil} String utility methods */
    static String = StringUtil;
    /** @type {ObjectUtil} Object utility methods */
    static Object = ObjectUtil;
    /** @type {NumberUtil} Number utility methods */
    static Number = NumberUtil;
    /** @type {Object} Comparison operators */
    static operators = operators;

    /** @type {Function} Type checking function */
    static type = type;

    /**
     * Checks if an item is an array.
     * @param {*} item - The item to check
     * @returns {boolean} True if item is an array
     * @static
     */
    static isArray(item) {
        return this.type(item, "array");
    }

    /**
     * Checks if an item is an object.
     * @param {*} item - The item to check
     * @returns {boolean} True if item is an object
     * @static
     */
    static isObject(item) {
        return this.type(item, "object");
    }

    /**
     * Checks if an item is a number.
     * @param {*} item - The item to check
     * @returns {boolean} True if item is a number
     * @static
     */
    static isNumber(item) {
        return this.type(item, "number");
    }

    /** @type {Function} Check if value is empty */
    static empty = empty;

    /** @type {Function} Generate UUID v4 */
    static uuid = uuid;
}

export default Util;

/**
 * Conditional utility module providing value testing and equality checking functions.
 * Includes null checks, boolean checks, deep equality comparisons, and type checking.
 * @module Condition
 */

/**
 * Checks if a value is null.
 * @param {*} value - Value to check
 * @returns {boolean} True if value is null
 * @example
 * isNull(null) // returns true
 * isNull(undefined) // returns false
 */
export function isNull(value) {
    return value === null;
}

/**
 * Checks if a value is exactly true.
 * @param {*} value - Value to check
 * @returns {boolean} True if value === true
 * @example
 * isTrue(true) // returns true
 * isTrue(1) // returns false
 */
export function isTrue(value) {
    return value === true;
}

/**
 * Checks if a value is exactly false.
 * @param {*} value - Value to check
 * @returns {boolean} True if value === false
 * @example
 * isFalse(false) // returns true
 * isFalse(0) // returns false
 */
export function isFalse(value) {
    return value === false;
}

/**
 * Checks if a string represents a falsy value.
 * Includes: "false", "null", "undefined", "0", "-0", "NaN", "0n", "-0n", false, null, undefined.
 * @param {string|*} value - Value to check
 * @returns {boolean} True if value is in the falseish list
 * @example
 * falseish("false") // returns true
 * falseish("0") // returns true
 * falseish("true") // returns false
 */
export function falseish(value) {
    return ["false", "null", "undefined", "0", "-0", "NaN", "0n", "-0n", false, null, undefined].includes(value);
}

/**
 * Checks if a value is truthy (not implemented yet).
 * @returns {undefined}
 */
export function truish() {}

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
    if (val === undefined || val === null || val == "") return true;

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
    }
    return empty;
}

/**
 * Checks if any value in the arguments is not equal to the first value.
 * @param {...*} args - Values to compare (first value is the reference)
 * @returns {boolean} True if any value differs from the first
 * @example
 * notEqual(1, 1, 1) // returns false
 * notEqual(1, 1, 2) // returns true
 */
export function notEqual(...args) {
    const src = args[0];
    return args.some((item) => item !== src);
}

/**
 * Deep equality check for two values of any type.
 * Recursively compares arrays, objects, dates, and primitive values.
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if values are deeply equal
 * @example
 * equal([1, 2, 3], [1, 2, 3]) // returns true
 * equal({a: 1, b: 2}, {a: 1, b: 2}) // returns true
 * equal(new Date(2024, 0, 1), new Date(2024, 0, 1)) // returns true
 */
export function equal(a, b) {
    const t = type(a);
    if (type(b) !== t) return false;
    switch (t) {
        case "array":
            return a.length === b.length && a.every((item, index) => equal(item, b[index]));
            break;
        case "object":
            return (
                Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((key) => equal(a[key], b[key]))
            );
            break;
        case "date":
            return a.getTime() === b.getTime();
            break;
        case "function":
            return true;
            break;
        default:
            return a === b;
    }
}

/**
 * Checks if all values in the arguments are equal to the first value.
 * Uses deep equality comparison.
 * @param {...*} args - Values to compare (first value is the reference)
 * @returns {boolean} True if all values are equal to the first
 * @example
 * isEqual(1, 1, 1) // returns true
 * isEqual([1, 2], [1, 2], [1, 2]) // returns true
 * isEqual(1, 1, 2) // returns false
 */
export function isEqual(...args) {
    const src = args[0];
    return args.every((item) => equal(item, src));
}

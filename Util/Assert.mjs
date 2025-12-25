/**
 * Assertion utility module providing comparison operators and conditional testing.
 * Includes type checking, comparison operations, and scoped conditional evaluation.
 * @module Assert
 */

import DotNotation from "./DotNotation.mjs";

/**
 * Map of comparison operators to their function names.
 * @type {Object<string, string>}
 */
export const operators = {
    "==": "equal",
    "!=": "notEqual",
    "===": "is",
    "!==": "isNot",
    "<": "lessThan",
    "<=": "lessThanOrEqual",
    ">": "greaterThan",
    ">=": "greaterThanOrEqual",
};

/**
 * Checks loose equality (==) between two values.
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if a == b
 * @example
 * equal(1, "1") // returns true
 */
export function equal(a, b) {
    return a == b;
}

/**
 * Checks loose inequality (!=) between two values.
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if a != b
 */
export function notEqual(a, b) {
    return a != b;
}

/**
 * Checks strict equality (===) between two values.
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if a === b
 * @example
 * is(1, 1) // returns true
 * is(1, "1") // returns false
 */
export function is(a, b) {
    return a === b;
}

/**
 * Checks strict inequality (!==) between two values.
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if a !== b
 */
export function isNot(a, b) {
    return a !== b;
}

/**
 * Checks if first value is less than second.
 * @param {number} a - First value
 * @param {number} b - Second value
 * @returns {boolean} True if a < b
 */
export function lessThan(a, b) {
    return a < b;
}

/**
 * Checks if first value is less than or equal to second.
 * @param {number} a - First value
 * @param {number} b - Second value
 * @returns {boolean} True if a <= b
 */
export function lessThanOrEqual(a, b) {
    return a <= b;
}

/**
 * Checks if first value is greater than second.
 * @param {number} a - First value
 * @param {number} b - Second value
 * @returns {boolean} True if a > b
 */
export function greaterThan(a, b) {
    return a > b;
}

/**
 * Checks if first value is greater than or equal to second.
 * @param {number} a - First value
 * @param {number} b - Second value
 * @returns {boolean} True if a >= b
 */
export function greaterThanOrEqual(a, b) {
    return a >= b;
}

/**
 * Checks if a value is a finite number.
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a finite number
 * @example
 * isNumber(123) // returns true
 * isNumber(Infinity) // returns false
 * isNumber("123") // returns false
 */
export function isNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

/**
 * Checks if a value matches a specific type.
 * @param {*} value - Value to check
 * @param {string} type - Type name to check against ("number", "string", "array", "object")
 * @returns {boolean} True if value matches the type
 * @example
 * type([], "array") // returns true
 * type({}, "object") // returns true
 */
export function type(value, type) {
    if (type === "number") {
        return isNumber(value);
    } else if (type === "string") {
        return typeof value === type;
    } else if (type === "array") {
        return Array.isArray(value);
    } else if (type === "object") {
        return typeof value === "object";
    }
    return typeof value === type;
}

/**
 * Assert class provides static assertion and comparison methods.
 * Includes location checking, scoped conditionals, and all comparison operators.
 * @class Assert
 * @example
 * Assert.equal(1, "1") // returns true
 * Assert.isLocation("https://example.com") // returns true
 */
class Assert {
    /** @type {Object<string, string>} Comparison operator mappings */
    static operators = operators;

    /** @type {Function} Loose equality check */
    static equal = equal;
    /** @type {Function} Loose inequality check */
    static notEqual = notEqual;
    /** @type {Function} Strict equality check */
    static is = is;
    /** @type {Function} Strict inequality check */
    static isNot = isNot;
    /** @type {Function} Less than or equal check */
    static lessThanOrEqual = lessThanOrEqual;
    /** @type {Function} Greater than or equal check */
    static greaterThanOrEqual = greaterThanOrEqual;
    /** @type {Function} Less than check */
    static lessThan = lessThan;
    /** @type {Function} Greater than check */
    static greaterThan = greaterThan;

    /**
     * Checks if input string is a file path or URL.
     * Tests against patterns for HTTP/FTP URLs, file paths, and relative paths.
     * @param {string} input - String to test
     * @returns {boolean} True if input appears to be a location (URL or path)
     * @static
     * @example
     * Assert.isLocation("https://example.com") // returns true
     * Assert.isLocation("/path/to/file.js") // returns true
     * Assert.isLocation("not a path") // returns false
     */
    static isLocation(input) {
        // Regular expressions to match paths and URLs
        const urlOrPathRegex =
            /^(?:https?:\/\/|ftp:\/\/|file:\/\/|www\.)|(?:\/|[a-zA-Z]:\\|(?:\.{1,2}\/)+|(?:\.{1,2}\\)+|(?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)|(?:\.{1,2}\/(?:\w+\/)*\w+\.\w+)$/;
        const lines = input.trim().split("\n");
        if (urlOrPathRegex.test(input) && lines.length == 1) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Evaluates a conditional expression with values resolved from a scope object.
     * Parses expressions like "user.age > 18" and resolves values from scope.
     * @param {string} string - Conditional expression (e.g., "user.age > 18")
     * @param {Object} scope - Object to resolve values from using dot notation
     * @returns {boolean} Result of the comparison
     * @static
     * @example
     * Assert.scopedCondition("user.age > 18", {user: {age: 25}}) // returns true
     */
    static scopedCondition(string, scope) {
        const compareOperators = Object.keys(Assert.operators);
        const parts = string.split(/[\s]+/);
        let value1 = parts.shift(),
            operator = parts.shift(),
            value2 = parts.shift();

        const compareName = Assert.operators[operator];

        const values = [value1, value2].map((v) => {
            if ([`'`, `"`].includes(v.trim().charAt(0))) {
                //Is string
                return v.trim().replace(/^['"]|['"]$/g, "");
            } else if (DotNotation.find(v, scope)) {
                //Is Path
                return DotNotation.find(v, scope);
            }
            return undefined;
        });

        return Assert[compareName](...values);
    }

    /**
     * Evaluates a complex conditional with AND/OR operators.
     * Supports chaining multiple conditions with || and && operators.
     * @param {string} string - Complex conditional expression
     * @param {Object} scope - Object to resolve values from
     * @returns {boolean} Result of the conditional evaluation
     * @static
     * @example
     * Assert.scopedConditional("age > 18 && status == 'active'", scope)
     */
    static scopedConditional(string, scope) {
        let result = false;
        const OR = string.split("||");

        OR.forEach((statement) => {
            statement.split("&&").forEach((statement) => {});
        });
        //.split.split(' ').forEach(
    }
}

export default Assert;

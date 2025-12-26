/**
 * Regular expression utility module providing common regex patterns.
 * Includes patterns for method calls, JSON validation, and numeric values.
 * @module Regex
 */

/**
 * Regular expression to test if a string contains a method call pattern (e.g., "funcName(...)").
 * @type {RegExp}
 * @example
 * IS_METHOD_CALL.test("myFunc()") // returns true
 * IS_METHOD_CALL.test("myFunc(arg1, arg2)") // returns true
 */
export const IS_METHOD_CALL = /\w+\(.*?\)/;

/**
 * Regular expression to capture method name and arguments from a method call string.
 * Captures: [full match, method name, arguments string]
 * @type {RegExp}
 * @example
 * "myFunc(arg1, arg2)".match(METHOD_CALL) // returns ["myFunc(arg1, arg2)", "myFunc", "arg1, arg2"]
 */
export const METHOD_CALL = /(\w+)\((.*?)\)/;

/**
 * Regular expression to validate if a string is valid JSON.
 * Tests for proper JSON structure including strings, numbers, booleans, null, arrays, and objects.
 * @type {RegExp}
 */
export const IS_JSON = /^[\],:{}\s]*$|^"([^\\"]|\\["\\bfnrt\/]|\\u[\da-fA-F]{4})*"(?=[\],:{}\s]*$)|^'([^\\']|\\['\\bfnrt\/]|\\u[\da-fA-F]{4})*'(?=[\],:{}\s]*$)|^\d+\.\d+(?=\s*[\],:{}])|^0$|^-?\d+(?=\s*[\],:{}])|^true(?=\s*[\],:{}])|^false(?=\s*[\],:{}])|^null(?=\s*[\],:{}])|^(?!")(?!')(?!.*\\["\\]).*[^\\]$/;

/**
 * Regular expression to test if a string represents a numeric value (integer or decimal).
 * @type {RegExp}
 * @example
 * NUMERIC.test("123") // returns true
 * NUMERIC.test("123.45") // returns true
 * NUMERIC.test("-123.45") // returns true
 * NUMERIC.test("abc") // returns false
 */
export const NUMERIC = /^-?\d+(\.\d+)?$/;
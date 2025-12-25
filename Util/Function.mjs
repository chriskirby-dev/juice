/**
 * Function utility module for parsing function strings.
 * @module Function
 */

/**
 * Parses a function string to extract its arguments.
 * Extracts arguments from a string representation of a function call.
 * @param {string} string - The function string to parse (e.g., "myFunc('arg1', 'arg2')")
 * @returns {{args: Array<string>}} Object containing parsed arguments
 * @example
 * parseString("myFunc('arg1', 'arg2')") // returns {args: ["arg1", "arg2"]}
 */
export function parseString(string) {
    const parse = {};
    parse.args = string
        .split("(")
        .pop()
        .split(")")
        .shift()
        .split(",")
        .map((arg) => arg.replace(/['"]/g, "").trim());
}

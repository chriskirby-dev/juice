/**
 * Eval utility module providing safe expression evaluation with token substitution.
 * Includes operator definitions and functions for safely evaluating JavaScript expressions.
 * @module Eval
 */

/**
 * JavaScript operator categories for reference.
 * @type {Object<string, Array<string>>}
 */
export const operators = {
    relational: ["<", ">", "<=", ">=", "==", "===", "!=", "!=="],
    arithmetic: ["+", "-", "*", "/", "%"],
    assignment: ["=", "+=", "-=", "*=", "/=", "%="],
    incremental: ["++", "--"],
    bitwise: ["&", "|", "^", "~", ">>", "<<", ">>>"],
    logical: ["!", "&&", "||"],
    conditional: ["?:"],
    ternary: ["?"]
};

/**
 * Safely evaluates a JavaScript expression string with token substitution.
 * Tokens in the expression are replaced with values from the tokens object.
 * @param {string} string - JavaScript expression to evaluate
 * @param {Object} [tokens={}] - Object mapping token names to values
 * @returns {*} Result of the evaluation, or null if error occurs
 * @example
 * safeEval("x + y", {x: 5, y: 10}) // returns 15
 * safeEval("name === 'John'", {name: 'John'}) // returns true
 */
export function safeEval(string, tokens = {}) {
    try {
        const result = new Function("tokens", prepareTokensInString(string));
        return result(tokens);
    } catch (e) {
        console.error(e);
        return null;
    }
}

/**
 * Finds all tokens from the tokens object that appear in the string.
 * Only matches whole tokens (not partial matches within other words).
 * @param {string} string - String to search for tokens
 * @param {Object} [tokens={}] - Object containing token names as keys
 * @returns {Array<string>} Array of token names found in the string
 * @example
 * findTokensInString("x + y * z", {x: 1, y: 2, z: 3, w: 4}) // returns ["x", "y", "z"]
 */
export function findTokensInString(string, tokens = {}) {
    const found = [];
    Object.keys(tokens).forEach((token) => {
        if (string.indexOf(token) === -1) return;
        const idx = string.indexOf(token);
        if (["", " "].includes(string.charAt(idx - 1)) && ["", " ", "."].includes(string.charAt(idx + token.length))) {
            if (!found.includes(token)) found.push(token);
        }
    });
    return found;
}

/**
 * Prepares a string for evaluation by replacing token names with tokens object property access.
 * Transforms "x + y" to "tokens.x + tokens.y" for use with safeEval.
 * @param {string} string - String containing tokens to replace
 * @param {Object} [tokens={}] - Object containing token names as keys
 * @returns {string} String with tokens replaced by tokens.tokenName
 * @example
 * prepareTokensInString("x + y", {x: 1, y: 2}) // returns "tokens.x + tokens.y"
 */
export function prepareTokensInString(string, tokens = {}) {
    Object.keys(tokens).forEach((token) => {
        if (string.indexOf(token) === -1) return;
        const idx = string.indexOf(token);
        if (["", " "].includes(string.charAt(idx - 1)) && ["", " ", "."].includes(string.charAt(idx + token.length))) {
            string = string.replace(token, `tokens.${token}`);
        }
    });
    return string;
}

/**
 * Evaluates a JavaScript statement with variable substitution.
 * Alias for safeEval with more descriptive name.
 * @param {string} string - JavaScript expression to evaluate
 * @param {Object} [variables={}] - Object mapping variable names to values
 * @returns {*} Result of the evaluation
 * @example
 * evalStatement("count > 5", {count: 10}) // returns true
 */
export function evalStatement(string, variables = {}) {
    return safeEval(string, variables);
}

export default {
    safeEval,
    findTokensInString,
    prepareTokensInString,
    evalStatement
};

/**
 * Splits a string into words based on spaces, hyphens, and underscores.
 * @param {string} string - The string to split
 * @returns {Array<string>} Array of words
 * @example
 * words("hello-world_test") // returns ["hello", "world", "test"]
 */
export const words = (string) => string.split(/[\s\-_]/g);

/**
 * Converts a string to lowercase.
 * @param {string} str - The string to convert
 * @returns {string} The lowercase string
 */
export const toLower = (str) => str.toLowerCase();

/**
 * Converts a string to uppercase.
 * @param {string} str - The string to convert
 * @returns {string} The uppercase string
 */
export const toUpper = (str) => str.toUpperCase();

/**
 * Capitalizes the first character of a string.
 * @param {string} string - The string to capitalize
 * @returns {string} The string with first character capitalized
 * @example
 * ucword("hello") // returns "Hello"
 */
export const ucword = (string) => string.charAt(0).toUpperCase() + string.substr(1);

/**
 * Capitalizes the first character of each word in a string.
 * @param {string} string - The string to capitalize
 * @returns {string} The string with each word capitalized
 * @example
 * ucwords("hello world") // returns "Hello World"
 */
export const ucwords = (string) =>
    words(string)
        .map((word) => ucword(word))
        .join(" ");

/**
 * Replaces all occurrences of a search string with a replacement string.
 * @param {string} string - The string to search in
 * @param {string} search - The string to search for
 * @param {string} replace - The replacement string
 * @returns {string} The string with all occurrences replaced
 */
export const replaceAll = (string, search, replace) => string.split(search).join(replace);

/**
 * Converts a string to camelCase.
 * First word is lowercase, remaining words have first character capitalized.
 * @param {string} value - The string to convert
 * @returns {string} The camelCase string
 * @example
 * camelCase("hello_world-test") // returns "helloWorldTest"
 */
export const camelCase = (value) => {
    const parts = value.split(/[_-\s]/);
    return (
        parts.shift().toLowerCase() +
        parts
            .map((part) => {
                return part.charAt(0).toUpperCase() + part.substr(1);
            })
            .join("")
    );
};

/**
 * Converts a string to PascalCase.
 * All words have their first character capitalized.
 * @param {string} value - The string to convert
 * @returns {string} The PascalCase string
 * @example
 * pascalCase("hello_world-test") // returns "HelloWorldTest"
 */
export const pascalCase = function (value) {
    const parts = value.split(/[_-\s]/);
    return parts
        .map((part) => {
            return part.charAt(0).toUpperCase() + part.substr(1);
        })
        .join("");
};

/**
 * Converts a PascalCase string to a separated format.
 * @param {string} value - The PascalCase string to convert
 * @param {string} [seperator="_"] - The separator to use between words
 * @returns {string} The separated string
 * @example
 * unPascal("HelloWorld") // returns "hello_world"
 */
export const unPascal = function (value, seperator = "_") {
    return value
        .replace(/[A-Z]/g, (m) => " " + m.toLowerCase())
        .trim()
        .replace(" ", seperator);
};

/**
 * Converts a string to studly case (similar to camelCase).
 * @param {string} value - The string to convert
 * @returns {string} The studly case string
 */
export const studly = function (value) {
    const parts = value.split(/[_-]/);
    return (
        parts.shift().toLowerCase() +
        parts
            .map((part) => {
                return part.charAt(0).toUpperCase() + part.substr(1);
            })
            .join("")
    );
};

/**
 * Converts a studly case string back to underscore separated format.
 * @param {string} value - The studly case string to convert
 * @returns {string} The underscore separated string
 * @example
 * unStudly("helloWorld") // returns "hello_world"
 */
export const unStudly = function (value) {
    return value.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
};

/**
 * Converts a string to normal case with specified separator.
 * @param {string} value - The string to convert
 * @param {string} [seperator="_"] - The separator to use
 * @returns {string} The normalized string
 */
export function normalCase(value, seperator = "_") {
    return value
        .replace(/[A-Z_-\s]/g, (m) => " " + m.toLowerCase())
        .trim()
        .replace(" ", seperator);
}

/**
 * Converts a string to dash-separated lowercase format.
 * @param {string} value - The string to convert
 * @returns {string} The dashed string
 * @example
 * dashed("HelloWorld") // returns "hello-world"
 */
export function dashed(value) {
    let dashed = value.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    return dashed.charAt(0) == "-" ? dashed.slice(1) : dashed;
}

/**
 * Replaces placeholders in a string with the values in an array
 *
 * @param {string} template The string to replace placeholders in
 * @param {array} values An array of values to replace placeholders with
 * @param {array} placeholders An array of token names to replace placeholders with
 *
 * @returns {string} The string with placeholders replaced
 */
export function sprintx(template, values = [], placeholders = []) {
    let result = template;
    for (let i = 0; i < values.length; i++) {
        // Replace %token... with the entire array joined by commas
        result = result.replace(`%${placeholders[i]}...`, values[i].join(", "));
        // Replace individual %token values in the string with the corresponding values in the array
        result = values[i].reduce((acc, val) => acc.replace(`%${placeholders[i]}`, val), result);
    }
    return result;
}

/**
 * Replace placeholders in a string with the values in an array
 *
 * This function works the same as the built-in printf() function.
 * It takes a string and replaces placeholders with values from an array.
 * The placeholders are %s.
 *
 * @param {string} string The string to replace placeholders in
 * @param {array} args An array of values to replace placeholders with
 *
 * @returns {string} The string with placeholders replaced
 */
function sprintf(string, args) {
    const tokens = [...args];
    const replacer = (placeholder, value) => placeholder.replace(/%s/, value);
    return tokens.reduce(replacer, string);
}

/**
 * Replaces placeholders in a string with the values in an array
 *
 * This function works the same as the built-in sprint() function.
 * It takes a string and replaces placeholders with values from an array.
 * The placeholders are %s.
 *
 * @param {string} template The string to replace placeholders in
 * @param {array} values An array of values to replace placeholders with
 *
 * @returns {string} The string with placeholders replaced
 */
function sprintMake(template, values) {
    const replacer = (string, token) => string.replace(token, "%s");
    return values.reduce(replacer, template);
}

/**
 * String utility class providing various string manipulation methods.
 * @namespace StringUtil
 */
export default {
    upper: toUpper,
    lower: toLower,

    /**
     * Returns an array of common string separators.
     * @returns {Array<string>} Array of separators: ["-", "_", " "]
     */
    seperators() {
        return ["-", "_", " "];
    },

    words,

    ucword,

    ucwords,

    replaceAll,

    /**
     * Template function that replaces %s placeholders with provided arguments.
     * @param {string} string - The template string with %s placeholders
     * @param {Array} args - Array of values to replace placeholders with
     * @returns {string} The string with placeholders replaced
     * @example
     * tpl("Hello %s, you are %s", ["World", "awesome"]) // returns "Hello World, you are awesome"
     */
    tpl(string, args) {
        var replacer = function (p, c) {
            return p.replace(/%s/, c);
        };
        return args.reduce(replacer, string);
    },

    sprintx,
    sprintf,

    camelCase,
    sprintMake,

    pascalCase,

    unPascal,

    studly,

    unStudly,

    /**
     * Converts a string to camelCase (alias for camelCase function).
     * @param {string} value - The string to convert
     * @returns {string} The camelCase string
     */
    camel(value) {
        const parts = value.split(/[_-\s]/);
        return (
            parts.shift().toLowerCase() +
            parts
                .map((part) => {
                    return part.charAt(0).toUpperCase() + part.substr(1);
                })
                .join("")
        );
    },

    /**
     * Converts a string to dashed lowercase format (alias for dashed function).
     * @param {string} value - The string to convert
     * @returns {string} The dashed string
     */
    dashed(value) {
        let dashed = value.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
        return dashed.charAt(0) == "-" ? dashed.slice(1) : dashed;
    },

    /**
     * Converts a string to a computer-friendly format (lowercase, alphanumeric with dashes).
     * Removes special characters and replaces spaces with dashes.
     * @param {string} value - The string to convert
     * @returns {string} The computerized string
     * @example
     * computize("Hello World!") // returns "hello-world"
     */
    computize(value) {
        if (!value) return "";
        value = value.replace(/[\[\]]/g, "-");
        return value
            .replace(/[^a-zA-Z0-9 -]/g, "")
            .replace(/\s/g, "-")
            .toLowerCase();
    },
};
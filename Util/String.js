/**
 * String utility module providing string manipulation and case conversion functions.
 * Includes case transformations, formatting functions, and string utilities.
 * @module String
 */

/**
 * Separator pattern for splitting strings.
 * @type {RegExp}
 */
const SEPERATOR = /[_-\s]/;


/**
 * Converts a string to PascalCase (first letter of every word capitalized).
 * @param {string} value - String to convert
 * @returns {string} PascalCase string
 * @example
 * pascalCase("hello_world") // returns "HelloWorld"
 * pascalCase("my-function-name") // returns "MyFunctionName"
 */
export function pascalCase(value){
    const parts = value.split(/[_-\s]/);
    return parts.map((part) => {
        return part.charAt(0).toUpperCase() + part.substr(1);
    }).join('');
}

/**
 * Converts a string to studly case (similar to camelCase, first word lowercase).
 * @param {string} value - String to convert
 * @returns {string} Studly case string
 * @example
 * studly("hello_world") // returns "helloWorld"
 */
export function studly( value ){
    const parts = value.split(/[_-]/);
    return parts.shift().toLowerCase() + ( parts.map((part) => {
        return part.charAt(0).toUpperCase() + part.substr(1);
    }).join('') );
}

/**
 * Converts a studly/camel case string back to underscore separated format.
 * @param {string} value - Studly/camel case string
 * @returns {string} Underscore separated string
 * @example
 * unStudly("helloWorld") // returns "hello_world"
 */
export function unStudly(value){
    return value.replace(/[A-Z]/g, m => "_" + m.toLowerCase());
}

/**
 * Converts a string to normal case with specified separator.
 * @param {string} value - String to convert
 * @param {string} [seperator='_'] - Separator to use between words
 * @returns {string} Normalized string
 */
export function normalCase( value, seperator = '_' ){
    return value.replace(/[A-Z_-\s]/g, m => " " + m.toLowerCase()).trim().replace(' ', seperator );
}

/**
 * Converts a string to camelCase (first word lowercase, subsequent words capitalized).
 * @param {string} str - String to convert
 * @returns {string} camelCase string
 * @example
 * camelCase("hello_world") // returns "helloWorld"
 */
export function camelCase( str ){
    const parts = str.split(/[_-\s]/);
    return parts.shift().toLowerCase() + ( parts.map((part) => {
        return part.charAt(0).toUpperCase() + part.substr(1);
    }).join('') );
}

/**
 * Converts a string to uppercase.
 * @param {string} str - String to convert
 * @returns {string} Uppercase string
 */
export function toUpper( str ){
    return str.toUpperCase();
}

/**
 * Converts a string to lowercase.
 * @param {string} str - String to convert
 * @returns {string} Lowercase string
 */
export function toLower( str ){
    return str.toLowerCase();
}

/**
 * Capitalizes the first character of a string.
 * @param {string} str - String to capitalize
 * @returns {string} String with first character capitalized
 * @example
 * capitalize("hello") // returns "Hello"
 */
export function capitalize( str ){
    return str.charAt(0).toUpperCase() + str.substr(1);
}

/**
 * String formatting function similar to C's sprintf.
 * Replaces %s placeholders with values from args array in order.
 * @param {string} string - Template string with %s placeholders
 * @param {Array} args - Array of values to substitute
 * @returns {string} Formatted string
 * @example
 * sprintf("Hello %s, you are %s", ["World", "awesome"]) // returns "Hello World, you are awesome"
 */
export function sprintf( string, args ){
    var replacer = function(p,c){return p.replace(/%s/,c)};
    return args.reduce( replacer, string );
}

/**
 * Converts a string to a computer-friendly format (lowercase, alphanumeric with dashes).
 * Removes special characters and replaces spaces with dashes.
 * @param {string} value - String to convert
 * @returns {string} Computer-friendly string
 * @example
 * computize("Hello World!") // returns "hello-world"
 * computize("Test [123]") // returns "test-123"
 */
export function computize( value ){
    if(!value) return '';
    value = value.replace(/[\[\]]/g, '-')
    return value.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s/g, '-').toLowerCase();
}

export default {

};
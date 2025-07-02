export const words = (string) => string.split(/[\s\-_]/g);

export const toLower = (str) => str.toLowerCase();
export const toUpper = (str) => str.toUpperCase();

export const ucword = (string) => string.charAt(0).toUpperCase() + string.substr(1);
export const ucwords = (string) =>
    words(string)
        .map((word) => ucword(word))
        .join(" ");

export const replaceAll = (string, search, replace) => string.split(search).join(replace);

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

//Change to Pascal case (first wortd lower remaining words capitalxxcs)
export const pascalCase = function (value) {
    const parts = value.split(/[_-\s]/);
    return parts
        .map((part) => {
            return part.charAt(0).toUpperCase() + part.substr(1);
        })
        .join("");
};

export const unPascal = function (value, seperator = "_") {
    return value
        .replace(/[A-Z]/g, (m) => " " + m.toLowerCase())
        .trim()
        .replace(" ", seperator);
};

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

export const unStudly = function (value) {
    return value.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
};

export function normalCase(value, seperator = "_") {
    return value
        .replace(/[A-Z_-\s]/g, (m) => " " + m.toLowerCase())
        .trim()
        .replace(" ", seperator);
}

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

export default {
    upper: toUpper,
    lower: toLower,

    seperators() {
        return ["-", "_", " "];
    },

    words,

    ucword,

    ucwords,

    replaceAll,

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

    dashed(value) {
        let dashed = value.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
        return dashed.charAt(0) == "-" ? dashed.slice(1) : dashed;
    },

    computize(value) {
        if (!value) return "";
        value = value.replace(/[\[\]]/g, "-");
        return value
            .replace(/[^a-zA-Z0-9 -]/g, "")
            .replace(/\s/g, "-")
            .toLowerCase();
    },
};

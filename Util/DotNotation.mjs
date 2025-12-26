/**
 * Cache for parsed paths to improve performance on repeated accesses.
 * @type {Map<string, Array>}
 */
const CACHE = new Map();

/**
 * Parses a dot notation path with optional array bracket notation into an array of keys.
 * Results are cached for performance. Supports paths like "a.b.c" and "a[0].b[1]".
 * @param {string} path - The dot notation path to parse
 * @returns {Array<string|number>} Array of keys/indices for accessing nested properties
 * @example
 * parsePath("user.name") // returns ["user", "name"]
 * parsePath("items[0].name") // returns ["items", 0, "name"]
 */
function parsePath(path) {
    if (CACHE.has(path)) {
        return CACHE.get(path);
    }
    const parts = path.split(".");
    const keys = [];
    for (let part of parts) {
        const match = part.match(/(\w+)(?:\[(\d+)\])?/);
        if (match) {
            const key = match[1];
            const index = match[2];
            keys.push(index !== undefined ? parseInt(index) : key);
        }
    }
    CACHE.set(path, keys);
    return keys;
}

/**
 * Retrieves a value from a nested object using dot notation path.
 * @param {Object} obj - The object to traverse
 * @param {string} path - The dot notation path (e.g., "a.b.c")
 * @returns {*} The value at the specified path, or undefined if not found
 * @example
 * getDotPath({a: {b: {c: 5}}}, "a.b.c") // returns 5
 */
export function getDotPath(obj, path) {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Sets a value in a nested object using dot notation path.
 * Creates intermediate objects as needed.
 * @param {Object} obj - The object to modify
 * @param {string} path - The dot notation path (e.g., "a.b.c")
 * @param {*} value - The value to set
 * @example
 * const obj = {a: {}};
 * setDotPath(obj, "a.b.c", 5); // obj is now {a: {b: {c: 5}}}
 */
export function setDotPath(obj, path, value) {
    const parts = path.split(".");
    const lastPart = parts.pop(); // Get the last part (e.g., "c")
    const target = parts.reduce((acc, part) => acc && acc[part], obj); // Drill down to the second last object

    if (target) {
        target[lastPart] = value; // Set the value
    }
}

/**
 * Parses a dot notation path into parent path and property name.
 * @param {string} path - The dot notation path
 * @param {Object} [obj] - Optional object to resolve the parent from
 * @returns {{parent: (Object|string), property: string}} Object containing parent reference and property name
 * @example
 * parseDotPath("a.b.c") // returns {parent: "a.b", property: "c"}
 */
export function parseDotPath(path, obj) {
    const parent = path.slice(0, path.lastIndexOf("."));
    const property = path.slice(parent.length + 1);
    return { parent: obj ? getDotPath(obj, parent) : parent, property };
}

/**
 * DotNotation class provides a convenient way to access and manipulate nested objects
 * using dot notation paths with optional array bracket notation.
 * Supports deep nested property access, creation, and deletion.
 * 
 * @class DotNotation
 * @example
 * const data = new DotNotation({user: {name: "John"}});
 * data.get("user.name"); // "John"
 * data.set("user.age", 30);
 * data.delete("user.name");
 */
class DotNotation {
    /**
     * Creates a new DotNotation instance wrapping the provided object.
     * @param {Object} object - The root object to wrap
     */
    constructor(object) {
        this.root = object;
    }

    /**
     * Gets a value from the wrapped object using a dot notation path.
     * Supports array bracket notation (e.g., "items[0].name").
     * @param {string} path - The path to retrieve (e.g., "user.profile.name")
     * @returns {*} The value at the specified path, or undefined if not found
     * @example
     * dotNotation.get("user.profile.name")
     * dotNotation.get("items[0].title")
     */
    get(path) {
        const keys = parsePath(path);
        let value = this.root;
        for (let key of keys) {
            value = value[key];
            if (value === undefined) {
                return undefined;
            }
        }
        return value;
    }

    /**
     * Sets a value in the wrapped object using a dot notation path.
     * Creates intermediate objects or arrays as needed based on the next key type.
     * @param {string} path - The path to set (e.g., "user.profile.name")
     * @param {*} newValue - The value to set at the specified path
     * @example
     * dotNotation.set("user.profile.name", "John")
     * dotNotation.set("items[0].title", "First Item")
     */
    set(path, newValue) {
        const keys = parsePath(path);
        let target = this.root;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (target[key] === undefined || typeof target[key] !== "object") {
                // Determine if the next key is an array index or an object key
                const nextKey = keys[i + 1];
                target[key] = typeof nextKey === "number" || nextKey.match(/^\d+$/) ? [] : {};
            }
            target = target[key];
        }
        target[keys[keys.length - 1]] = newValue;
    }

    /**
     * Deletes a property from the wrapped object using a dot notation path.
     * @param {string} path - The path to the property to delete
     * @example
     * dotNotation.delete("user.profile.age")
     */
    delete(path) {
        const keys = parsePath(path);
        let target = this.root;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            target = target[key];
            if (!target) {
                return; // Path does not exist
            }
        }
        delete target[keys[keys.length - 1]];
    }

    /**
     * Returns the primitive value of the wrapped object.
     * @returns {Object} The root object
     */
    valueOf() {
        return this.root;
    }

    /**
     * Gets the raw underlying object.
     * @returns {Object} The root object
     */
    get raw() {
        return this.root;
    }
}

export default DotNotation;
// Helper function to parse dot notation with array brackets
const CACHE = new Map();
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

export function getDotPath(obj, path) {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export function setDotPath(obj, path, value) {
    const parts = path.split(".");
    const lastPart = parts.pop(); // Get the last part (e.g., "c")
    const target = parts.reduce((acc, part) => acc && acc[part], obj); // Drill down to the second last object

    if (target) {
        target[lastPart] = value; // Set the value
    }
}

export function parseDotPath(path, obj) {
    const parent = path.slice(0, path.lastIndexOf("."));
    const property = path.slice(parent.length + 1);
    return { parent: obj ? getDotPath(obj, parent) : parent, property };
}

class DotNotation {
    constructor(object) {
        this.root = object;
    }

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

    valueOf() {
        return this.root;
    }

    get raw() {
        return this.root;
    }
}

export default DotNotation;

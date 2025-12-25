/**
 * JuiceStorage provides a wrapper around localStorage with support for namespaced storage,
 * type conversions, and caching functionality.
 * @class JuiceStorage
 * @example
 * const storage = new JuiceStorage();
 * storage.set('user.name', 'John');
 * const name = storage.get('user.name');
 */
class JuiceStorage {
    basePath = "juice:storage";
    internalPath = "juice:storage:_index";
    _index = {};
    buckets = [];
    cacheIndex = {};

    /**
     * Creates a new JuiceStorage instance and initializes it from localStorage.
     */
    constructor() {
        this.initialize();
    }

    /**
     * Sets the current directory to the root level.
     */
    root() {
        this.directory = "";
    }

    /**
     * Changes the current directory for storage operations.
     * Supports special navigation: ":" or "|" to go to root.
     * @param {string} dir - The directory to change to
     * @returns {boolean} True if directory change was successful
     */
    cd(dir) {
        let directory = this.directory;

        if (dir == ":" || dir.charAt(0) === "|") {
            directory = "";
            return true;
        }
        this.directory = [directory, dir].join(":");
        const parts = this.directory.split(":");
        let idx = this._index;
        while (parts.length) idx = idx[parts.shift()];
        this.currentIndex = idx;
    }

    /**
     * Retrieves a value from localStorage.
     * @param {string} key - The key to retrieve
     * @param {*} [defaultValue] - Default value if key doesn't exist
     * @returns {string|*} The stored value or default value
     */
    get(key, defaultValue) {
        return localStorage.getItem(`${this.basePath}:${key}`) || defaultValue;
    }

    /**
     * Converts a stored value back to its original type based on the index metadata.
     * @param {string} key - The key of the value in the index
     * @param {*} value - The value to convert
     * @param {string} [type] - The type to convert to (if known)
     * @returns {*} The converted value
     */
    accessor(key, value, type) {
        return this.currentIndex
            ? this.currentIndex[key]
                ? this.currentIndex[key].type
                    ? { number: Number, array: JSON.parse, object: JSON.parse, boolean: Boolean }[
                          this.currentIndex[key].type
                      ](value)
                    : value
                : value
            : value;
    }

    /**
     * Converts a value to a string representation suitable for storage.
     * @param {*} value - The value to convert
     * @param {string} [type] - The type of the value
     * @returns {string} The stringified value
     */
    mutator(value, type) {
        return { number: Number.toString, array: JSON.stringify, object: JSON.stringify }[type || typeof value](value);
    }

    /**
     * Sets a value in localStorage with type tracking.
     * @param {string} key - The key to set
     * @param {*} value - The value to store
     * @param {string|null} [type=null] - Optional explicit type (auto-detected if null)
     */
    set(key, value, type = null) {
        localStorage.setItem(`${this.basePath}:${key}`, this.mutator(value, type));
        this.currentIndex[key] = { type: type || typeof value };
        localStorage.setItem(`${this.internalPath}:${key}`, JSON.stringify(this.currentIndex[key]));
    }

    /**
     * Caches data with an optional expiration time.
     * @param {string} key - The cache key
     * @param {*} data - The data to cache
     * @param {number} [expires] - Expiration time in milliseconds (Infinity if not provided)
     * @param {Object} [options={}] - Additional cache options
     */
    cache(key, data, expires, options = {}) {
        const now = Date.now();
        const cacheName = ["juice:cache", key].join(":");
        const cacheData = {
            data,
            expires: expires ? now + expires : Infinity,
        };
        localStorage.setItem(cacheName, JSON.stringify(cacheData));
    }

    /**
     * Fetches and caches a file from a URL.
     * @param {string} url - The URL to fetch and cache
     * @returns {Promise<void>}
     */
    async cacheFile(url) {
        await fetch(url).then();
    }

    /**
     * Saves the current state to localStorage.
     */
    save() {
        localStorage.setItem(this.internalPath, JSON.stringify(this._index));
    }

    /**
     * Initializes the storage by loading buckets and indexes from localStorage.
     */
    initialize() {
        this.buckets = JSON.parse(this.get("juice:storage:buckets", "[]"));
        this.cacheIndex = JSON.parse(this.get("juice:cache:_index", "{}"));
        this._index = JSON.parse(this.get("juice:storage:_index", "{}"));
    }
}

export default JuiceStorage;

class JuiceStorage {
    basePath = "juice:storage";
    internalPath = "juice:storage:_index";
    _index = {};
    buckets = [];
    cacheIndex = {};

    constructor() {
        this.initialize();
    }

    root() {
        this.directory = "";
    }

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

    get(key, defaultValue) {
        return localStorage.getItem(`${this.basePath}:${key}`) || defaultValue;
    }

    accessor(value, type) {
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

    mutator(value, type) {
        return { number: Number.toString, array: JSON.stringify, object: JSON.stringify }[type || typeof value](value);
    }

    set(key, value, type = null) {
        localStorage.setItem(`${this.basePath}:${key}`, this.mutator(value, type));
        this.currentIndex[key] = { type: type || typeof value };
        localStorage.setItem(`${this.internalPath}:${key}`, JSON.stringify(this.currentIndex[key]));
    }

    cache(key, data, expires, options = {}) {
        const now = Date.now();
        const cacheName = ["juice:cache", key].join(":");
        const cacheData = {
            data,
            expires: expires ? now + expires : Infinity,
        };
        localStorage.setItem(cacheName, JSON.stringify(cacheData));
    }

    async cacheFile(url) {
        await fetch(url).then();
    }

    save() {
        this.set();
    }

    initialize() {
        this.buckets = JSON.parse(this.get("juice:storage:buckets", "[]"));
        this.cacheIndex = JSON.parse(this.get("juice:cache:_index", "{}"));
        this._index = JSON.parse(this.get("juice:storage:_index", "{}"));
    }
}

export default JuiceStorage;

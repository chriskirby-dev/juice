//Juice Core

import "./Dev/Log.mjs";
import { copyProperties } from "./Util/Class.mjs";
export const root = window || global;

import JuiceStorage from "./inc/Storage.mjs";
import JuiceQueues from "./inc/Queues.mjs";

function parseFilePath(path) {
    return {
        name: path.split("/").pop(),
        path,
        dir: path.substr(0, path.lastIndexOf("/")),
        ext: path.split(".").pop(),
    };
}

export function currentFile(meta) {
    const _url = meta.url;
    return parseFilePath(_url);
}

root.currentFile = currentFile;

class Juice {
    constructor() {
        this.root = root;
        this.resolve = import.meta.resolve;
        this.currentFile = currentFile;
        this.queues = new JuiceQueues();
        this.storage = new JuiceStorage();
        this.eventRegistry = {};
    }

    registerEvent(name, fn, args = []) {
        if (!this.eventRegistry[name]) {
            this.eventRegistry[name] = [];
        }
        this.eventRegistry[name].push(fn);
        return `juice.dispatchEvent(this,'${name}')`;
    }

    dispatchEvent(target, name, ...args) {
        if (!this.eventRegistry[name]) {
            return;
        }
        this.eventRegistry[name].forEach((fn) => fn(target, ...args));
        return false;
    }

    storage(bucket) {
        if (!this._storage) {
            let buckets = localStorage.getItem("juice:storage:buckets");
            if (buckets) {
                buckets = JSON.parse(buckets);
            } else {
                buckets = [];
            }

            this._storage = {
                buckets,
            };
        }
        localStorage;
    }

    expose() {
        (window || global).juice = this;
    }

    load(url, options = {}) {
        const parsed = parseFilePath(file);

        function fileContentsLoaded(contents) {
            if (options.cache) {
            }
        }

        switch (parsed.ext) {
            case "css":
                fetch(url)
                    .then((r) => r.text())
                    .then(fileContentsLoaded);
                break;
            case "js":
                break;
                break;
            case "html":
                break;
            default:
                break;
        }
    }
}

export const juice = new Juice();
juice.expose();

import _config from "./Configuration.mjs";
export const config = _config;
juice.config = config;

config.set("paths.root", currentFile(import.meta));

juice.path = function (scope, relative) {
    return config.get(`paths.${scope}`);
};

const callstack = [];
juice.track = function (fn) {
    return function (...args) {
        callStack.push(fn);
        try {
            return fn.apply(this, args);
        } finally {
            callStack.pop();
        }
    };
};

juice.caller = function () {
    if (callStack.length < 2) {
        return null;
    }
    return callStack[callStack.length - 1];
};

juice.blend = function (...classes) {
    class Blended {
        constructor(...args) {
            for (const Flavor of classes) {
                // Create an instance of the mixin and call its constructor with the given arguments
                const instance = new Flavor(...args);
                // Copy properties from the instance to the Mixed instance
                copyProperties(this, instance);
            }
        }
    }

    for (const Flavor of classes) {
        copyProperties(Blended, Flavor);
        copyProperties(Blended.prototype, Flavor.prototype);
    }

    return Blended;
};

export default juice;

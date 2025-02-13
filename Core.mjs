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
    static blend(...mixins) {
        class Blended {
            constructor(...args) {
                for (const Mixin of mixins) {
                    const mixinInstance = new Mixin(...args);
                    copyProperties(this, mixinInstance);
                }
            }
        }

        for (const Mixin of mixins) {
            copyProperties(Composite, Mixin);
            copyProperties(Composite.prototype, Mixin.prototype);
        }

        return Blended;
    }

    constructor() {
        this.root = root;
        this.resolve = import.meta.resolve;
        this.currentFile = currentFile;
        this.queues = new JuiceQueues();
        this.storage = new JuiceStorage();
        this.eventRegistry = {};
    }

    blend(...mixins) {
        return Juice.blend(...mixins);
    }

    registerEvent(name, fn, args = []) {
        if (!this.eventRegistry[name]) {
            this.eventRegistry[name] = [];
        }
        this.eventRegistry[name].push(fn);
        return `juice.dispatchEvent(this,'${name}')`;
    }

    dispatchEvent(target, eventName, ...args) {
        const eventRegistry = this.eventRegistry;
        const eventHandlers = eventRegistry[eventName];

        if (!eventHandlers) return;

        eventHandlers.forEach((handler) => handler(target, ...args));
    }

    expose() {
        const globalScope = typeof window !== "undefined" ? window : global;
        globalScope.juice = this;
    }

    /**
     * Loads a file from the given URL and appends it to the document body.
     *
     * @param {string} url URL of the file to load
     * @param {Object} [options={}] Optional parameters
     * @param {boolean} [options.cache=false] Whether to cache the loaded content in local storage
     * @returns {Promise<void>}
     */
    async load(url, { cache = false } = {}) {
        const { ext } = parseFilePath(url);
        let cachedContent = cache ? localStorage.getItem(`juice:cache:${url}`) : null;

        /**
         * Fetches the content of the given URL.
         *
         * @returns {Promise<string>}
         */
        const fetchContent = async () => {
            const response = await fetch(url);
            return response.text();
        };

        let content = cachedContent;
        if (!cachedContent) {
            content = await fetchContent();
            if (cache) {
                localStorage.setItem(`juice:cache:${url}`, content);
            }
        }

        /**
         * Appends an element of the given tag name and content to the document body.
         *
         * @param {string} tagName Tag name of the element to append
         * @param {string} content Content of the element
         */
        const appendElement = (tagName, content) => {
            const element = document.createElement(tagName);
            if (tagName === "style" || tagName === "script") {
                element.textContent = content;
            } else {
                element.innerHTML = content;
            }
            document.body.appendChild(element);
        };

        switch (ext) {
            case "css":
                appendElement("style", content);
                break;
            case "js":
                appendElement("script", content);
                break;
            case "html":
                appendElement("div", content);
                break;
            default:
                console.warn(`Unknown file extension: ${ext}`);
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
juice.track = function trackCall(fn) {
    return function trackedCall(...args) {
        const originalCallStackLength = callStack.length;
        callStack.push(fn);
        try {
            return fn.apply(this, args);
        } finally {
            callStack.splice(originalCallStackLength, 1);
        }
    };
};

juice.caller = function () {
    if (callStack.length < 2) {
        return null;
    }
    return callStack[callStack.length - 1];
};

export default juice;

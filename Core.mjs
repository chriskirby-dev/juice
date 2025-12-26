/**
 * Juice Core Module
 * Main entry point for the Juice JavaScript framework.
 * Provides core functionality including module loading, event handling, and configuration.
 * @module Core
 */

import "./Dev/Log.mjs";
import { copyProperties } from "./Util/Class.mjs";

export const root = window || global;

import JuiceStorage from "./inc/Storage.mjs";
import JuiceQueues from "./inc/Queues.mjs";

/**
 * Parses a file path into its component parts.
 * @param {string} path - The file path to parse
 * @returns {{name: string, path: string, dir: string, ext: string}} Object containing path components
 * @private
 */
function parseFilePath(path) {
    return {
        name: path.split("/").pop(),
        path,
        dir: path.substr(0, path.lastIndexOf("/")),
        ext: path.split(".").pop(),
    };
}

/**
 * Gets the current file information from import.meta.
 * @param {Object} meta - The import.meta object
 * @returns {{name: string, path: string, dir: string, ext: string}} Parsed file information
 * @example
 * const file = currentFile(import.meta);
 */
export function currentFile(meta) {
    const _url = meta.url;
    return parseFilePath(_url);
}

root.currentFile = currentFile;

/**
 * Juice class provides the core framework functionality.
 * Handles event management, storage, queues, and dynamic module loading.
 * @class Juice
 */
class Juice {
    /**
     * Creates a blended class from multiple mixin classes.
     * The resulting class will have properties and methods from all mixins.
     * @param {...Function} mixins - Mixin classes to blend together
     * @returns {Function} A new class that combines all mixins
     * @static
     * @example
     * const Blended = Juice.blend(MixinA, MixinB);
     * const instance = new Blended();
     */
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

    /**
     * Creates a new Juice instance.
     * Initializes storage, queues, and event registry.
     */
    constructor() {
        this.root = root;
        this.resolve = import.meta.resolve;
        this.currentFile = currentFile;
        this.queues = new JuiceQueues();
        this.storage = new JuiceStorage();
        this.eventRegistry = {};
    }

    /**
     * Instance method to blend multiple mixin classes.
     * @param {...Function} mixins - Mixin classes to blend
     * @returns {Function} A new blended class
     */
    blend(...mixins) {
        return Juice.blend(...mixins);
    }

    /**
     * Registers an event handler for a named event.
     * @param {string} name - The event name
     * @param {Function} fn - The handler function
     * @param {Array} [args=[]] - Optional arguments for the handler
     * @returns {string} A string that can be used to dispatch the event
     * @example
     * juice.registerEvent('click', handleClick);
     */
    registerEvent(name, fn, args = []) {
        if (!this.eventRegistry[name]) {
            this.eventRegistry[name] = [];
        }
        this.eventRegistry[name].push(fn);
        return `juice.dispatchEvent(this,'${name}')`;
    }

    /**
     * Dispatches an event to all registered handlers.
     * @param {Object} target - The target object for the event
     * @param {string} eventName - The name of the event to dispatch
     * @param {...*} args - Additional arguments to pass to handlers
     * @example
     * juice.dispatchEvent(element, 'customEvent', data);
     */
    dispatchEvent(target, eventName, ...args) {
        const eventRegistry = this.eventRegistry;
        const eventHandlers = eventRegistry[eventName];

        if (!eventHandlers) return;

        eventHandlers.forEach((handler) => handler(target, ...args));
    }

    /**
     * Exposes the juice instance globally (window.juice or global.juice).
     */
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

/**
 * Global Juice instance.
 * @type {Juice}
 */
export const juice = new Juice();
juice.expose();

import _config from "./Configuration.mjs";
/**
 * Global configuration object.
 * @type {DotNotation}
 */
export const config = _config;
juice.config = config;

config.set("paths.root", currentFile(import.meta));

/**
 * Gets a configured path by scope.
 * @param {string} scope - The path scope (e.g., 'root')
 * @param {string} relative - Relative path (not currently used)
 * @returns {string} The configured path
 */
juice.path = function (scope, relative) {
    return config.get(`paths.${scope}`);
};

/**
 * Internal call stack for tracking function calls.
 * @type {Array<Function>}
 * @private
 */
const callstack = [];

/**
 * Wraps a function to track its calls in the call stack.
 * @param {Function} fn - The function to track
 * @returns {Function} A wrapped version of the function that tracks calls
 * @example
 * const tracked = juice.track(myFunction);
 */
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

/**
 * Gets the calling function from the call stack.
 * @returns {Function|null} The calling function, or null if not available
 */
juice.caller = function () {
    if (callStack.length < 2) {
        return null;
    }
    return callStack[callStack.length - 1];
};

export default juice;
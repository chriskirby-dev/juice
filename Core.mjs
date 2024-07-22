//Juice Core

import "./Dev/Log.mjs";
import { copyProperties } from "./Util/Class.mjs";
export const root = window || global;

function parseFilePath(path) {
    return {
        name: path.split("/").pop(),
        path,
        dir: path.substr(0, path.lastIndexOf("/")),
    };
}

export function currentFile(meta) {
    const _url = meta.url;
    return parseFilePath(_url);
}

export const juice = {
    resolve: import.meta.resolve,
    root: root,
    currentFile,
};

root.juice = juice;

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

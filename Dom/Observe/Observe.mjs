/**
 * DOM observation utilities aggregator.
 * Provides convenient access to ResizeObserver, MutationObserver, and other observers.
 * @module Dom/Observe/Observe
 */

import ResizeObserver from "./Resize.mjs";
import PositionObserver from "./Position.mjs";
import Mutation from "./Mutation.mjs";
import ChildObserver from "./Children.mjs";
import Util from "../../Util/Core.mjs";
import ObserveTarget from "./Target.mjs";

/**
 * Centralized observer utilities for DOM monitoring.
 * @class Observe
 */
class Observe {
    static resize(el, callback) {
        const resize = new ResizeObserver(el);
        if (callback) return resize.change(callback);
        return resize;
    }

    static children(el) {
        return new ChildObserver(el);
    }

    static position(target, callback, options = {}) {
        if (!options.steps) options.steps = 20;
        const observer = PositionObserver.observe(target, options);

        return observer;
    }

    static target(target, options = {}) {
        return new ObserveTarget(target, options);
    }

    static mostVisible(wrapper = document, options = {}) {
        let mostVisible;
        const mostVisibleObserver = Observe.position(wrapper, options);
        mostVisibleObserver.on("update", (entries) => {
            const keyNames = Object.keys(mostVisibleObserver.items);
            const values = Util.Object.arrPluck(mostVisibleObserver.itemValues, "intersectionRect.height");
            let i = values.indexOf(Math.max(...values));
            if (keyNames[i] !== mostVisible) {
                mostVisible = keyNames[i];
                mostVisibleObserver.emit("most-visible", keyNames[i]);
            }
        });
        return mostVisibleObserver;
    }
}

export default Observe;
import Emitter from "../../Event/Emitter.mjs";
import ObserveTools from "./Tools.mjs";
import Timeline from "../../Animation/Timeline.mjs";
import DomUtil from "../../Util/Dom.mjs";

class PositionObserverTarget {
    element;
    rect;
    size;
    position;
    i = 0;
    options = {};

    constructor(element, callback, options = {}) {
        this.element = element;
        this.options = options;
        if (callback) {
            this.change(callback);
        }
    }

    /**
     * Provide a callback function to notify client of changes
     * @param {function} callback
     */

    change(callback) {
        this.callback = callback;
        this.initialize();
        return this;
    }

    removed(callback) {
        this.dcallback = callback;
        return this;
    }

    update(targetRect) {
        const isVisible = DomUtil.rectIsVisible(targetRect);
        const hasMargin = this.observer.rootMargin !== "0px 0px 0px 0px";

        if (this.options.includeMargin) {
            const rootDims = {};
            if (this.observer.root) {
                const rootRect = observer.root.getBoundingClientRect();
                rootDims.width = rootRect.width;
                rootDims.height = rootRect.height;
            } else {
                rootDims.width = window.innerWidth;
                rootDims.height = window.innerHeight;
            }
            targetRect.margin = {
                top: targetRect.top,
                bottom: rootDims.height - targetRect.bottom,
                left: targetRect.left,
                right: rootDims.width - targetRect.right,
            };
        }

        if (this.callback) this.callback(targetRect);
    }

    oninterception([entry], observer) {
        const targetRect = entry.boundingClientRect.toJSON();
        this.isVisible = DomUtil.rectIsFullyVisible(targetRect);

        if (this.isVisible) {
            clearTimeout(this.changeTO);

            this.changing = true;

            this.changeTO = setTimeout(() => {
                this.changing = false;
                this.timeline.pause();
                this.resetObserver();
            }, 250);

            if (this.timeline.paused) this.timeline.play();
        }

        const hasMargin = observer.rootMargin !== "0px 0px 0px 0px";

        this.update(targetRect);

        if (
            this.isReset &&
            ((this.isVisible && (!entry.isIntersecting || !hasMargin)) || (!this.isVisible && hasMargin))
        ) {
            return this.resetObserver(targetRect);
        }

        this.isReset = true;
    }

    /**
     * @method resetObserver
     * @param {string} margin
     * Disconnect and reconnect the observer with the new margin
     */

    resetObserver(targetRect) {
        this.isReset = false;
        targetRect = targetRect || this.element.$.rect();
        this.isVisible = DomUtil.rectIsFullyVisible(targetRect);

        if (this.isVisible) {
            const margin = ObserveTools.rootMarginFromRect(
                { width: window.innerWidth, height: window.innerHeight },
                targetRect
            );
            if (margin == this.margin) return;
            this.margin = margin;
        } else {
            delete this.margin;
        }

        const thresholds = this.observer.thresholds;

        this.observer.disconnect();

        this.observer = null;

        this.observer = new IntersectionObserver(this.oninterception, {
            root: this.options.root || null,
            threshold: thresholds,
            rootMargin: this.margin ? this.margin : "0px 0px 0px 0px",
        });

        this.observer.observe(this.element);
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.dcallback) this.dcallback();
    }

    initialize() {
        this.oninterception = this.oninterception.bind(this);

        const viewRect = this.element.$.rect();
        const rect = this.element.$.rect();

        this.timeline = new Timeline(this, { defer: true });
        this.timeline.pause();
        this.timeline.update = function () {
            return this.update(this.element.$.rect());
        };

        this.isVisible = DomUtil.rectIsVisible(rect);
        this.margin = null;

        this.observer = new IntersectionObserver(this.oninterception, {
            root: this.options.root || null,
            rootMargin: ObserveTools.rootMarginFromRect({ width: window.innerWidth, height: window.innerHeight }, rect),
            threshold: [0, 1],
        });

        this.observer.observe(this.element);
    }
}

class PositionObserver extends Emitter {
    static observe(target, options = {}) {
        const observerTarget = new PositionObserverTarget(target, options);
        return observerTarget;
    }
}

export default PositionObserver;

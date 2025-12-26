/**
 * Tween class for animating values with easing functions.
 * Provides requestAnimationFrame-based animation with callbacks for updates and completion.
 * @module Animation/Tween
 */

import Easing from "./Easinig.mjs";

import EventEmitter from "../Event/Emitter.mjs";

import { diff, change } from "../Util/Object.mjs";

/**
 * Animates a single value from start to end over duration with easing.
 * @class Tween
 * @param {number} startValue - Initial value
 * @param {number} endValue - Target value
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} [easingFunction=Easing.linear] - Easing function
 * @param {number} [easeDuration] - Optional separate easing duration
 * @example
 * const tween = new Tween(0, 100, 2000, Easing.easeInOutQuad);
 * tween.update((value, progress) => {
 *   element.style.opacity = value / 100;
 * }).complete(() => {
 *   console.log('Animation done');
 * }).start();
 */
export default class Tween {
    /** @type {Object} Callback functions */
    callbacks = {};
    
    constructor(startValue, endValue, duration, easingFunction = Easing.linear, easeDuration) {
        super();
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.easeDuration = easeDuration || duration;
        this.easingFunction = easingFunction;
        this.startTime = null;
        this.animationFrameId = null;
        this.onUpdate = null; // Callback function to apply the updated value
        this.onComplete = null; // Callback function when tweening is complete
    }

    /**
     * Starts the tween animation.
     */
    start() {
        this.startTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this._update.bind(this));
    }

    /**
     * Registers update callback.
     * @param {Function} fn - Callback receiving (value, progress)
     * @returns {Tween} This instance for chaining
     */
    update(fn) {
        this.callbacks.update = fn;
        return this;
    }

    /**
     * Registers completion callback.
     * @param {Function} fn - Callback when animation completes
     * @returns {Tween} This instance for chaining
     */
    complete(fn) {
        this.callbacks.complete = fn;
        return this;
    }

    /**
     * Internal update method called on each frame.
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     * @private
     */
    _update(currentTime) {
        const elapsedTime = currentTime - this.startTime;
        const progress = Math.min(elapsedTime / this.duration, 1);
        const easedProgress = this.easingFunction(progress);
        const currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;

        if (this.callbacks.update) this.callbacks.update(currentValue, progress);

        if (progress < 1) {
            this.animationFrameId = requestAnimationFrame(this._update.bind(this));
        } else {
            if (this.callbacks.complete) this.callbacks.complete();
            this.stop();
        }
    }

    /**
     * Stops the tween animation.
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

/**
 * Tweens multiple object properties simultaneously.
 * @class TweenObject
 * @extends EventEmitter
 * @param {Object} startValue - Object with initial property values
 * @param {Object} endValue - Object with target property values
 * @param {number} duration - Animation duration
 * @param {Function} [easingFunction=Easing.linear] - Easing function
 */
class TweenObject extends EventEmitter {
    constructor(startValue, endValue, duration, easingFunction = Easing.linear) {
        super();
        this.tweens = [];
        const diff = change(startValue, endValue);
        for (const key in diff) {
            this.tweens.push(new Tween(diff[key][0], diff[key][1], duration, easingFunction));
        }
    }

    start() {
        this.tweens.forEach((tween) => tween.start());
    }
}
/*
// Usage example
const tween = new Tween(0, 100, 2000, Easing.easeInOutQuad);
tween.update((value, progress) => {
    console.log(`Value: ${value}, Progress: ${progress}`);
});

tween.complete(() => {
    console.log("Tween complete");
});
tween.start();
*/
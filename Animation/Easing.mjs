/**
 * Easing functions for smooth animations.
 * Provides common easing equations including linear, quad, cubic, quart, quint, and sine easings.
 * @module Animation/Easing
 */

import { lerp } from "../Util/Geometry.mjs";

/**
 * Linear easing (no acceleration).
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const linear = (t) => t;

/**
 * Quadratic ease-in (accelerating from zero velocity).
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInQuad = (t) => t * t;

/**
 * Quadratic ease-out (decelerating to zero velocity).
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeOutQuad = (t) => t * (2 - t);

/**
 * Quadratic ease-in-out (acceleration until halfway, then deceleration).
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

/**
 * Cubic ease-in.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInCubic = (t) => t * t * t;

/**
 * Cubic ease-out.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeOutCubic = (t) => --t * t * t + 1;

/**
 * Cubic ease-in-out.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);

/**
 * Quartic ease-in.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInQuart = (t) => t * t * t * t;

/**
 * Quartic ease-out.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeOutQuart = (t) => --t * t * t * t + 1;

/**
 * Quartic ease-in-out.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInOutQuart = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t);

/**
 * Quintic ease-in.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInQuint = (t) => t * t * t * t * t;

/**
 * Quintic ease-out.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeOutQuint = (t) => --t * t * t * t * t + 1;

/**
 * Quintic ease-in-out.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInOutQuint = (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - 16 * --t * t * t * t * t);

/**
 * Sinusoidal ease-in.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInSine = (t) => 1 - Math.cos((t * Math.PI) / 2);

/**
 * Sinusoidal ease-out.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeOutSine = (t) => Math.sin((t * Math.PI) / 2);

/**
 * Sinusoidal ease-in-out.
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased value
 */
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Collection of all easing functions.
 * @type {Object<string, Function>}
 */
const Easing = {
    linear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuart,
    easeOutQuart,
    easeInOutQuart,
    easeInQuint,
    easeOutQuint,
    easeInOutQuint,
    easeInSine,
    easeOutSine,
    easeInOutSine,
};

/**
 * Time-based easing wrapper that tracks animation progress.
 * @class Ease
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Animation duration
 * @param {string|Function} [easeType='linear'] - Easing function name or function
 * @example
 * const ease = new Ease(0, 100, 1000, 'easeInOutQuad');
 * ease.update(16); // Update with delta time
 * console.log(ease.value); // Get eased value
 */
export class Ease {
    /** @type {number} Current time */
    time = 0;

    constructor(start, end, duration, easeType = "linear") {
        this.easeFn = typeof easeType == "function" ? easeType : Easing[easeType];
        this.duration = duration;
    }

    /**
     * Gets eased value at specific time.
     * @param {number} time - Time value
     * @returns {number} Eased value
     */
    at(time) {
        this.time = time;
        this.progress = this.time / this.duration;
        this.value = this.easeFn(this.progress);
        return this.value;
    }

    /**
     * Updates time and returns eased value.
     * @param {number} delta - Time delta to add
     * @returns {number} Eased value
     */
    update(delta) {
        this.time += delta;
        return this.at(this.time);
    }
}

export default Easing;
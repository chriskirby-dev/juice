/**
 * AnimationTime tracks elapsed time, frame count, and FPS for animations.
 * Supports different time units and maximum duration limits.
 * @module Animation/Time
 */

import AniUtil from "./Util.mjs";

/**
 * Time unit conversion factors.
 * @type {Object<string, number>}
 * @private
 */
const TIME_UNITS = {
    ms: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
};

/**
 * Manages animation timing with frame counting, delta tracking, and FPS calculation.
 * @class AnimationTime
 * @param {Object} [options={}] - Configuration options
 * @param {string} [options.units='ms'] - Time units ('ms', 'seconds', 'minutes', 'hours')
 * @param {number} [options.max] - Maximum duration in specified units
 * @example
 * const time = new AnimationTime({ units: 'seconds', max: 10 });
 * function tick(timestamp) {
 *   time.update(timestamp);
 *   console.log(time.seconds, time.fps);
 * }
 */
class AnimationTime {
    /** @type {number|null} Start timestamp */
    start = null;
    /** @type {number} Last frame timestamp */
    last = 0;
    /** @type {number} Current elapsed time in milliseconds */
    ms = 0;
    /** @type {number} Delta time in seconds */
    delta = 0;
    /** @type {number} Frame counter */
    frame = 0;
    /** @type {number} Maximum duration */
    max;
    /** @type {Object} Configuration options */
    options = {};
    /** @type {boolean} Whether animation is stopped */
    stopped = false;
    /** @type {string} Time units */
    units = "ms";

    constructor(options = {}) {
        this.options = options;
        if (options.units) this.units = options.units;
        if (options.max) this.max = options.max;
    }

    /**
     * Sets maximum duration in configured units.
     * @type {number}
     */
    set max(time) {
        this.options.max = time * TIME_UNITS[this.units];
    }

    /**
     * Gets maximum duration in configured units.
     * @type {number}
     */
    get max() {
        return this.options.max / TIME_UNITS[this.units];
    }

    /**
     * Resets all time tracking values.
     */
    reset() {
        this.start = null;
        this.last = 0;
        this.ms = 0;
        this.delta = 0;
        this.frame = 0;
    }

    /**
     * Updates time with new timestamp from requestAnimationFrame.
     * @param {number} _ms - Current timestamp
     * @returns {boolean} True if updated, false if stopped
     */
    update(_ms) {
        if (this.stopped) return false;
        if (!this.start) this.start = _ms;

        this.last = this.ms;
        this.ms = _ms - this.start;

        if (this.options.max && this.options.max < this.ms) {
            this.ms = this.options.max;
            this.stopped = true;
        }

        this.frame++;
        this.deltaMS = AniUtil.deltaMS(this.last, this.ms);
        this.delta = AniUtil.delta(this.last, this.ms);
        this.fps = AniUtil.FPS(this.delta);

        return true;
    }

    /**
     * Gets elapsed time in seconds.
     * @type {number}
     */
    get seconds() {
        return this.ms / 1000;
    }

    /**
     * Adds time to current position.
     * @param {number} value - Time value to add
     * @param {number} unitSample - Unit multiplier
     */
    add(value, unitSample) {
        const ms = value * unitSample;
        this.update(this.ms + ms);
    }

    /**
     * Converts milliseconds to seconds.
     * @param {number} ms - Milliseconds to convert
     * @returns {number} Time in seconds
     * @static
     */
    static toSeconds(ms) {
        return (ms || this.ms) / 1000;
    }
}

export default AnimationTime;
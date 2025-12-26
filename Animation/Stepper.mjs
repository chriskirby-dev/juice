/**
 * AnimationStepper manages stepped animations with keyframe-based property interpolation.
 * Supports parsing percentage-based steps with unit values and smooth transitions between steps.
 * @module Animation/Stepper
 */

import { type } from "../Util/Core.mjs";
import { lerp } from "../Util/Geometry.mjs";
import UnitValue from "../Value/Unit.mjs";

/**
 * Manages stepped animations with interpolation between keyframes.
 * @class AnimationStepper
 * @param {Object} steps - Keyframe steps with percentage keys and property values
 * @param {number} duration - Total animation duration
 * @example
 * const stepper = new AnimationStepper({
 *   '0%': { opacity: '0', scale: '1' },
 *   '50%': { opacity: '1', scale: '1.5' },
 *   '100%': { opacity: '0', scale: '1' }
 * }, 2000);
 */
class AnimationStepper {
    /** @type {Array<number>} Step percentage positions */
    steps = [];
    /** @type {Object} Parsed properties at each step */
    properties = {};
    /** @type {number} Current step index */
    index = 0;

    constructor(steps, duration) {
        this.duration = duration;
        this.parse(steps);
    }

    /**
     * Finds the step index for a given percentage.
     * @param {number} percent - Progress percentage (0-100)
     * @returns {number|null} Step index or null if not found
     */
    findStep(percent) {
        for (let i = 0; i < this.steps.length; i++) {
            if (percent <= this.steps[i]) {
                return i;
            }
        }
        return null;
    }

    get stepEnd() {
        return this.steps[this.index + 1] || this.duration;
    }

    get stepStart() {
        return this.steps[this.index];
    }

    get stepSpan() {
        return this.stepEnd - this.stepStart;
    }

    get stepProgress() {
        return (this.time - this.stepStart) / this.stepSpan;
    }

    getProperties() {
        return this.current;
    }

    getPropertiesAt(time) {
        const tmpTime = this.time;
        this.time = time;
        this.update(0);
        const stepped = this.current;
        this.time = tmpTime;
        return stepped;
    }

    parse(steps) {
        this.raw = steps;

        const regexNumeric = /^(-?\d*\.?\d+)([a-z%]*)$/i;

        for (let position of steps) {
            const percent = parseFloat(position.replace("%", ""));
            this.steps.push(percent);
            const parsed = {};
            for (const [key, v] of Object.entries(steps[position])) {
                if ((match = value.match(regexNumeric))) {
                    const value = new UnitValue(v);
                    parsed[key] = {
                        type: "numeric",
                        value: value.value,
                        unit: value.unit,
                    };
                } else {
                    parsed[key] = value;
                }
            }
            this.properties.push(parsed);
        }
    }

    update(delta) {
        this.time += delta;
        const progress = this.time / this.duration;
        const percent = progress * 100;
        if (percent > this.stepEnd || percent < this.stepStart) {
            this.index = this.findStep(percent);
        }
        const complete = this.stepProgress;
        const start = this.properties[this.index];
        const end = this.properties[this.index + 1];
        const stepped = {};
        for (let property in start) {
            if (end[property]) {
                stepped[property] = lerp(start[property].value, end[property].value, progress);
                if (start[property].unit) stepped[property] += start[property].unit;
            }
        }
        this.current = stepped;
        return stepped;
    }
}

export default AnimationStepper;
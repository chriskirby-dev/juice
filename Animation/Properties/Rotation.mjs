/**
 * Rotation classes for handling angular values with wrapping and clamping.
 * Supports 1D, 2D, and 3D rotations with degree/radian conversion and dirty tracking.
 * @module Animation/Properties/Rotation
 */

import AnimationValue from "./Value.mjs";
import { clamp } from "../../Util/Math.mjs";

/**
 * Represents a single-axis rotation with automatic wrapping and clamping.
 * @class Rotation
 * @extends AnimationValue
 * @param {number} value - Initial rotation value in degrees
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.offset] - Rotation offset
 * @example
 * const rotation = new Rotation(45);
 * rotation.value = 400; // Wraps to 40 degrees
 * console.log(rotation.toRadians());
 */
export class Rotation extends AnimationValue {
    // Class-level constants for shared access
    static RAD_TO_DEG = 180 / Math.PI;
    static DEG_TO_RAD = Math.PI / 180;

    OFFSET = 0;
    MIN = 0;
    MAX = 360;
    SPAN = 360;
    LOOP = true;
    STEP = 0.001;

    constructor(value, options = {}) {
        super(value || 0, options);
        this.OFFSET = options.offset || this.OFFSET;
    }

    /**
     * Sets rotation value with wrapping or clamping based on LOOP setting.
     * @type {number}
     */
    set value(v) {
        if (this.locked) return;
        if (this.LOOP) {
            // Normalize to [MIN, MAX) range
            if (v < this.MIN || v >= this.MAX) {
                v = this.MIN + ((((v - this.MIN) % this.SPAN) + this.SPAN) % this.SPAN);
            }
        } else {
            v = clamp(v, this.MIN, this.MAX);
        }
        // Apply step quantization only if STEP !== 0
        this._value = this.STEP !== 0 ? Math.round(v / this.STEP) * this.STEP : v;
    }

    /**
     * Gets rotation value.
     * @type {number}
     */
    get value() {
        return super.value;
    }

    /**
     * Adds degrees to rotation.
     * @param {number} deg - Degrees to add
     */
    add(deg) {
        this._value += deg;
    }

    /**
     * Subtracts degrees from rotation.
     * @param {number} deg - Degrees to subtract
     */
    subtract(deg) {
        this._value -= deg;
    }

    /**
     * Checks if rotation equals given value (accounting for wrapping).
     * @param {number} v - Value to compare
     * @returns {boolean} True if equal
     */
    equals(v) {
        // Normalize both values to same range
        const normalized = this.MIN + ((((v - this.MIN) % this.SPAN) + this.SPAN) % this.SPAN);
        return Math.abs(this._value - normalized) < 0.001;
    }

    /**
     * Returns inverted rotation (180 degrees opposite).
     * @returns {Rotation} New inverted Rotation instance
     */
    inverted() {
        return new Rotation((this._value + 180) % 360);
    }

    /**
     * Converts rotation to degrees (if stored as radians).
     * @returns {number} Rotation in degrees
     */
    toDegrees() {
        return this._value * Rotation.RAD_TO_DEG;
    }

    /**
     * Converts rotation to radians.
     * @returns {number} Rotation in radians
     */
    toRadians() {
        return this._value * Rotation.DEG_TO_RAD;
    }

    /**
     * Returns rotation as fixed decimal string.
     * @param {number} i - Number of decimal places
     * @returns {string} Fixed decimal representation
     */
    toFixed(i) {
        return this._value.toFixed(i);
    }

    /**
     * Returns primitive value.
     * @returns {number} Current rotation value
     */
    valueOf() {
        return this._value;
    }
}

/**
 * Represents 2D rotation with separate x and y axes.
 * @class Rotation2D
 * @param {number} [x=0] - X-axis rotation
 * @param {number} [y=0] - Y-axis rotation
 */
export class Rotation2D {
    constructor(x = 0, y = 0) {
        this.x = new Rotation(x);
        this.y = new Rotation(y);
    }
}

/**
 * Represents 3D rotation with dirty tracking for each axis.
 * Uses Float32Array for efficient storage.
 * @class Rotation3D
 * @extends Float32Array
 * @param {number} [x=0] - X-axis rotation
 * @param {number} [y=0] - Y-axis rotation
 * @param {number} [z=0] - Z-axis rotation
 * @param {Object} [options={}] - Configuration options
 * @example
 * const rot = new Rotation3D(45, 90, 180);
 * rot.x = 50;
 * if (rot.dirty('x')) console.log('X axis changed');
 */
export class Rotation3D extends Float32Array {
    /** @type {Array<string>} Dirty tracking array */
    dirt = [];

    constructor(x = 0, y = 0, z = 0, options = {}) {
        super(3);
        this.OFFSET = { x: 0, y: 0, z: 0 };
        this.MIN = { x: 0, y: 0, z: 0 };
        this.MAX = { x: 360, y: 360, z: 360 };
        this.LOOP = { x: true, y: true, z: true };
        this[0] = x || 0;
        this[1] = y || 0;
        this[2] = z || 0;
    }

    /**
     * Gets X-axis rotation.
     * @type {number}
     */
    get x() {
        return this[0];
    }

    /**
     * Gets Y-axis rotation.
     * @type {number}
     */
    get y() {
        return this[1];
    }

    /**
     * Gets Z-axis rotation.
     * @type {number}
     */
    get z() {
        return this[2];
    }

    /**
     * Sets X-axis rotation with wrapping/clamping.
     * @type {number}
     */
    set x(x) {
        this.setAxisValue("x", x);
    }

    /**
     * Sets Y-axis rotation with wrapping/clamping.
     * @type {number}
     */
    set y(y) {
        this.setAxisValue("y", y);
    }

    /**
     * Sets Z-axis rotation with wrapping/clamping.
     * @type {number}
     */
    set z(z) {
        this.setAxisValue("z", z);
    }

    /**
     * Sets rotation value for a specific axis with wrapping or clamping.
     * @param {string} axis - Axis name ('x', 'y', 'z')
     * @param {number} value - Rotation value
     * @private
     */
    setAxisValue(axis, value) {
        // Map axis to index without array allocation
        const index = axis === "x" ? 0 : axis === "y" ? 1 : 2;

        // Early exit if value unchanged
        if (value === this[index]) return;

        const min = this.MIN[axis];
        const max = this.MAX[axis];
        const span = max - min;

        if (this.LOOP[axis]) {
            // Normalize to [min, max) range with proper wrapping
            if (value < min || value >= max) {
                value = min + ((((value - min) % span) + span) % span);
            }
        } else {
            value = clamp(value, min, max);
        }

        // Final check after normalization
        if (this[index] === value) return;

        this[index] = value;
        this.dirt.push(axis);
    }

    /**
     * Resets all axes to 0.
     */
    reset() {
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
    }

    /**
     * Checks if specific axes are dirty or if any axis is dirty.
     * @param {...string} props - Axis names to check ('x', 'y', 'z')
     * @returns {boolean} True if specified axes (or any axis) are dirty
     */
    get dirty() {
        return this.dirt.length > 0;
    }

    isDirty(axis) {
        return this.dirt.includes(axis);
    }

    /**
     * Clears dirty tracking for specific axes or all axes.
     * @param {...string} props - Axis names to clean. If none specified, cleans all.
     */
    clean(...props) {
        if (props.length) {
            const extermItems = new Set(props);
            this.dirt = this.dirt.filter((item) => !extermItems.has(item));
        } else {
            this.dirt = [];
        }
    }

    /**
     * Gets a Rotation object for a specific axis.
     * @param {string} axis - Axis name ('x', 'y', 'z')
     * @returns {Rotation} Rotation instance for the axis
     */
    getAxis(axis) {
        return new Rotation(this[axis]);
    }

    /**
     * Converts rotation to array [x, y, z].
     * @returns {number[]} Array of rotation values
     */
    toArray() {
        return [this[0], this[1], this[2]];
    }

    /**
     * Converts rotation to object {x, y, z}.
     * @returns {Object} Object with x, y, z properties
     */
    toObject() {
        return { x: this[0], y: this[1], z: this[2] };
    }
}

export default Rotation;

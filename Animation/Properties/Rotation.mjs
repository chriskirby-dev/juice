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
            if (v >= this.MAX) {
                v = this.MIN + (v % this.SPAN);
            } else if (v <= this.MIN) {
                v = this.MAX - Math.abs(v % this.SPAN);
            }
        } else {
            v = clamp(this.MIN, this.MAX, v);
        }
        this._value = (v / this.STEP) * this.STEP;
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
        return this._value === v % this.SPAN;
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
        return (this._value * 180) / Math.PI;
    }

    /**
     * Converts rotation to radians.
     * @returns {number} Rotation in radians
     */
    toRadians() {
        return (this._value * Math.PI) / 180;
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
        const axies = ["x", "y", "z"];
        const index = axies.indexOf(axis);
        if (index === -1 || value === this[axis]) return;
        if (this.LOOP[axis]) {
            if (value >= this.MAX[axis]) {
                value = this.MIN[axis] + (value % this.MAX[axis]);
            } else if (value <= this.MIN[axis]) {
                value = this.MAX[axis] - Math.abs(value % this.MAX[axis]);
            }
        } else {
            value = clamp(this.MIN[axis], this.MAX[axis], value);
        }
        if (this[index] == value) return;
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
    dirty(...props) {
        if (props.length) {
            return props.some((prop) => this.dirt.includes(prop));
        } else {
            return this.dirt.length > 0;
        }
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

    toArray() {
        return [this[0], this[1], this[2]];
    }
}

export default Rotation;
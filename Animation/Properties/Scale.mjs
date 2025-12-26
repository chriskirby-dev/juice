/**
 * Scale classes for handling 1D and 2D scaling in animations.
 * Provides animated scale values with efficient Float32Array-based 2D scaling.
 * @module Animation/Properties/Scale
 */

import AnimationValue from "./Value.mjs";

/**
 * Represents a single-dimension scale value that can be animated.
 * @class Scale
 * @extends AnimationValue
 * @param {number} value - Initial scale value
 * @example
 * const scale = new Scale(1.5);
 */
export class Scale extends AnimationValue {
    constructor(value) {
        super(value);
    }
}

/**
 * Represents a 2D scale with separate x and y scale factors.
 * Uses Float32Array for efficient storage and manipulation.
 * @class Scale2D
 * @extends Float32Array
 * @param {number} [x=1] - X axis scale factor
 * @param {number} [y=1] - Y axis scale factor (defaults to x if not provided)
 * @example
 * const scale = new Scale2D(2, 3);
 * scale.x = 1.5;
 */
export class Scale2D extends Float32Array {
    constructor(x = 1, y = 1) {
        this[0] = x;
        this[1] = y || x;
    }

    /**
     * Gets the X axis scale factor.
     * @type {number}
     */
    get x() {
        return this[0];
    }

    /**
     * Sets the X axis scale factor.
     * @type {number}
     */
    set x(x) {
        this[0] = x;
    }

    /**
     * Gets the Y axis scale factor.
     * @type {number}
     */
    get y() {
        return this[1];
    }

    /**
     * Sets the Y axis scale factor.
     * @type {number}
     */
    set y(y) {
        this[1] = y;
    }

    /**
     * Sets both x and y scale factors to the same value.
     * @param {number} v - Scale value to apply to both axes
     */
    set(v) {
        this[0] = v;
        this[1] = v;
    }
}

export default Scale;
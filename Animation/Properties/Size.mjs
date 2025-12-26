/**
 * Size classes for handling dimensional properties in animations with dirty tracking.
 * Provides 1D, 2D, and 3D size representations with change detection.
 * @module Animation/Properties/Size
 */

import AnimationValue from "./Value.mjs";

/**
 * Represents a single-dimension size value that can be animated.
 * @class Size
 * @extends AnimationValue
 * @param {number} value - Initial size value
 * @param {Object} [options={}] - Configuration options
 */
export class Size extends AnimationValue {
    constructor(value, options = {}) {}
}

/**
 * Represents a 2D size with width and height, tracking changes with a dirty flag.
 * Uses Float32Array for efficient storage.
 * @class Size2D
 * @extends Float32Array
 * @param {number} [x=0] - Width dimension
 * @param {number} [y=0] - Height dimension
 * @example
 * const size = new Size2D(100, 50);
 * size.x = 150;
 * if (size.dirty) console.log('Size changed');
 */
export class Size2D extends Float32Array {
    constructor(x = 0, y = 0) {
        super(3);
        this[0] = x;
        this[1] = y;
    }

    /**
     * Gets the width dimension.
     * @type {number}
     */
    get x() {
        return this[0];
    }

    /**
     * Sets the width dimension and marks as dirty if changed.
     * @type {number}
     */
    set x(x) {
        if (x == this[0]) return;
        this[0] = x;
        this.dirty = true;
    }

    /**
     * Gets the height dimension.
     * @type {number}
     */
    get y() {
        return this[1];
    }

    /**
     * Sets the height dimension and marks as dirty if changed.
     * @type {number}
     */
    set y(y) {
        if (y == this[1]) return;
        this[1] = y;
        this.dirty = true;
    }

    /**
     * Sets both width and height dimensions.
     * @param {number} x - Width dimension
     * @param {number} y - Height dimension
     */
    set(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Clears the dirty flag after changes have been processed.
     */
    clean() {
        delete this.dirty;
    }
}

/**
 * Represents a 3D size with width, height, and depth, tracking changes per dimension.
 * @class Size3D
 * @extends Float32Array
 * @param {number} [x=0] - Width dimension
 * @param {number} [y=0] - Height dimension
 * @param {number} [z=0] - Depth dimension
 * @example
 * const size = new Size3D(100, 50, 25);
 * if (size.dirty('x', 'y')) console.log('X or Y changed');
 */
export class Size3D extends Float32Array {
    constructor(x = 0, y = 0, z = 0) {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this.dirt = [];
    }

    /**
     * Gets the width dimension.
     * @type {number}
     */
    get x() {
        return this[0];
    }

    /**
     * Sets the width dimension and tracks the change.
     * @type {number}
     */
    set x(x) {
        if (x == this[0]) return;
        this[0] = x;
        this.dirt.push("x");
    }

    /**
     * Gets the height dimension.
     * @type {number}
     */
    get y() {
        return this[1];
    }

    /**
     * Sets the height dimension and tracks the change.
     * @type {number}
     */
    set y(y) {
        if (y == this[1]) return;
        this[1] = y;
        this.dirt.push("y");
    }

    /**
     * Gets the depth dimension.
     * @type {number}
     */
    get z() {
        return this[2];
    }

    /**
     * Sets the depth dimension and tracks the change.
     * @type {number}
     */
    set z(z) {
        if (z == this[2]) return;
        this[2] = z;
        this.dirt.push("z");
    }

    /**
     * Sets all three dimensions.
     * @param {number} x - Width dimension
     * @param {number} y - Height dimension
     * @param {number} z - Depth dimension
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Clears dirty tracking for specified properties or all properties.
     * @param {...string} props - Property names to clean (x, y, z). If none specified, cleans all.
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
     * Checks if specified properties are dirty or if any property is dirty.
     * @param {...string} props - Property names to check. If none specified, checks if any are dirty.
     * @returns {boolean} True if the specified properties (or any property) are dirty
     */
    dirty(...props) {
        if (props.length) {
            return props.some((prop) => this.dirt.includes(prop));
        } else {
            return this.dirt.length > 0;
        }
    }
}
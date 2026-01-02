/**
 * Optimized vector classes for 2D, 3D, and 4D mathematical vectors.
 * Extends Float32Array for maximum performance with OPTIONAL features:
 * - Dirty tracking: Enable with { trackDirty: true } to track which properties changed
 * - History: Enable with { history: N } to save N previous states for undo/delta
 * - Freeze: Enable with { freezable: true } to allow immutable state locking
 *
 * PERFORMANCE: By default (no options), getters/setters have ZERO overhead beyond Float32Array.
 * Only pay for features you use!
 *
 * @module Animation/Properties/Vector
 * @example
 * // Fast mode - zero overhead
 * const pos = new Vector2D(10, 20);
 * pos.x = 15; // Direct array write
 *
 * // With dirty tracking - track which properties changed
 * const vel = new Vector2D(0, 0, { trackDirty: true });
 * vel.x = 5;
 * if (vel.isDirty("x")) { console.log("x changed!"); }
 *
 * // With history - track previous states for animation
 * const rot = new Vector3D(0, 0, 0, { history: 5 });
 * rot.save();
 * rot.x = 90;
 * console.log(rot.delta()); // Difference from last save
 *
 * // With freeze - lock values
 * const dir = new Vector3D(0, 1, 0, { freezable: true });
 * dir.freeze();
 * dir.x = 5; // Ignored - frozen
 */

import { type } from "../../Util/Core.mjs";
import { lerp, clamp } from "../../Util/Geometry.mjs";
import CircularBuffer from "../../DataTypes/CircularBuffer.mjs";
import DistinctArray from "../../DataTypes/DistinctArray.mjs";

/**
 * Base vector class with flexible dimensions.
 * @class VectoX
 * @extends Float32Array
 * @param {...number} args - Component values
 * @example
 * const vec = new VectoX(1, 2, 3);
 */
export class VectoX extends Float32Array {
    /** @type {Array<string>} Dimension accessor names */
    static dimentions = ["x", "y", "z", "w"];

    /**
     * Parses arguments to create vector instance.
     * @param {...*} args - Values or array to parse
     * @returns {VectoX} New vector instance
     */
    parse(...args) {
        if (args.length === 1) {
            args = args[0];
        }

        if (type(args, "array")) {
            if (args.length === 2) {
                return new this(args[0], args[1]);
            } else if (args.length === 3) {
                return new this(args[0], args[1], args[2]);
            } else if (args.length === 4) {
                return new this(args[0], args[1], args[2], args[3]);
            }
        }

        for (let i = 0; i < args.length; i++) {
            this[i] = args[i];
        }
    }

    constructor(...args) {
        let options = {};
        if (args[args.length - 1] instanceof Object) {
            options = args.pop();
        }
        super(args.length);
        this.history = new CircularBuffer(options.history || 3);

        for (let i = 0; i < args.length; i++) {
            this[i] = args[i];
            this.initProperty(i, args[i]);
        }
    }

    /**
     * Initializes property accessors for vector dimensions.
     * @param {number} i - Component index
     * @param {*} value - Initial value
     * @private
     */
    initProperty(i, value) {
        const accessor = this.constructor.dimentions[i];
        Object.defineProperty(this, accessor, { get: () => this[i], enumerable: true });
    }

    /**
     * Sets the components of this vector.
     * @param {...number} values - The component values
     * @returns {VectoX} This vector for chaining
     */
    set(...values) {
        for (let i = 0; i < values.length && i < this.length; i++) {
            this[i] = values[i];
        }
        return this;
    }

    /**
     * Creates a copy of this vector.
     * @returns {VectoX} A new vector with the same values
     */
    clone() {
        return new this.constructor(...this);
    }

    /**
     * Adds values to this vector's components.
     * @param {...number} values - The values to add
     * @returns {VectoX} This vector for chaining
     */
    add(...values) {
        for (let i = 0; i < values.length && i < this.length; i++) {
            this[i] += values[i];
        }
        return this;
    }

    /**
     * Subtracts values from this vector's components.
     * @param {...number} values - The values to subtract
     * @returns {VectoX} This vector for chaining
     */
    sub(...values) {
        for (let i = 0; i < values.length && i < this.length; i++) {
            this[i] -= values[i];
        }
        return this;
    }

    /**
     * Multiplies this vector's components by scalar or component-wise.
     * @param {number|VectoX} scalar - Scalar value or vector for component-wise multiplication
     * @returns {VectoX} This vector for chaining
     */
    mul(scalar) {
        if (typeof scalar === 'number') {
            for (let i = 0; i < this.length; i++) {
                this[i] *= scalar;
            }
        } else {
            for (let i = 0; i < this.length; i++) {
                this[i] *= scalar[i];
            }
        }
        return this;
    }

    /**
     * Divides this vector's components by scalar or component-wise.
     * @param {number|VectoX} scalar - Scalar value or vector for component-wise division
     * @returns {VectoX} This vector for chaining
     */
    div(scalar) {
        if (typeof scalar === 'number') {
            for (let i = 0; i < this.length; i++) {
                this[i] /= scalar;
            }
        } else {
            for (let i = 0; i < this.length; i++) {
                this[i] /= scalar[i];
            }
        }
        return this;
    }

    /**
     * Calculates the dot product with another vector.
     * @param {VectoX} other - The other vector
     * @returns {number} The dot product
     */
    dot(other) {
        let result = 0;
        for (let i = 0; i < this.length; i++) {
            result += this[i] * other[i];
        }
        return result;
    }

    /**
     * Calculates the cross product with another 3D vector.
     * Only valid for 3D vectors.
     * @param {VectoX} other - The other vector
     * @returns {VectoX} A new vector representing the cross product
     */
    cross(other) {
        if (this.length !== 3 || other.length !== 3) {
            throw new Error('Cross product only defined for 3D vectors');
        }
        return new this.constructor(
            this[1] * other[2] - this[2] * other[1],
            this[2] * other[0] - this[0] * other[2],
            this[0] * other[1] - this[1] * other[0]
        );
    }

    /**
     * Calculates the length (magnitude) of this vector.
     * @returns {number} The vector length
     */
    length() {
        let sumOfSquares = 0;
        for (let i = 0; i < this.length; i++) {
            sumOfSquares += this[i] * this[i];
        }
        return Math.sqrt(sumOfSquares);
    }

    /**
     * Normalizes this vector to unit length.
     * @returns {VectoX} This vector for chaining
     */
    normalize() {
        const len = this.length();
        if (len > 0) {
            for (let i = 0; i < this.length; i++) {
                this[i] /= len;
            }
        }
        return this;
    }

    /**
     * Linear interpolation between this vector and another.
     * @param {VectoX} other - The target vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {VectoX} A new interpolated vector
     */
    lerp(other, t) {
        const result = new this.constructor(this.length);
        for (let i = 0; i < this.length; i++) {
            result[i] = this[i] + (other[i] - this[i]) * t;
        }
        return result;
    }
}

/**
 * Represents a 2D vector with x and y components.
 * @class Vector2D
 * @extends Float32Array
 * @param {number} [x=0] - X component
 * @param {number} [y=0] - Y component
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.trackDirty=false] - Enable dirty property tracking (adds overhead)
 * @param {boolean} [options.freezable=false] - Enable freeze capability (adds overhead)
 * @param {number} [options.history=0] - History buffer size (0 = disabled, default)
 * @example
 * // Fast mode (no overhead)
 * const vec = new Vector2D(10, 20);
 *
 * // With dirty tracking
 * const vec = new Vector2D(10, 20, { trackDirty: true });
 * vec.x = 15;
 * if (vec.isDirty()) { ... }
 *
 * // With history
 * const vec = new Vector2D(10, 20, { history: 3 });
 * vec.save();
 * vec.delta();
 */
export class Vector2D extends Float32Array {
    /**
     * Parses various input formats to create Vector2D.
     * @param {number|Array|Vector2D|Object} arg1 - X value, array, vector, or object with x/y
     * @param {number} [arg2] - Y value (if arg1 is number)
     * @returns {Vector2D} New Vector2D instance
     * @static
     */
    static parse(arg1, arg2) {
        if (type(arg1, "number")) return new this(arg1, arg2);
        if (type(arg1, "array")) return new this(arg1[0], arg1[1]);
        if (arg1 instanceof Vector2D) return arg1;
        return new this(arg1.x, arg1.y);
    }

    constructor(x = 0, y = 0, options = {}) {
        super(2);
        this[0] = x;
        this[1] = y;

        // Store config flags for fast checks
        this._trackDirty = options.trackDirty || true;
        this._freezable = options.freezable || false;
        this._useHistory = (options.history || 0) > 0;

        // Only initialize features that are enabled
        if (this._trackDirty) {
            this.dirtyProperties = new DistinctArray();
        }
        if (this._freezable) {
            this.frozen = false;
        }
        if (this._useHistory) {
            this.history = new CircularBuffer(options.history);
            this.saved = [0, 0];
            this.last = [0, 0];
        }

        this.options = options;
    }

    /**
     * Converts the vector to a plain array.
     * @returns {number[]} Array containing [x, y]
     */
    toArray() {
        return [this[0], this[1]];
    }

    toObject() {
        return { x: this[0], y: this[1] };
    }

    /**
     * Gets the x component of the vector.
     * @returns {number} The x value
     */
    get x() {
        return this[0];
    }

    /**
     * Sets the x component of the vector.
     * Fast path optimization when tracking is disabled.
     * @param {number} x - The new x value
     */
    set x(x) {
        // Fast path - no checks if features disabled
        if (!this._freezable && !this._trackDirty) {
            this[0] = x;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (x === this[0]) return;

        this[0] = x;
        if (this._trackDirty) this.dirtyProperties.push(0, "x");
    }

    /**
     * Gets the y component of the vector.
     * @returns {number} The y value
     */
    get y() {
        return this[1];
    }

    /**
     * Sets the y component of the vector.
     * Fast path optimization when tracking is disabled.
     * @param {number} y - The new y value
     */
    set y(y) {
        // Fast path - no checks if features disabled
        if (!this._freezable && !this._trackDirty) {
            this[1] = y;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (y === this[1]) return;

        this[1] = y;
        if (this._trackDirty) this.dirtyProperties.push(1, "y");
    }

    /**
     * Sets both x and y components.
     * @param {number} x - The new x value
     * @param {number} y - The new y value
     * @returns {Vector2D} This vector for chaining
     */
    set(x, y) {
        if (this._freezable && this.frozen) return this;
        this[0] = x;
        this[1] = y;
        if (this._trackDirty) this.dirtyProperties.push(0, 1, "x", "y");
        return this;
    }

    /**
     * Creates a new vector with the same values and options.
     * @returns {Vector2D} A new Vector2D instance
     */
    clone() {
        return new this.constructor(this[0], this[1], this.options);
    }

    /**
     * Copies values from another vector into this vector.
     * @param {Vector2D|Float32Array} v - The vector to copy from
     * @returns {Vector2D} This vector for chaining
     */
    copy(v) {
        if (this._freezable && this.frozen) return this;
        this[0] = v[0];
        this[1] = v[1];
        if (this._trackDirty) this.dirtyProperties.push(0, 1, "x", "y");
        return this;
    }

    /**
     * Returns a new vector representing the difference between this vector and another.
     * @param {Vector2D|Array|Object} v - The vector to subtract (accepts vector, array, or {x,y} object)
     * @returns {Vector2D} A new vector with the difference
     */
    vdiff(v) {
        v = this.constructor.parse(v);
        return new this.constructor(this[0] - v[0], this[1] - v[1]);
    }

    /**
     * Adds another vector to this vector (modifies this vector).
     * @param {Vector2D|Array|Object} v - The vector to add
     * @returns {Vector2D} This vector for chaining
     */
    vadd(v) {
        if (this._freezable && this.frozen) return this;
        v = this.constructor.parse(v);
        this[0] += v[0];
        this[1] += v[1];
        if (this._trackDirty) this.dirtyProperties.push(0, 1, "x", "y");
        return this;
    }

    /**
     * Subtracts another vector from this vector (modifies this vector).
     * @param {Vector2D|Array|Object} v - The vector to subtract
     * @returns {Vector2D} This vector for chaining
     */
    vsubtract(v) {
        if (this._freezable && this.frozen) return this;
        v = this.constructor.parse(v);
        this[0] -= v[0];
        this[1] -= v[1];
        if (this._trackDirty) this.dirtyProperties.push(0, 1, "x", "y");
        return this;
    }

    /**
     * Returns a new vector linearly interpolated between this vector and another.
     * @param {Vector2D|Array|Object} v - The target vector
     * @param {number} t - The interpolation factor (0-1)
     * @returns {Vector2D} A new interpolated vector
     */
    vlerp(v, t) {
        v = this.constructor.parse(v);
        return new this.constructor(lerp(this[0], v[0], t), lerp(this[1], v[1], t));
    }

    /**
     * Adds x and y values to this vector (modifies this vector).
     * @param {number} x - The x value to add
     * @param {number} y - The y value to add
     * @returns {Vector2D} This vector for chaining
     */
    add(x, y) {
        if (this._freezable && this.frozen) return this;
        this[0] += x;
        this[1] += y;
        if (this._trackDirty) this.dirtyProperties.push(0, 1, "x", "y");
        return this;
    }

    /**
     * Subtracts x and y values from this vector (modifies this vector).
     * @param {number} x - The x value to subtract
     * @param {number} y - The y value to subtract
     * @returns {Vector2D} This vector for chaining
     */
    subtract(x, y) {
        if (this._freezable && this.frozen) return this;
        this[0] -= x;
        this[1] -= y;
        if (this._trackDirty) this.dirtyProperties.push(0, 1, "x", "y");
        return this;
    }

    /**
     * Multiplies this vector by a scalar value (modifies this vector).
     * @param {number} scalar - The scalar value to multiply by
     * @returns {Vector2D} This vector for chaining
     */
    multiply(scalar) {
        if (this._freezable && this.frozen) return this;
        this[0] *= scalar;
        this[1] *= scalar;
        if (this._trackDirty) this.dirtyProperties.push(0, 1, "x", "y");
        return this;
    }

    /**
     * Calculates the dot product of this vector and another.
     * @param {Vector2D|Float32Array} v - The other vector
     * @returns {number} The dot product
     */
    dot(v) {
        return this[0] * v[0] + this[1] * v[1];
    }

    /**
     * Calculates the length (magnitude) of the vector.
     * @returns {number} The length of the vector
     */
    length() {
        return Math.hypot(this[0], this[1]);
    }

    /**
     * Normalizes the vector to unit length (modifies this vector).
     * @returns {Vector2D} This vector for chaining
     */
    normalize() {
        if (this._freezable && this.frozen) return this;
        let len = this.length();
        if (len > 0) {
            this[0] /= len;
            this[1] /= len;
            if (this._trackDirty) this.dirtyProperties.push(0, 1, "x", "y");
        }
        return this;
    }

    /**
     * Returns a new vector representing the difference from this vector.
     * Supports multiple input formats: diff(vector), diff([x,y]), or diff(x, y).
     * @param {number|Vector2D|Array} x - X value, vector, or array
     * @param {number} [y] - Y value (if x is a number)
     * @returns {Vector2D} A new vector with the difference
     */
    diff(x, y) {
        if (x instanceof Vector2D || type(x, "array")) {
            return new this.constructor(this[0] - x[0], this[1] - x[1]);
        } else if (arguments.length === 1 && x !== undefined) {
            const v = this.constructor.parse(x);
            return new this.constructor(this[0] - v[0], this[1] - v[1]);
        } else if (arguments.length === 2) {
            return new this.constructor(this[0] - x, this[1] - y);
        }
        return new this.constructor(0, 0);
    }

    /**
     * Returns a new vector with negated components.
     * @returns {Vector2D} A new inverted vector
     */
    invert() {
        return new Vector2D(-this[0], -this[1]);
    }

    /**
     * Sets the maximum bounds for clamping.
     * @param {number} x - Maximum x value
     * @param {number} y - Maximum y value
     */
    max(x, y) {
        this._max = new Vector2D(x, y);
    }

    /**
     * Sets the minimum bounds for clamping.
     * @param {number} x - Minimum x value
     * @param {number} y - Minimum y value
     */
    min(x, y) {
        this._min = new Vector2D(x, y);
    }

    /**
     * Clamps the vector components between min and max bounds (modifies this vector).
     * Uses bounds set by min() and max() methods.
     * @returns {Vector2D} This vector for chaining
     */
    clamp() {
        if (this._max && this._min) {
            this[0] = clamp(this[0], this._min[0], this._max[0]);
            this[1] = clamp(this[1], this._min[1], this._max[1]);
        } else if (this._max) {
            this[0] = Math.min(this[0], this._max[0]);
            this[1] = Math.min(this[1], this._max[1]);
        } else if (this._min) {
            this[0] = Math.max(this[0], this._min[0]);
            this[1] = Math.max(this[1], this._min[1]);
        }
        return this;
    }

    // === HISTORY METHODS (only available if history > 0) ===

    /**
     * Saves the current state to history buffer.
     * Only available when history option is enabled.
     */
    save() {
        if (!this._useHistory) return;
        this.last = this.saved;
        this.saved = [this[0], this[1]];
        this.history.unshift(this.saved);
        if (this._trackDirty) this.clean();
    }

    /**
     * Gets the difference from a historical state.
     * @param {number} [i=0] - The history index (0 = most recent)
     * @returns {Vector2D} A new vector with the difference
     */
    getChanges(i = 0) {
        if (!this._useHistory) return new Vector2D(0, 0);
        const saved = this.history[i];
        return this.diff(saved);
    }

    /**
     * Gets the difference from the last saved state.
     * @returns {Vector2D} A new vector with the delta
     */
    delta() {
        if (!this._useHistory) return new Vector2D(0, 0);
        return this.diff(this.last);
    }

    /**
     * Gets the difference from the saved checkpoint.
     * @returns {Vector2D} A new vector with the delta
     */
    savedDelta() {
        if (!this._useHistory) return new Vector2D(0, 0);
        return this.diff(this.saved);
    }

    // === DIRTY TRACKING METHODS (only available if trackDirty = true) ===

    /**
     * Checks if the vector has been modified since last clean().
     * Only available when trackDirty option is enabled.
     * @returns {boolean} True if any property has changed
     */
    get dirty() {
        if (!this._trackDirty) return false;
        return this.dirtyProperties.length > 0;
    }

    /**
     * Checks if a specific property has been modified.
     * @param {string} [property] - The property to check ('x' or 'y'). If omitted, checks if any property is dirty.
     * @returns {boolean} True if the property (or any property) has changed
     */
    isDirty(property) {
        if (!this._trackDirty) return false;
        if (!property) return this.dirty;
        return this.dirtyProperties.includes(property);
    }

    /**
     * Resets the dirty flags for all properties.
     */
    clean() {
        if (this._trackDirty) {
            this.dirtyProperties = new DistinctArray();
        }
    }

    // === FREEZE METHODS (only available if freezable = true) ===

    /**
     * Freezes or unfreezes the vector, preventing/allowing modifications.
     * Only available when freezable option is enabled.
     * @param {boolean} [shouldFreeze=true] - True to freeze, false to unfreeze
     */
    freeze(shouldFreeze = true) {
        if (this._freezable) {
            this.frozen = shouldFreeze;
        }
    }

    /**
     * Sets the vector to specific values and then freezes it.
     * @param {number} x - The x value to freeze at
     * @param {number} y - The y value to freeze at
     */
    freezeAt(x, y) {
        if (!this._freezable) return;
        this.freeze(false);
        this.set(x, y);
        this.freeze();
    }
}

/**
 * Represents a 3D vector with x, y, and z components.
 * @class Vector3D
 * @extends Float32Array
 * @param {number} [x=0] - X component
 * @param {number} [y=0] - Y component
 * @param {number} [z=0] - Z component
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.trackDirty=false] - Enable dirty property tracking
 * @param {boolean} [options.freezable=false] - Enable freeze capability
 * @param {number} [options.history=0] - History buffer size (0 = disabled)
 */
export class Vector3D extends Float32Array {
    /**
     * Linear interpolation between two vectors.
     * @static
     * @param {Vector3D|Float32Array} v1 - First vector
     * @param {Vector3D|Float32Array} v2 - Second vector
     * @param {number} amt - Interpolation factor (0-1)
     * @returns {Vector3D} A new interpolated vector
     */
    static lerp(v1, v2, amt) {
        return new Vector3D(lerp(v1[0], v2[0], amt), lerp(v1[1], v2[1], amt), lerp(v1[2], v2[2], amt));
    }

    /**
     * Parses various input formats to create Vector3D.
     * @static
     * @param {number|Array|Vector3D|Object} x - X value, array, vector, or object with x/y/z
     * @param {number} [y] - Y value (if x is number)
     * @param {number} [z] - Z value (if x is number)
     * @returns {Vector3D} New Vector3D instance
     */
    static parse(x, y, z) {
        if (typeof x == "number") return new Vector3D(x, y, z);
        if (x instanceof Vector3D) return x;
        if (Array.isArray(x)) return new Vector3D(x[0], x[1], x[2]);
        if (typeof x === "object" && "x" in x) return new Vector3D(x.x, x.y || 0, x.z || 0);
        if (arguments.length === 0) return new Vector3D(0, 0, 0);
        throw new TypeError(
            "Invalid argument: expected an array of length 3, a Vector3D object, or an object with x, y, and z properties"
        );
    }

    constructor(arg1 = 0, arg2 = 0, arg3 = 0, options = {}) {
        super(3);

        // Handle array input
        if (Array.isArray(arg1)) {
            this[0] = arg1[0] || 0;
            this[1] = arg1[1] || 0;
            this[2] = arg1[2] || 0;
        } else if (typeof arg1 === "object" && !(arg1 instanceof Object)) {
            options = arg3 || {};
            this[0] = arg1.x || 0;
            this[1] = arg1.y || 0;
            this[2] = arg1.z || 0;
        } else {
            this[0] = arg1;
            this[1] = arg2;
            this[2] = arg3;
        }

        // Store config flags for fast checks
        this._trackDirty = options.trackDirty || false;
        this._freezable = options.freezable || false;
        this._useHistory = (options.history || 0) > 0;

        // Only initialize features that are enabled
        if (this._trackDirty) {
            this.dirtyProperties = new DistinctArray();
        }
        if (this._freezable) {
            this.frozen = false;
        }
        if (this._useHistory) {
            this.history = new CircularBuffer(options.history);
            this.saved = [0, 0, 0];
            this.last = [0, 0, 0];
        }

        this.options = options;
    }

    /**
     * Sets all three components of the vector.
     * @param {number|Vector3D|Array|Object} arg1 - X value, vector, array, or object
     * @param {number} [arg2] - Y value (if arg1 is number)
     * @param {number} [arg3] - Z value (if arg1 is number)
     * @returns {Vector3D} This vector for chaining
     */
    set(arg1, arg2, arg3) {
        if (this._freezable && this.frozen) return this;

        if (typeof arg1 == "number") {
            this[0] = arg1;
            this[1] = arg2 || 0;
            this[2] = arg3 || 0;
        } else if (arg1 instanceof Vector3D || Array.isArray(arg1)) {
            this[0] = arg1[0];
            this[1] = arg1[1];
            this[2] = arg1[2];
        } else {
            const coords = Vector3D.parse(arg1, arg2, arg3);
            this[0] = coords[0];
            this[1] = coords[1];
            this[2] = coords[2];
        }
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, "x", "y", "z");
        return this;
    }

    /**
     * Adds values to this vector (modifies this vector).
     * @param {number|Vector3D|Array|Object} x - X value or vector/array/object
     * @param {number} [y] - Y value (if x is number)
     * @param {number} [z] - Z value (if x is number)
     * @returns {Vector3D} This vector for chaining
     */
    add(x, y, z) {
        if (this._freezable && this.frozen) return this;

        if (typeof x == "number") {
            this[0] += x;
            this[1] += y || 0;
            this[2] += z || 0;
        } else {
            const coords = Vector3D.parse(x, y, z);
            this[0] += coords[0];
            this[1] += coords[1];
            this[2] += coords[2];
        }
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, "x", "y", "z");
        return this;
    }

    /**
     * Subtracts values from this vector (modifies this vector).
     * @param {number|Vector3D|Array|Object} x - X value or vector/array/object
     * @param {number} [y] - Y value (if x is number)
     * @param {number} [z] - Z value (if x is number)
     * @returns {Vector3D} This vector for chaining
     */
    subtract(x, y, z) {
        if (this._freezable && this.frozen) return this;

        if (arguments.length == 3) {
            this[0] -= x;
            this[1] -= y;
            this[2] -= z;
        } else {
            const coords = Vector3D.parse(x, y, z);
            this[0] -= coords[0];
            this[1] -= coords[1];
            this[2] -= coords[2];
        }
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, "x", "y", "z");
        return this;
    }

    multiply(scalar) {
        if (this._freezable && this.frozen) return this;
        this[0] *= scalar;
        this[1] *= scalar;
        this[2] *= scalar;
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, "x", "y", "z");
        return this;
    }

    /**
     * Calculates the dot product with another vector.
     * @param {Vector3D|Float32Array} v - The other vector
     * @returns {number} The dot product
     */
    dot(v) {
        return this[0] * v[0] + this[1] * v[1] + this[2] * v[2];
    }

    /**
     * Calculates the cross product with another vector (modifies this vector).
     * @param {Vector3D|Float32Array} v - The other vector
     * @returns {Vector3D} This vector for chaining
     */
    cross(v) {
        if (this._freezable && this.frozen) return this;
        const x = this[0],
            y = this[1],
            z = this[2];
        this[0] = y * v[2] - z * v[1];
        this[1] = z * v[0] - x * v[2];
        this[2] = x * v[1] - y * v[0];
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, "x", "y", "z");
        return this;
    }

    /**
     * Calculates the length (magnitude) of the vector.
     * @returns {number} The length
     */
    length() {
        return Math.hypot(this[0], this[1], this[2]);
    }

    normalize() {
        if (this._freezable && this.frozen) return this;
        let len = this.length();
        if (len > 0) {
            this[0] /= len;
            this[1] /= len;
            this[2] /= len;
            if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, "x", "y", "z");
        }
        return this;
    }

    /**
     * Linearly interpolates this vector towards target values (modifies this vector).
     * @param {number|Vector3D|Array|Object} x - X value or target vector
     * @param {number} [y] - Y value or interpolation amount (if x is vector)
     * @param {number} [z] - Z value
     * @param {number} [amt] - Interpolation factor (0-1)
     * @returns {Vector3D} This vector for chaining
     */
    lerpTo(x, y, z, amt) {
        if (this._freezable && this.frozen) return this;

        if (arguments.length == 4) {
            this[0] = lerp(this[0], x, amt);
            this[1] = lerp(this[1], y, amt);
            this[2] = lerp(this[2], z, amt);
        } else if (arguments.length == 2) {
            amt = y;
            const coords = Vector3D.parse(x);
            this[0] = lerp(this[0], coords[0], amt);
            this[1] = lerp(this[1], coords[1], amt);
            this[2] = lerp(this[2], coords[2], amt);
        }
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, "x", "y", "z");
        return this;
    }

    /**
     * Returns a new vector representing the difference from this vector.
     * @param {number|Vector3D|Array|Object} x - X value or vector
     * @param {number} [y] - Y value (if x is number)
     * @param {number} [z] - Z value (if x is number)
     * @returns {Vector3D} A new difference vector
     */
    diff(x, y, z) {
        if (arguments.length === 1) {
            const coords = Vector3D.parse(x);
            return new Vector3D(this[0] - coords[0], this[1] - coords[1], this[2] - coords[2]);
        } else {
            return new Vector3D(this[0] - x, this[1] - y, this[2] - z);
        }
    }

    /**
     * Gets the x component.
     * @returns {number} The x value
     */
    get x() {
        return this[0];
    }

    /**
     * Gets the y component.
     * @returns {number} The y value
     */
    get y() {
        return this[1];
    }

    /**
     * Gets the z component.
     * @returns {number} The z value
     */
    get z() {
        return this[2];
    }

    /**
     * Sets the x component.
     * @param {number} x - The new x value
     */
    set x(x) {
        // Fast path
        if (!this._freezable && !this._trackDirty) {
            this[0] = x;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (x == this[0]) return;
        this[0] = x;
        if (this._trackDirty) this.dirtyProperties.push(0, "x");
    }

    set y(y) {
        // Fast path
        if (!this._freezable && !this._trackDirty) {
            this[1] = y;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (y == this[1]) return;
        this[1] = y;
        if (this._trackDirty) this.dirtyProperties.push(1, "y");
    }

    set z(z) {
        // Fast path
        if (!this._freezable && !this._trackDirty) {
            this[2] = z;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (z == this[2]) return;
        this[2] = z;
        if (this._trackDirty) this.dirtyProperties.push(2, "z");
    }

    // === HISTORY METHODS ===

    save() {
        if (!this._useHistory) return;
        this.last = this.saved;
        this.saved = [this[0], this[1], this[2]];
        this.history.unshift(this.saved);
        if (this._trackDirty) this.clean();
    }

    getChanges(i = 0) {
        if (!this._useHistory) return new Vector3D(0, 0, 0);
        return this.diff(this.history[i]);
    }

    get delta() {
        if (!this._useHistory) return new Vector3D(0, 0, 0);
        return this.diff(this.last);
    }

    savedDelta() {
        if (!this._useHistory) return new Vector3D(0, 0, 0);
        return this.diff(this.saved);
    }

    // === DIRTY TRACKING METHODS ===

    get dirty() {
        if (!this._trackDirty) return false;
        return this.dirtyProperties.length > 0;
    }

    isDirty(...props) {
        if (!this._trackDirty) return false;
        if (props.length) {
            return props.some((prop) => this.dirtyProperties.includes(prop));
        }
        return this.dirty;
    }

    clean(...props) {
        if (!this._trackDirty) return;
        if (props.length) {
            const extermItems = new Set(props);
            this.dirtyProperties = this.dirtyProperties.filter((item) => !extermItems.has(item));
        } else {
            this.dirtyProperties = new DistinctArray();
        }
    }

    // === FREEZE METHODS ===

    freeze(shouldFreeze = true) {
        if (this._freezable) {
            this.frozen = shouldFreeze;
        }
    }

    /**
     * Freezes the vector at specific values.
     * Sets the x, y, z values then freezes. Only works if freezable option was enabled.
     * @param {number} x - X value
     * @param {number} y - Y value
     * @param {number} z - Z value
     */
    freezeAt(x, y, z) {
        if (!this._freezable) return;
        this.freeze(false);
        this.set(x, y, z);
        this.freeze();
    }

    // === UTILITY METHODS ===

    /**
     * Converts the vector to a plain JavaScript object.
     * @returns {{x: number, y: number, z: number}} Object with x, y, z properties
     */
    toObject() {
        return { x: this[0], y: this[1], z: this[2] };
    }

    /**
     * Converts the vector to an array.
     * @returns {number[]} Array [x, y, z]
     */
    toArray() {
        return [this[0], this[1], this[2]];
    }

    /**
     * Converts the vector to a string representation.
     * @returns {string} String in format "Vector3D(x=1, y=2, z=3)"
     */
    toString() {
        return `Vector3D(x=${this.x}, y=${this.y}, z=${this.z})`;
    }

    /**
     * Checks if the vector has any non-zero values.
     * @returns {boolean} True if any component is non-zero
     */
    hasValue() {
        return this[0] !== 0 || this[1] !== 0 || this[2] !== 0;
    }

    /**
     * Creates a copy of this vector.
     * @returns {Vector3D} A new vector with the same values and options
     */
    copy() {
        return new Vector3D(this[0], this[1], this[2], this.options);
    }

    /**
     * Alias for copy(). Creates a copy of this vector.
     * @returns {Vector3D} A new vector with the same values and options
     */
    clone() {
        return this.copy();
    }

    /**
     * Returns a new vector with all components negated.
     * @returns {Vector3D} A new inverted vector
     */
    invert() {
        return new Vector3D(-this[0], -this[1], -this[2]);
    }

    /**
     * Sets the minimum bounds for clamping.
     * @param {number|Vector3D|Array|Object} x - Min X or vector
     * @param {number} [y] - Min Y
     * @param {number} [z] - Min Z
     */
    min(x, y, z) {
        this._min = Vector3D.parse(x, y, z);
    }

    /**
     * Sets the maximum bounds for clamping.
     * @param {number|Vector3D|Array|Object} x - Max X or vector
     * @param {number} [y] - Max Y
     * @param {number} [z] - Max Z
     */
    max(x, y, z) {
        this._max = Vector3D.parse(x, y, z);
    }

    /**
     * Clamps the vector values between min and max bounds (if set).
     * Call min() and max() first to set bounds.
     */
    clamp() {
        if (this._max && this._min) {
            this[0] = clamp(this[0], this._min[0], this._max[0]);
            this[1] = clamp(this[1], this._min[1], this._max[1]);
            this[2] = clamp(this[2], this._min[2], this._max[2]);
        } else if (this._max) {
            this[0] = Math.min(this[0], this._max[0]);
            this[1] = Math.min(this[1], this._max[1]);
            this[2] = Math.min(this[2], this._max[2]);
        } else if (this._min) {
            this[0] = Math.max(this[0], this._min[0]);
            this[1] = Math.max(this[1], this._min[1]);
            this[2] = Math.max(this[2], this._min[2]);
        }
        return this;
    }
}

/**
 * Represents a 4D vector with x, y, z, and w components.
 * Commonly used for quaternions, homogeneous coordinates, and 4D transformations.
 * Extends Float32Array for optimal performance with optional features.
 *
 * @class Vector4D
 * @extends Float32Array
 * @example
 * // Basic usage
 * const quat = new Vector4D(0, 0, 0, 1); // Identity quaternion
 *
 * // From object
 * const vec = new Vector4D({ x: 1, y: 2, z: 3, w: 4 });
 *
 * // With options
 * const tracked = new Vector4D(0, 0, 0, 1, { trackDirty: true });
 */
export class Vector4D extends Float32Array {
    /**
     * Parses various input formats into a Vector4D.
     * @static
     * @param {number|Vector4D|Array|Object} x - X value, vector, array, or object
     * @param {number} [y] - Y value (if x is number)
     * @param {number} [z] - Z value (if x is number)
     * @param {number} [w] - W value (if x is number)
     * @returns {Vector4D} A new Vector4D instance
     * @throws {TypeError} If input format is invalid
     */
    static parse(x, y, z, w) {
        if (typeof x == "number") return new Vector4D(x, y || 0, z || 0, w || 0);
        if (x instanceof Vector4D) return x;
        if (Array.isArray(x)) return new Vector4D(x[0], x[1], x[2], x[3]);
        if (typeof x === "object" && "x" in x) return new Vector4D(x.x, x.y || 0, x.z || 0, x.w || 0);
        if (arguments.length === 0) return new Vector4D(0, 0, 0, 0);
        throw new TypeError(
            "Invalid argument: expected an array of length 4, a Vector4D object, or an object with x, y, z, and w properties"
        );
    }

    /**
     * Creates a new Vector4D.
     * @param {number|Array|Object} arg1 - X value, array [x,y,z,w], or object {x,y,z,w}
     * @param {number|Object} [arg2=0] - Y value or options (if arg1 is array/object)
     * @param {number} [arg3=0] - Z value
     * @param {number|Object} [arg4=0] - W value or options
     * @param {Object} [options={}] - Configuration options
     * @param {boolean} [options.trackDirty=false] - Enable dirty property tracking
     * @param {number} [options.history=0] - Enable history tracking (size)
     * @param {boolean} [options.freezable=false] - Enable freeze functionality
     */
    constructor(arg1 = 0, arg2 = 0, arg3 = 0, arg4 = 0, options = {}) {
        super(4);

        // Handle array input
        if (Array.isArray(arg1)) {
            this[0] = arg1[0] || 0;
            this[1] = arg1[1] || 0;
            this[2] = arg1[2] || 0;
            this[3] = arg1[3] || 0;
            options = arg2 || {};
        } else if (typeof arg1 === "object" && !(arg1 instanceof Number)) {
            options = arg4 || {};
            this[0] = arg1.x || 0;
            this[1] = arg1.y || 0;
            this[2] = arg1.z || 0;
            this[3] = arg1.w || 0;
        } else {
            this[0] = arg1;
            this[1] = arg2;
            this[2] = arg3;
            this[3] = arg4;
        }

        // Store config flags for fast checks
        this._trackDirty = options.trackDirty || false;
        this._freezable = options.freezable || false;
        this._useHistory = (options.history || 0) > 0;

        // Only initialize features that are enabled
        if (this._trackDirty) {
            this.dirtyProperties = new DistinctArray();
        }
        if (this._freezable) {
            this.frozen = false;
        }
        if (this._useHistory) {
            this.history = new CircularBuffer(options.history);
            this.saved = [0, 0, 0, 0];
            this.last = [0, 0, 0, 0];
        }

        this.options = options;
    }

    /**
     * Sets all components of the vector.
     * @param {number|Vector4D|Array|Object} arg1 - X value, vector, array, or object
     * @param {number} [arg2] - Y value (if arg1 is number)
     * @param {number} [arg3] - Z value (if arg1 is number)
     * @param {number} [arg4] - W value (if arg1 is number)
     * @returns {Vector4D} This vector for chaining
     */
    set(arg1, arg2, arg3, arg4) {
        if (this._freezable && this.frozen) return this;

        if (typeof arg1 == "number") {
            this[0] = arg1;
            this[1] = arg2 || 0;
            this[2] = arg3 || 0;
            this[3] = arg4 || 0;
        } else if (arg1 instanceof Vector4D || Array.isArray(arg1)) {
            this[0] = arg1[0];
            this[1] = arg1[1];
            this[2] = arg1[2];
            this[3] = arg1[3];
        } else {
            const coords = Vector4D.parse(arg1, arg2, arg3, arg4);
            this[0] = coords[0];
            this[1] = coords[1];
            this[2] = coords[2];
            this[3] = coords[3];
        }
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, 3, "x", "y", "z", "w");
        return this;
    }

    /**
     * Adds values to this vector.
     * @param {number|Vector4D|Array|Object} x - X value or vector
     * @param {number} [y] - Y value (if x is number)
     * @param {number} [z] - Z value (if x is number)
     * @param {number} [w] - W value (if x is number)
     * @returns {Vector4D} This vector for chaining
     */
    add(x, y, z, w) {
        if (this._freezable && this.frozen) return this;

        if (typeof x == "number") {
            this[0] += x;
            this[1] += y || 0;
            this[2] += z || 0;
            this[3] += w || 0;
        } else {
            const coords = Vector4D.parse(x, y, z, w);
            this[0] += coords[0];
            this[1] += coords[1];
            this[2] += coords[2];
            this[3] += coords[3];
        }
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, 3, "x", "y", "z", "w");
        return this;
    }

    /**
     * Subtracts values from this vector.
     * @param {number|Vector4D|Array|Object} x - X value or vector
     * @param {number} [y] - Y value (if x is number)
     * @param {number} [z] - Z value (if x is number)
     * @param {number} [w] - W value (if x is number)
     * @returns {Vector4D} This vector for chaining
     */
    subtract(x, y, z, w) {
        if (this._freezable && this.frozen) return this;

        if (arguments.length == 4) {
            this[0] -= x;
            this[1] -= y;
            this[2] -= z;
            this[3] -= w;
        } else {
            const coords = Vector4D.parse(x, y, z, w);
            this[0] -= coords[0];
            this[1] -= coords[1];
            this[2] -= coords[2];
            this[3] -= coords[3];
        }
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, 3, "x", "y", "z", "w");
        return this;
    }

    multiply(scalar) {
        if (this._freezable && this.frozen) return this;
        this[0] *= scalar;
        this[1] *= scalar;
        this[2] *= scalar;
        this[3] *= scalar;
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, 3, "x", "y", "z", "w");
        return this;
    }

    dot(v) {
        return this[0] * v[0] + this[1] * v[1] + this[2] * v[2] + this[3] * v[3];
    }

    length() {
        return Math.hypot(this[0], this[1], this[2], this[3]);
    }

    normalize() {
        if (this._freezable && this.frozen) return this;
        let len = this.length();
        if (len > 0) {
            this[0] /= len;
            this[1] /= len;
            this[2] /= len;
            this[3] /= len;
            if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, 3, "x", "y", "z", "w");
        }
        return this;
    }

    /**
     * Linearly interpolates this vector toward target values.
     * @param {number|Vector4D|Array|Object} x - Target X or vector
     * @param {number} [y] - Target Y or interpolation amount
     * @param {number} [z] - Target Z (if x is number)
     * @param {number} [w] - Target W (if x is number)
     * @param {number} [amt] - Interpolation amount 0-1 (if x is number)
     * @returns {Vector4D} This vector for chaining
     */
    lerpTo(x, y, z, w, amt) {
        if (this._freezable && this.frozen) return this;

        if (arguments.length == 5) {
            this[0] = lerp(this[0], x, amt);
            this[1] = lerp(this[1], y, amt);
            this[2] = lerp(this[2], z, amt);
            this[3] = lerp(this[3], w, amt);
        } else if (arguments.length == 2) {
            amt = y;
            const coords = Vector4D.parse(x);
            this[0] = lerp(this[0], coords[0], amt);
            this[1] = lerp(this[1], coords[1], amt);
            this[2] = lerp(this[2], coords[2], amt);
            this[3] = lerp(this[3], coords[3], amt);
        }
        if (this._trackDirty) this.dirtyProperties.push(0, 1, 2, 3, "x", "y", "z", "w");
        return this;
    }

    /**
     * Returns a new vector representing the difference from this vector.
     * @param {number|Vector4D|Array|Object} x - X value or vector
     * @param {number} [y] - Y value (if x is number)
     * @param {number} [z] - Z value (if x is number)
     * @param {number} [w] - W value (if x is number)
     * @returns {Vector4D} A new difference vector
     */
    diff(x, y, z, w) {
        if (arguments.length === 1) {
            const coords = Vector4D.parse(x);
            return new Vector4D(this[0] - coords[0], this[1] - coords[1], this[2] - coords[2], this[3] - coords[3]);
        } else {
            return new Vector4D(this[0] - x, this[1] - y, this[2] - z, this[3] - w);
        }
    }

    /**
     * Gets the X component.
     * @returns {number} The X value
     */
    get x() {
        return this[0];
    }

    /**
     * Gets the Y component.
     * @returns {number} The Y value
     */
    get y() {
        return this[1];
    }

    /**
     * Gets the Z component.
     * @returns {number} The Z value
     */
    get z() {
        return this[2];
    }

    /**
     * Gets the W component.
     * @returns {number} The W value
     */
    get w() {
        return this[3];
    }

    /**
     * Sets the X component.
     * Skipped if vector is frozen. Marks property as dirty if tracking enabled.
     * @param {number} x - The new X value
     */
    set x(x) {
        // Fast path
        if (!this._freezable && !this._trackDirty) {
            this[0] = x;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (x == this[0]) return;
        this[0] = x;
        if (this._trackDirty) this.dirtyProperties.push(0, "x");
    }

    /**
     * Sets the Y component.
     * Skipped if vector is frozen. Marks property as dirty if tracking enabled.
     * @param {number} y - The new Y value
     */
    set y(y) {
        // Fast path
        if (!this._freezable && !this._trackDirty) {
            this[1] = y;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (y == this[1]) return;
        this[1] = y;
        if (this._trackDirty) this.dirtyProperties.push(1, "y");
    }

    /**
     * Sets the Z component.
     * Skipped if vector is frozen. Marks property as dirty if tracking enabled.
     * @param {number} z - The new Z value
     */
    set z(z) {
        // Fast path
        if (!this._freezable && !this._trackDirty) {
            this[2] = z;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (z == this[2]) return;
        this[2] = z;
        if (this._trackDirty) this.dirtyProperties.push(2, "z");
    }

    /**
     * Sets the W component.
     * Skipped if vector is frozen. Marks property as dirty if tracking enabled.
     * @param {number} w - The new W value
     */
    set w(w) {
        // Fast path
        if (!this._freezable && !this._trackDirty) {
            this[3] = w;
            return;
        }

        if (this._freezable && this.frozen) return;
        if (w == this[3]) return;
        this[3] = w;
        if (this._trackDirty) this.dirtyProperties.push(3, "w");
    }

    // === HISTORY METHODS ===

    /**
     * Saves the current vector state to history (if history enabled).
     * Clears dirty tracking after saving.
     */
    save() {
        if (!this._useHistory) return;
        this.last = this.saved;
        this.saved = [this[0], this[1], this[2], this[3]];
        this.history.unshift(this.saved);
        if (this._trackDirty) this.clean();
    }

    /**
     * Gets the changes from a specific history entry.
     * @param {number} [i=0] - History index (0 = most recent)
     * @returns {Vector4D} Difference vector
     */
    getChanges(i = 0) {
        if (!this._useHistory) return new Vector4D(0, 0, 0, 0);
        return this.diff(this.history[i]);
    }

    /**
     * Gets the difference between current state and last saved state.
     * @returns {Vector4D} Delta vector
     */
    get delta() {
        if (!this._useHistory) return new Vector4D(0, 0, 0, 0);
        return this.diff(this.last);
    }

    /**
     * Gets the difference between current state and the most recently saved state.
     * @returns {Vector4D} Delta from saved state
     */
    savedDelta() {
        if (!this._useHistory) return new Vector4D(0, 0, 0, 0);
        return this.diff(this.saved);
    }

    // === DIRTY TRACKING METHODS ===

    /**
     * Checks if any properties have been modified since last clean.
     * @returns {boolean} True if any properties are dirty
     */
    get dirty() {
        if (!this._trackDirty) return false;
        return this.dirtyProperties.length > 0;
    }

    isDirty(...props) {
        if (!this._trackDirty) return false;
        if (props.length) {
            return props.some((prop) => this.dirtyProperties.includes(prop));
        }
        return this.dirty;
    }

    clean(...props) {
        if (!this._trackDirty) return;
        if (props.length) {
            const extermItems = new Set(props);
            this.dirtyProperties = this.dirtyProperties.filter((item) => !extermItems.has(item));
        } else {
            this.dirtyProperties = new DistinctArray();
        }
    }

    // === FREEZE METHODS ===

    freeze(shouldFreeze = true) {
        if (this._freezable) {
            this.frozen = shouldFreeze;
        }
    }

    /**
     * Freezes the vector at specific values.
     * Sets the x, y, z, w values then freezes. Only works if freezable option was enabled.
     * @param {number} x - X value
     * @param {number} y - Y value
     * @param {number} z - Z value
     * @param {number} w - W value
     */
    freezeAt(x, y, z, w) {
        if (!this._freezable) return;
        this.freeze(false);
        this.set(x, y, z, w);
        this.freeze();
    }

    // === UTILITY METHODS ===

    /**
     * Converts the vector to a plain JavaScript object.
     * @returns {{x: number, y: number, z: number, w: number}} Object with x, y, z, w properties
     */
    toObject() {
        return { x: this[0], y: this[1], z: this[2], w: this[3] };
    }

    /**
     * Converts the vector to an array.
     * @returns {number[]} Array [x, y, z, w]
     */
    toArray() {
        return [this[0], this[1], this[2], this[3]];
    }

    /**
     * Converts the vector to a string representation.
     * @returns {string} String in format "Vector4D(x=1, y=2, z=3, w=4)"
     */
    toString() {
        return `Vector4D(x=${this.x}, y=${this.y}, z=${this.z}, w=${this.w})`;
    }

    /**
     * Checks if the vector has any non-zero values.
     * @returns {boolean} True if any component is non-zero
     */
    hasValue() {
        return this[0] !== 0 || this[1] !== 0 || this[2] !== 0 || this[3] !== 0;
    }

    /**
     * Creates a copy of this vector.
     * @returns {Vector4D} A new vector with the same values and options
     */
    copy() {
        return new Vector4D(this[0], this[1], this[2], this[3], this.options);
    }

    /**
     * Alias for copy(). Creates a copy of this vector.
     * @returns {Vector4D} A new vector with the same values and options
     */
    clone() {
        return this.copy();
    }

    /**
     * Returns a new vector with all components negated.
     * @returns {Vector4D} A new inverted vector
     */
    invert() {
        return new Vector4D(-this[0], -this[1], -this[2], -this[3]);
    }

    /**
     * Sets the minimum bounds for clamping.
     * @param {number|Vector4D|Array|Object} x - Min X or vector
     * @param {number} [y] - Min Y
     * @param {number} [z] - Min Z
     * @param {number} [w] - Min W
     */
    min(x, y, z, w) {
        this._min = Vector4D.parse(x, y, z, w);
    }

    /**
     * Sets the maximum bounds for clamping.
     * @param {number|Vector4D|Array|Object} x - Max X or vector
     * @param {number} [y] - Max Y
     * @param {number} [z] - Max Z
     * @param {number} [w] - Max W
     */
    max(x, y, z, w) {
        this._max = Vector4D.parse(x, y, z, w);
    }

    /**
     * Clamps the vector values between min and max bounds (if set).
     * Call min() and max() first to set bounds.
     * @returns {Vector4D} This vector for chaining
     */
    clamp() {
        if (this._max && this._min) {
            this[0] = clamp(this[0], this._min[0], this._max[0]);
            this[1] = clamp(this[1], this._min[1], this._max[1]);
            this[2] = clamp(this[2], this._min[2], this._max[2]);
            this[3] = clamp(this[3], this._min[3], this._max[3]);
        } else if (this._max) {
            this[0] = Math.min(this[0], this._max[0]);
            this[1] = Math.min(this[1], this._max[1]);
            this[2] = Math.min(this[2], this._max[2]);
            this[3] = Math.min(this[3], this._max[3]);
        } else if (this._min) {
            this[0] = Math.max(this[0], this._min[0]);
            this[1] = Math.max(this[1], this._min[1]);
            this[2] = Math.max(this[1], this._min[2]);
            this[3] = Math.max(this[1], this._min[3]);
        }
        return this;
    }
}

class AnimationVector2D extends Vector2D {
    constructor(arg1, arg2, options = {}) {
        super(arg1, arg2, options);
        this.velocity = new Vector2D();
    }
}

class Vector {
    constructor(...args) {
        if (args.length === 1) {
            if (typeof args[0] === "string") {
                if (args[0] === "2d") {
                    return new Vector2D();
                } else if (args[0] === "3d") {
                    return new Vector3D();
                }
            } else if (type(args[0], "array")) {
                if (args[0].length === 2) {
                    return new Vector2D(...args[0]);
                } else if (args[0].length === 3) {
                    return new Vector3D(...args[0]);
                }
            } else if (type(args[0], "object")) {
                if (args[0].z) {
                    return new Vector3D(args[0]);
                } else if (args[0].y) {
                    return new Vector2D(args[0]);
                }
            }
        } else if (args.length === 3) {
            return new Vector3D(...args);
        }
    }
}

export default Vector;

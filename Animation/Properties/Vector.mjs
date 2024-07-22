import { type } from "../../Util/Core.mjs";
import { lerp } from "../../Util/Geometry.mjs";
import CircularBuffer from "../../DataTypes/CircularBuffer.mjs";
export class Vector2D {
    static diff(a, b) {
        return new Vector2D(b.x - a.x, b.y - a.y);
    }
    /**
     * Parses arguments and returns a Float32Array containing XY coordinates.
     *
     * @param {number|Array|Vector2D} arg1 - Argument to parse.
     * @param {number} [arg2] - Second argument to parse (optional).
     * @returns {Float32Array} A Float32Array containing XY coordinates.
     * @throws {TypeError} If argument is invalid.
     */
    static parse(arg1, arg2) {
        const coords = new Float32Array(2);
        console.log(arguments);
        if (arg1 == undefined) {
            coords[0] = 0;
            coords[1] = 0;
            return coords;
        }

        // If second argument is provided, directly assign XY coordinates
        if (arg2 !== undefined) {
            coords[0] = arg1;
            coords[1] = arg2;
            return coords;
        }

        // If first argument is provided, assign XY values from array or Vector2D object
        if (arg1 !== undefined) {
            if (Array.isArray(arg1)) {
                // Argument is an XY array
                if (arg1.length === 2) {
                    coords[0] = arg1[0];
                    coords[1] = arg1[1];
                    return coords;
                } else {
                    throw new TypeError("Array must be of length 2");
                }
            } else if (arg1 instanceof Vector2D || arg1 instanceof Vector3D) {
                // Argument is another Vector2D object
                coords[0] = arg1.coords[0];
                coords[1] = arg1.coords[1];
                return coords;
            } else {
                throw new TypeError("Argument must be an array or Vector2D object");
            }
        } else {
            throw new TypeError("Must provide an argument");
        }
    }

    /**
     * Performs linear interpolation between two vectors.
     *
     * @param {Object} v1 - The first vector.
     * @param {Object} v2 - The second vector.
     * @param {number} amt - The interpolation amount.
     * @return {Vector2D} The interpolated vector.
     */
    static lerp(v1, v2, amt) {
        return new Vector2D(lerp(v1.coords[0], v2.coords[0], amt), lerp(v1.coords[1], v2.coords[1], amt));
    }

    /**
     * Constructs a new instance of the Vector2D class.
     *
     * @param {number|Array|Vector2D} arg1 - The first argument to parse.
     * @param {number} [arg2] - The second argument to parse (optional).
     * @param {Object} [options={}] - The options for the vector.
     */
    constructor(arg1, arg2, options = {}) {
        this.options = options;
        this.coords = new Float32Array(2);
        this.history = new CircularBuffer(3);
        this.set(arg1, arg2);
        this.save();
    }

    /**
     * Sets the coordinates of the vector based on the provided arguments.
     *
     * @param {number|Array|Vector2D} arg1 - The first argument to parse.
     * @param {number} arg2 - The second argument to parse.
     */
    set(arg1, arg2) {
        this.coords = Vector2D.parse(arg1, arg2);
    }

    /**
     * Adds the given values to the x and y coordinates of the vector.
     *
     * @param {number} x - The value to add to the x coordinate.
     * @param {number} y - The value to add to the y coordinate.
     * @return {void} This function does not return a value.
     */
    add(x, y) {
        this.coords[0] += x;
        this.coords[1] += y;
    }

    /**
     * Subtracts the given values from the x and y coordinates of the vector.
     *
     * @param {number} x - The value to subtract from the x coordinate.
     * @param {number} y - The value to subtract from the y coordinate.
     */
    subtract(x, y) {
        const v = Vector2D.parse(arguments[0], arguments[1]);
        console.log("Subtracting", v.x, v.y);
        this.coords[0] -= v[0];
        this.coords[1] -= v[1];
    }

    diff(v) {
        v = Vector2D.parse(v);
        return new Vector2D(this.coords[0] - v[0], this.coords[1] - v[1]);
    }

    /**
     * Linearly interpolates the vector coordinates to the target x and y values by a certain amount.
     *
     * @param {number} x - The target x value to interpolate towards.
     * @param {number} y - The target y value to interpolate towards.
     * @param {number} amt - The amount of interpolation to apply.
     */
    lerpTo(x, y, amt) {
        this.coords[0] = lerp(this.coords[0], x, amt);
        this.coords[1] = lerp(this.coords[1], y, amt);
    }

    get x() {
        return this.coords[0];
    }

    get y() {
        return this.coords[1];
    }

    set x(x) {
        this.coords[0] = x;
    }

    set y(y) {
        this.coords[1] = y;
    }

    /**
     * Saves the current vector state by creating a copy and updating the history based on options.
     */
    save() {
        this.last = this.saved;
        this.saved = this.coords.slice();
        if (this.options.history && this.options.history > 0) {
            this.history.unshift(this.saved);
        }
    }

    /**
     * Checks if the current vector state is different from the saved state.
     *
     * @return {boolean} Returns true if the current vector state is different from the saved state, false otherwise.
     */
    get dirty() {
        return this.coords[0] !== this.saved[0] || this.coords[1] !== this.saved[1];
    }

    /**
     * Checks if any of the x, y, or z coordinates of the vector are not equal to zero.
     *
     * @return {boolean} Returns true if any of the coordinates are not zero, false otherwise.
     */
    hasValue() {
        return this.coords[0] !== 0 || this.coords[1] !== 0 || this.coords[2] !== 0;
    }

    /**
     * Creates a copy of the current Vector2D instance.
     *
     * @return {Vector2D} A new Vector2D instance that is a copy of the current vector.
     */
    copy() {
        return new Vector2D(this);
    }
    /**
     * Returns a new Vector2D instance with the opposite values of the current instance.
     *
     * @return {Vector2D} A new Vector2D instance with the opposite values of the current instance.
     */
    opposite() {
        return new Vector2D(-this.coords[0], -this.coords[1]);
    }

    /**
     * Sets the maximum values of the vector to the given x and y coordinates.
     *
     * @param {number} x - The maximum x-coordinate.
     * @param {number} y - The maximum y-coordinate.
     * @return {void}
     */
    max(x, y) {
        this._max = new Vector2D(x, y);
    }

    /**
     * Sets the minimum values of the vector to the given x and y coordinates.
     *
     * @param {number} x - The minimum x-coordinate.
     * @param {number} y - The minimum y-coordinate.
     * @return {void}
     */
    min(x, y) {
        this._min = new Vector2D(x, y);
    }

    /**
     * Clamps the coordinates of the vector within the specified minimum and maximum values.
     *
     * @return {void}
     */
    clamp() {
        this.coords[0] = clamp(this.coords[0], this._min.x, this._max.x);
        this.coords[1] = clamp(this.coords[1], this._min.y, this._max.y);
    }

    /**
     * Returns a new Vector2D with coordinates clamped between the minimum and maximum values.
     *
     * @return {Vector2D} A new Vector2D instance with clamped coordinates.
     */
    limited() {
        return new Vector2D(
            Math.max(this.min.x, Math.min(this.max.x, this.coords[0])),
            Math.max(this.min.y, Math.min(this.max.y, this.coords[1]))
        );
    }

    getChanges(i = 0) {
        const saved = this.history[i];
        return this.diff(this.saved);
    }

    toArray() {
        return this.coords;
    }
}

export class Vector3D {
    static lerp(v1, v2, amt) {
        return new Vector3D(
            lerp(v1.coords[0], v2.coords[0], amt),
            lerp(v1.coords[1], v2.coords[1], amt),
            lerp(v1.coords[2], v2.coords[2], amt)
        );
    }

    static parse(arg1, arg2, arg3) {
        const coords = new Float32Array(3);

        if (arg1 === undefined) {
            coords[0] = 0;
            coords[1] = 0;
            coords[2] = 0;
            return coords;
        }

        if (arg3 !== undefined) {
            // Directly assign XYZ coordinates
            coords[0] = arg1;
            coords[1] = arg2;
            coords[2] = arg3;
            return coords;
        } else if (arg1 !== undefined) {
            // Assign XYZ values from array or Vector3D object
            if (Array.isArray(arg1)) {
                // Argument is an XYZ array
                if (arg1.length === 3) {
                    coords[0] = arg1[0];
                    coords[1] = arg1[1];
                    coords[2] = arg1[2];
                    return coords;
                } else {
                    throw new TypeError("Array must be of length 3");
                }
            } else if (arg1 instanceof Vector3D) {
                // Argument is another Vector3D object
                coords[0] = arg1.coords[0];
                coords[1] = arg1.coords[1];
                coords[2] = arg1.coords[2];
                return coords;
            } else {
                throw new TypeError("Invalid argument: expected an array of length 3 or a Vector3D object");
            }
        } else {
            throw new TypeError("Invalid number of arguments: expected 1 or 3 arguments");
        }
        return coords;
    }

    constructor(arg1, arg2, arg3, options = {}) {
        this.options = options;
        this.history = new CircularBuffer(3);
        this.coords = new Float32Array(3);
        this.coords[0] = 0;
        this.coords[1] = 0;
        this.coords[2] = 0;
        this.set(arg1, arg2, arg3);
        this.save();
    }

    set(arg1, arg2, arg3) {
        this.coords = Vector3D.parse(arg1, arg2, arg3);
    }

    add(x, y, z) {
        const coords = Vector3D.parse(x, y, z);
        this.coords[0] += coords[0];
        this.coords[1] += coords[1];
        this.coords[2] += coords[2];
    }

    subtract(x, y, z) {
        const coords = Vector3D.parse(x, y, z);
        this.coords[0] -= coords[0];
        this.coords[1] -= coords[1];
        this.coords[2] -= coords[2];
    }

    lerpTo(x, y, z, amt) {
        this.coords[0] = lerp(this.coords[0], x, amt);
        this.coords[1] = lerp(this.coords[1], y, amt);
        this.coords[2] = lerp(this.coords[2], z, amt);
    }

    diff(v) {
        v = Vector3D.parse(v);
        return new Vector3D(v[0] - this.coords[0], v[1] - this.coords[1], v[2] - this.coords[2]);
    }

    get x() {
        return this.coords[0];
    }

    get y() {
        return this.coords[1];
    }

    get z() {
        return this.coords[2];
    }

    set x(x) {
        this.coords[0] = x;
    }

    set y(y) {
        this.coords[1] = y;
    }

    set z(z) {
        this.coords[2] = z;
    }
    save() {
        this.saved = this.coords.slice();
        if (this.options.history && this.options.history > 0) {
            this.history.unshift(this.saved);
        }
    }

    get dirty() {
        return this.coords[0] !== this.saved[0] || this.coords[1] !== this.saved[1] || this.coords[2] !== this.saved[2];
    }

    toObject() {
        return { x: this.coords[0], y: this.coords[1], z: this.coords[2] };
    }

    toArray() {
        return this.coords;
    }

    toString() {
        return `Vector3D(x=${this.x}, y=${this.y}, z=${this.z})`;
    }

    hasValue() {
        return this.coords[0] !== 0 || this.coords[1] !== 0 || this.coords[2] !== 0;
    }

    copy() {
        return new Vector3D(this);
    }

    opposite() {
        return new Vector3D(-this.x, -this.y, -this.z);
    }

    min(x, y, z) {
        this._min = Vector3D.parse(x, y, z);
    }

    max(x, y, z) {
        this._max = Vector3D.parse(x, y, z);
    }

    clamp() {
        this.coords[0] = clamp(this.coords[0], this._min.x, this._max.x);
        this.coords[1] = clamp(this.coords[1], this._min.y, this._max.y);
        this.coords[2] = clamp(this.coords[2], this._min.z, this._max.z);
    }

    getChanges() {
        return this.diff(this.saved);
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
        }
    }
}

export default Vector;

/* Example usage
let v1 = new Vector3D(1, 2, 3);               // XYZ coordinates
let v2 = new Vector3D([4, 5, 6]);             // XYZ array
let v3 = new Vector3D(new Vector3D(7, 8, 9)); // Vector3D object

console.log(v1.toString());  // Output: Vector3D(x=1, y=2, z=3)
console.log(v2.toString());  // Output: Vector3D(x=4, y=5, z=6)
console.log(v3.toString());  // Output: Vector3D(x=7, y=8, z=9)
*/

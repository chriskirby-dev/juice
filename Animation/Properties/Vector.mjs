import { type } from "../../Util/Core.mjs";
import { lerp } from "../../Util/Geometry.mjs";
import CircularBuffer from "../../DataTypes/CircularBuffer.mjs";

export class Vector2D extends Float32Array {
    static parse(arg1, arg2) {
        //Handle x, y

        if (type(arg1, "number")) return new this(arg1, arg2);
        //Handle [x, y]
        if (type(arg1, "array")) return new this(...arg1);
        if (arg1 instanceof Vector2D) return arg1;
        //Handle {x, y}
        return new this(arg1.x, arg1.y);
    }

    constructor(x = 0, y = 0, options = {}) {
        super(2);
        this.options = options;
        this[0] = x;
        this[1] = y;
        this.history = new CircularBuffer(options.history || 3);
        this.saved = [0, 0];
    }

    toArray() {
        return this;
    }

    get x() {
        return this[0];
    }

    set x(x) {
        this[0] = x;
    }

    get y() {
        return this[1];
    }

    set y(y) {
        this[1] = y;
    }

    set(x, y) {
        this[0] = x;
        this[1] = y;
    }

    clone() {
        return new this.constructor(this[0], this[1]);
    }

    copy(v) {
        this[0] = v[0];
        this[1] = v[1];
        return this;
    }

    vdiff(v) {
        v = this.constructor.parse(v);
        return new this.constructor(this[0] - v[0], this[1] - v[1]);
    }

    vadd(v) {
        v = this.constructor.parse(v);
        this.add(v[0], v[1]);
        return this;
    }

    vsubtract(v) {
        v = this.constructor.parse(v);
        this.subtract(v[0], v[1]);
        return this;
    }

    vlerp(v, t) {
        v = this.constructor.parse(v);
        return new this.constructor(lerp(this[0], v[0], t), lerp(this[1], v[1], t));
    }

    vlerp2(v1, v2, t) {
        v1 = this.constructor.parse(v1);
        v2 = this.constructor.parse(v2);
        return new this.constructor(lerp(this[0], v1[0], t), lerp(this[1], v1[1], t));
    }

    add(x, y) {
        this[0] += x;
        this[1] += y;
        return this;
    }

    subtract(x, y) {
        this[0] -= x;
        this[1] -= y;
        return this;
    }

    diff(x, y) {
        return this.constructor.parse(this[0] - x, this[1] - y);
    }

    clamp() {
        if (this._max && this._min) {
            this[0] = clamp(this[0], this._min.x, this._max.x);
            this[1] = clamp(this[1], this._min.y, this._max.y);
        } else if (this.max) {
            this[0] = Math.min(this[0], this._max[0]);
            this[1] = Math.min(this[1], this._max[1]);
        } else if (this.min) {
            this[0] = Math.max(this[0], this._min[0]);
            this[1] = Math.max(this[1], this._min[1]);
        }
        return this;
    }

    save() {
        this.last = this.saved;
        this.saved = this.slice();
        if (this.options.history && this.options.history > 0) {
            this.history.unshift(this.saved);
        }
    }

    get dirty() {
        return this[0] !== this.saved[0] || this[1] !== this.saved[1];
    }

    invert() {
        return new Vector2D(-this[0], -this[1]);
    }

    max(x, y) {
        this._max = new Vector2D(x, y);
    }

    min(x, y) {
        this._min = new Vector2D(x, y);
    }

    getChanges(i = 0) {
        const saved = this.history[i];
        return this.diff(this.saved);
    }
}

export class Vector3D extends Float32Array {
    static lerp(v1, v2, amt) {
        return new Vector3D(lerp(v1[0], v2[0], amt), lerp(v1[1], v2[1], amt), lerp(v1[2], v2[2], amt));
    }

    /**
     * Parses a Vector3D from the given arguments.
     * If the argument is an array of length 3, it is used directly.
     * If the argument is an object with x, y, and z properties, they are used.
     * If the argument is a Vector3D instance, its coordinates are cloned.
     * Otherwise, a new Vector3D is created with the given x, y, and z values.
     * If no arguments are given, a new Vector3D is created with all values set to 0.
     * @param {number|Vector3D|Array<number>|Object} x - The x value, or an array/object with x,y,z values.
     * @param {number} [y] - The y value.
     * @param {number} [z] - The z value.
     * @returns {Float32Array} The parsed Vector3D coordinates.
     */
    static parse(x, y, z) {
        //If an array of length 3 is given, return a new Vector3D with the array values
        if (typeof x == "number") return new Vector3D([x, y, z]);
        //If an instance of Vector3D is given, return a new Vector3D with the cloned coordinates
        if (x instanceof Vector3D) return x.slice();
        //If an Array is given, return a new Vector3D with the array values
        if (Array.isArray(x)) return new Vector3D(x);

        //If an object with x, y, and z properties is given, return a new Vector3D with the object values
        if (typeof x === "object" && "x" in x) return new Float32Array([x.x, x.y || 0, x.z || 0]);
        //If no arguments are given, return a new Vector3D with all values set to 0
        if (arguments.length === 0) return new Vector3D([0, 0, 0]);
        //If no valid arguments are given, throw an error
        throw new TypeError(
            "Invalid argument: expected an array of length 3, a Vector3D object, or an object with x, y, and z properties"
        );
    }

    constructor(arg1, arg2, arg3, options = {}) {
        super(3);
        this.options = options;
        this.dirt = [];
        this.history = new CircularBuffer(3);
        this.set(arg1, arg2, arg3);
        this.save();
    }

    set(arg1, arg2, arg3) {
        if (typeof arg1 == "number") {
            this[0] = arg1;
            this[1] = arg2 || 0;
            this[2] = arg3 || 0;
        } else if (arg1 instanceof Vector3D) {
            this[0] = arg1[0];
            this[1] = arg1[1];
            this[2] = arg1[2];
        } else {
            const coords = Vector3D.parse(arg1, arg2, arg3);
            this[0] = coords[0];
            this[1] = coords[1];
            this[2] = coords[2];
        }
    }

    add(x, y, z) {
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
    }

    subtract(x, y, z) {
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
    }

    lerpTo(x, y, z, amt) {
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
    }

    diff(x, y, z) {
        if (arguments.length === 1) {
            const coords = Vector3D.parse(x);
            return new Vector3D(this[0] - coords[0], this[1] - coords[1], this[2] - coords[2]);
        } else {
            return new Vector3D(this[0] - x, this[1] - y, this[2] - z);
        }
    }

    get x() {
        return this[0];
    }

    get y() {
        return this[1];
    }

    get z() {
        return this[2];
    }

    set x(x) {
        if (x == this[0]) return;
        this[0] = x;
        this.dirt.push("x");
    }

    set y(y) {
        if (y == this[1]) return;
        this[1] = y;
        this.dirt.push("y");
    }

    set z(z) {
        if (z == this[2]) return;
        this[2] = z;
        this.dirt.push("z");
    }

    save() {
        this.saved = [this[0], this[1], this[2]];
        if (this.options.history && this.options.history > 0) {
            this.history.unshift(this.saved);
        }
        this.clean();
    }

    dirty(...props) {
        if (props.length) {
            return props.some((prop) => this.dirt.includes(prop));
        } else {
            return this.dirt.length > 0;
        }
    }

    clean(...props) {
        if (props.length) {
            const extermItems = new Set(props);
            this.dirt = this.dirt.filter((item) => !extermItems.has(item));
        } else {
            delete this.dirty;
        }
    }

    toObject() {
        return { x: this[0], y: this[1], z: this[2] };
    }

    toArray() {
        return this;
    }

    toString() {
        return `Vector3D(x=${this.x}, y=${this.y}, z=${this.z})`;
    }

    hasValue() {
        return this[0] !== 0 || this[1] !== 0 || this[2] !== 0;
    }

    copy() {
        return new Vector3D(this);
    }

    invert() {
        return new Vector3D(-this[0], -this[1], -this[0]);
    }

    min(x, y, z) {
        this._min = Vector3D.parse(x, y, z);
    }

    max(x, y, z) {
        this._max = Vector3D.parse(x, y, z);
    }

    clamp() {
        this[0] = clamp(this[0], this._min.x, this._max.x);
        this[1] = clamp(this[1], this._min.y, this._max.y);
        this[2] = clamp(this[2], this._min.z, this._max.z);
    }

    getChanges() {
        return this.diff(this.saved);
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
        }
    }
}

export default Vector;

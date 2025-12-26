import AnimationValue from "./Value.mjs";
import { clamp } from "../../Util/Math.mjs";

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

    get value() {
        return super.value;
    }

    add(deg) {
        this._value += deg;
    }

    subtract(deg) {
        this._value -= deg;
    }

    equals(v) {
        return this._value === v % this.SPAN;
    }

    inverted() {
        return new Rotation((this._value + 180) % 360);
    }

    toDegrees() {
        return (this._value * 180) / Math.PI;
    }

    toRadians() {
        return (this._value * Math.PI) / 180;
    }

    toFixed(i) {
        return this._value.toFixed(i);
    }

    valueOf() {
        return this._value;
    }
}

export class Rotation2D {
    constructor(x = 0, y = 0) {
        this.x = new Rotation(x);
        this.y = new Rotation(y);
    }
}

export class Rotation3D extends Float32Array {
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
        this.setAxisValue("x", x);
    }

    set y(y) {
        this.setAxisValue("y", y);
    }

    set z(z) {
        this.setAxisValue("z", z);
    }

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

    reset() {
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
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
            this.dirt = [];
        }
    }

    getAxis(axis) {
        return new Rotation(this[axis]);
    }
}

export default Rotation;
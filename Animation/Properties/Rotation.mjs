import AnimationValue from "./Value.mjs";

export class Rotation extends AnimationValue {
    OFFSET = 0;
    MIN = 0;
    MAX = 360;
    SPAN = 360;

    constructor(value, options = {}) {
        super(value, options);
        this.OFFSET = options.offset || this.OFFSET;
    }

    set value(v) {
        if (this.locked) return;
        if (v >= this.MAX) {
            v = this.MIN + (v % this.SPAN);
        } else if (v <= this.MIN) {
            v = this.MAX - Math.abs(v % this.SPAN);
        }
        this._value = v;
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

    toOpposite() {
        return new Rotation((this._value + 180) % 360);
    }

    toDegrees() {
        return (this._value * 180) / Math.PI;
    }

    toRadians() {
        return (this._value * Math.PI) / 180;
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

export class Rotation3D {
    constructor(x = 0, y = 0, z = 0) {
        this.x = new Rotation(x);
        this.y = new Rotation(y);
        this.z = new Rotation(z);
    }
}

export default Rotation;

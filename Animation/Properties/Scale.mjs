import AnimationValue from "./Value.mjs";

export class Scale extends AnimationValue {
    constructor(value) {
        super(value);
    }
}

export class Scale2D extends Float32Array {
    constructor(x = 1, y = 1) {
        this[0] = x;
        this[1] = y || x;
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

    set(v) {
        this[0] = v;
        this[1] = v;
    }
}

export default Scale;
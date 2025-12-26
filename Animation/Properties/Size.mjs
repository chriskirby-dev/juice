import AnimationValue from "./Value.mjs";

export class Size extends AnimationValue {
    constructor(value, options = {}) {}
}

export class Size2D extends Float32Array {
    constructor(x = 0, y = 0) {
        super(3);
        this[0] = x;
        this[1] = y;
    }

    get x() {
        return this[0];
    }

    set x(x) {
        if (x == this[0]) return;
        this[0] = x;
        this.dirty = true;
    }

    get y() {
        return this[1];
    }

    set y(y) {
        if (y == this[1]) return;
        this[1] = y;
        this.dirty = true;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    clean() {
        delete this.dirty;
    }
}

export class Size3D extends Float32Array {
    constructor(x = 0, y = 0, z = 0) {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this.dirt = [];
    }

    get x() {
        return this[0];
    }

    set x(x) {
        if (x == this[0]) return;
        this[0] = x;
        this.dirt.push("x");
    }

    get y() {
        return this[1];
    }

    set y(y) {
        if (y == this[1]) return;
        this[1] = y;
        this.dirt.push("y");
    }

    get z() {
        return this[2];
    }

    set z(z) {
        if (z == this[2]) return;
        this[2] = z;
        this.dirt.push("z");
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clean(...props) {
        if (props.length) {
            const extermItems = new Set(props);
            this.dirt = this.dirt.filter((item) => !extermItems.has(item));
        } else {
            this.dirt = [];
        }
    }

    dirty(...props) {
        if (props.length) {
            return props.some((prop) => this.dirt.includes(prop));
        } else {
            return this.dirt.length > 0;
        }
    }
}
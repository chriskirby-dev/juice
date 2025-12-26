import { AnimationValue } from "./Value.mjs";

class Velocity {
    CARTESIAN = "cartesian";
    POLOR = "polor";
    coords = [0, 0];
    constructor(type) {
        this.type = type;
        this.coords[0] = new AnimationValue(0);
        this.coords[1] = new AnimationValue(0);
        this._angle = new AnimationValue(0);
    }

    get angle() {
        return this._angle.value;
    }

    set angle(angle) {
        this._angle.value = angle;
    }

    get x() {
        return this.coords[0].value;
    }

    set x(x) {
        this.coords[0].value = x;
    }

    get y() {
        return this.coords[1].value;
    }

    set y(y) {
        this.coords[1].value = y;
    }

    polor(value, angle) {
        this.angle = angle || this.angle || 0;
        this.coords[0].value = value * Math.cos(this.angle);
        this.coords[1].value = value * Math.sin(this.angle);
    }

    friction(x, y) {
        this.coords[0].value -= x;
        this.coords[1].value -= y;
    }

    applyForce(x, y) {
        this.coords[0].value += x;
        this.coords[1].value += y;
    }

    toAngle() {
        this._angle.value = Math.atan2(this.coords[1].value, this.coords[0].value);
        return this._angle.value;
    }

    toSpeed() {
        this.speed = Math.sqrt(Math.pow(this.coords[0].value, 2) + Math.pow(this.coords[1].value, 2));
        return this.speed;
    }

    toPolor() {
        const velocity = Math.sqrt(Math.pow(this.coords[0].value, 2) + Math.pow(this.coords[1].value, 2));
        const angle = Math.atan2(this.coords[1].value, this.coords[0].value);
        return { velocity, angle };
    }
}

export default Velocity;
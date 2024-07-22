import { lerp } from "../Util/Geometry.mjs";

export const linear = (t) => t;
export const easeInQuad = (t) => t * t;
export const easeOutQuad = (t) => t * (2 - t);
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
export const easeInCubic = (t) => t * t * t;
export const easeOutCubic = (t) => --t * t * t + 1;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);
export const easeInQuart = (t) => t * t * t * t;
export const easeOutQuart = (t) => --t * t * t * t + 1;
export const easeInOutQuart = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t);
export const easeInQuint = (t) => t * t * t * t * t;
export const easeOutQuint = (t) => --t * t * t * t * t + 1;
export const easeInOutQuint = (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - 16 * --t * t * t * t * t);
export const easeInSine = (t) => 1 - Math.cos((t * Math.PI) / 2);
export const easeOutSine = (t) => Math.sin((t * Math.PI) / 2);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

const Easing = {
    linear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuart,
    easeOutQuart,
    easeInOutQuart,
    easeInQuint,
    easeOutQuint,
    easeInOutQuint,
    easeInSine,
    easeOutSine,
    easeInOutSine,
};

export class Ease {
    time = 0;

    constructor(start, end, duration, easeType = "linear") {
        this.easeFn = typeof easeType == "function" ? easeType : Easing[easeType];
        this.duration = duration;
    }

    at(time) {
        this.time = time;
        this.progress = this.time / this.duration;
        this.value = this.easeFn(this.progress);
        return this.value;
    }

    update(delta) {
        this.time += delta;
        return this.at(this.time);
    }
}

export default Easing;

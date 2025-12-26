import Easing from "./Easinig.mjs";

import EventEmitter from "../Event/Emitter.mjs";

import { diff, change } from "../Util/Object.mjs";

export default class Tween {
    callbacks = {};
    constructor(startValue, endValue, duration, easingFunction = Easing.linear, easeDuration) {
        super();
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.easeDuration = easeDuration || duration;
        this.easingFunction = easingFunction;
        this.startTime = null;
        this.animationFrameId = null;
        this.onUpdate = null; // Callback function to apply the updated value
        this.onComplete = null; // Callback function when tweening is complete
    }

    start() {
        this.startTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this._update.bind(this));
    }

    update(fn) {
        this.callbacks.update = fn;
        return this;
    }

    complete(fn) {
        this.callbacks.complete = fn;
        return this;
    }

    _update(currentTime) {
        const elapsedTime = currentTime - this.startTime;
        const progress = Math.min(elapsedTime / this.duration, 1);
        const easedProgress = this.easingFunction(progress);
        const currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;

        if (this.callbacks.update) this.callbacks.update(currentValue, progress);

        if (progress < 1) {
            this.animationFrameId = requestAnimationFrame(this._update.bind(this));
        } else {
            if (this.callbacks.complete) this.callbacks.complete();
            this.stop();
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

class TweenObject extends EventEmitter {
    constructor(startValue, endValue, duration, easingFunction = Easing.linear) {
        super();
        this.tweens = [];
        const diff = change(startValue, endValue);
        for (const key in diff) {
            this.tweens.push(new Tween(diff[key][0], diff[key][1], duration, easingFunction));
        }
    }

    start() {
        this.tweens.forEach((tween) => tween.start());
    }
}
/*
// Usage example
const tween = new Tween(0, 100, 2000, Easing.easeInOutQuad);
tween.update((value, progress) => {
    console.log(`Value: ${value}, Progress: ${progress}`);
});

tween.complete(() => {
    console.log("Tween complete");
});
tween.start();
*/
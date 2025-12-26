import Easing from "../Easing.mjs";

class Accumulator {
    index = -1;
    value = 0;

    constructor(increment, value, options = {}) {
        if (typeof increment == "function") {
            this.fn = increment.bind(this);
        } else {
            this.increment = increment;
        }

        if (value !== undefined) this.value = value;
        if (options.curve) this.curve = options.curve;
        if (options.increment) this.increment = options.increment;
    }

    step() {
        if (this.increment) {
            return this.value + this.increment;
        }
        this.index++;
    }

    add(value) {
        this.value += value;
        if (this.max && this.value > this.max) this.value = this.max;
    }

    multiply(value) {
        this.value *= value;
        if (this.max && this.value > this.max) this.value = this.max;
    }

    reset() {
        this.value = 0;
        this.index = 0;
    }

    next() {
        this.index++;
        if (this.fn) {
            this.value = this.fn();
        } else {
            this.value = this.step();
        }
        return this.valueOf();
    }

    valueOf() {
        return this.value;
    }
}

/**
const acc = new Accumulator(( index, value ) => {
    return index + value;
});
acc.next();
console.log(acc);
*/

class Ramp {
    easing = Easing.linear;
    time = {
        start: 0,
        end: 0,
        current: 0,
    };
    tmp = {};
    curve = 0;
    curveAccumulator = 0;
    active = false;
    value = 0;
    defaultValue = 0;
    active = false;

    constructor(value, options = {}) {
        if (value) {
            this.value = value;
            this.defaultValue = value;
        }
        this.curveAccumulator = new Accumulator((index, value) => {}, options.max);
        this.setOptions(options);
    }

    setOptions(options) {
        if (options.curve) {
            this.curve = options.curve;
            const easing = function (t) {
                this.curveAccumulator += this.curve * delta;
                return t;
            };
            this.eassing = easing.bind(this);
        }
        if (options.easing) this.easing = Easing[options.easingFunction] || options.easingFunction;
        if (options.max) this.max = options.max;
        if (options.min) this.min = options.min;
        if (options.direction) this.direction = options.direction;
    }

    update(delta) {
        this.time.current += delta;
        if (this.time.start) {
            this.value += (this.time.current - this.time.start) * this.easing(this.time.current - this.time.start);
        } else if (this.time.end) {
        }
    }
}
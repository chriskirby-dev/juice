export class ThrottleController {
    constructor(accelerationRate = 0.001, deceleratonRate = 0.5, options = {}) {
        this.power = 0;
        this.value = 0;
        this.acceleration = 0;
        this.accelerationRate = accelerationRate;
        this.decelerationRate = deceleratonRate;
        this.isPressed = false;
        this.options = options;
        this.idle = options.idle || 0;
        this.update(0);
    }

    press(amount = 1) {
        // debug("pressing throttle");
        this.amount = Math.min(amount, 1);
        this.isPressed = true;
    }

    release() {
        /// debug("releasing throttle");
        this.isPressed = false;
        this.amount = 0;
        this.acceleration = 0;
    }

    update(delta) {
        if (this.isPressed) {
            //  console.log("throttle pressed");
            this.acceleration += this.accelerationRate;
            this.power += this.acceleration * delta;
            if (this.power > 1) this.power = 1;
        } else {
            this.power -= this.decelerationRate * delta;
            if (this.power < this.idle) this.power = this.idle;
        }
    }
}

/*
Ramp:

accumulator: number - how quickly the ramp value increases per second
accumulatorMax: number - the maximum value of the ramp
value: number - the current value of the ramp
rampValue: number - the unclamped value of the ramp

*/

export class Ramp {
    min;
    max;
    constructor(multiplier = 0.01, accumulatorMax = 1, drection = 1) {
        this.accumulator = 0;
        this.multiplier = multiplier;
        this.accumulatorMax = accumulatorMax;
        this.direction = direction;
        this.value = 0;
    }

    start() {
        this.started = true;
    }

    stop() {
        this.started = false;
    }

    reset() {
        this.value = 0;
        this.maxed = false;
    }

    clamp(min, max) {
        this.min = min;
        this.max = max;
    }

    update(delta) {
        if (this.maxed) return;

        if (this.accumulator < this.accumulatorMax) {
            //Increase accumulator by multiplier
            this.accumulator += this.multiplier * delta;
            //If accumlator is more then accumulatorMax limit t0 accumulatorMax
            if (this.accumulator > this.accumulatorMax) this.accumulator = this.accumulatorMax;
        }

        if (this.max === undefined || this.value < this.max) {
            this.value += this.accumulator * delta * this.direction;
        }

        if (this.value > this.max) {
            this.value = this.max;
            this.maxed = true;
        }
    }
}

export class RampUp extends Ramp {
    constructor(accumulator, max = 1) {
        super(accumulator, max, 0, 1);
    }
}

export class RampDown extends Ramp {
    constructor(accumulator, min = 0) {
        super(accumulator, max, min, -1);
    }
}

export class RampedValue {
    direction = 0;

    constructor(value = 0, acceleration, deceleration, options = {}) {
        this.acceleration = acceleration;
        this.deceleration = deceleration;
        this.min = options.min || 0;
        this.max = options.max || Infinity;
        this.value = value;
    }

    reset() {
        this.value = 0;
    }

    update(delta) {
        if (direction == 1) {
            this.value += delta;
            if (this.value < this.max) this.value += this.acceleration;
        } else if (direction == -1) {
            this.value -= delta;
            if (this.value < this.min) this.value = this.min;
        } else if (direction == 0) {
            this.value -= delta;
            if (this.value < this.min) this.value = this.min;
        }
    }

    get value() {
        return this._value;
    }
}

class RampController {}

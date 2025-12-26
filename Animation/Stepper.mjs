import { type } from "../Util/Core.mjs";
import { lerp } from "../Util/Geometry.mjs";
import UnitValue from "../Value/Unit.mjs";
class AnimationStepper {
    steps = [];
    properties = {};
    index = 0;

    constructor(steps, duration) {
        this.duration = duration;
        this.parse(steps);
    }

    findStep(percent) {
        for (let i = 0; i < this.steps.length; i++) {
            if (percent <= this.steps[i]) {
                return i;
            }
        }
        return null;
    }

    get stepEnd() {
        return this.steps[this.index + 1] || this.duration;
    }

    get stepStart() {
        return this.steps[this.index];
    }

    get stepSpan() {
        return this.stepEnd - this.stepStart;
    }

    get stepProgress() {
        return (this.time - this.stepStart) / this.stepSpan;
    }

    getProperties() {
        return this.current;
    }

    getPropertiesAt(time) {
        const tmpTime = this.time;
        this.time = time;
        this.update(0);
        const stepped = this.current;
        this.time = tmpTime;
        return stepped;
    }

    parse(steps) {
        this.raw = steps;

        const regexNumeric = /^(-?\d*\.?\d+)([a-z%]*)$/i;

        for (let position of steps) {
            const percent = parseFloat(position.replace("%", ""));
            this.steps.push(percent);
            const parsed = {};
            for (const [key, v] of Object.entries(steps[position])) {
                if ((match = value.match(regexNumeric))) {
                    const value = new UnitValue(v);
                    parsed[key] = {
                        type: "numeric",
                        value: value.value,
                        unit: value.unit,
                    };
                } else {
                    parsed[key] = value;
                }
            }
            this.properties.push(parsed);
        }
    }

    update(delta) {
        this.time += delta;
        const progress = this.time / this.duration;
        const percent = progress * 100;
        if (percent > this.stepEnd || percent < this.stepStart) {
            this.index = this.findStep(percent);
        }
        const complete = this.stepProgress;
        const start = this.properties[this.index];
        const end = this.properties[this.index + 1];
        const stepped = {};
        for (let property in start) {
            if (end[property]) {
                stepped[property] = lerp(start[property].value, end[property].value, progress);
                if (start[property].unit) stepped[property] += start[property].unit;
            }
        }
        this.current = stepped;
        return stepped;
    }
}

export default AnimationStepper;
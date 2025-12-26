import Easing from "../Easing.mjs";
import { getDotPath, setDotPath, parseDotPath } from "../../Util/DotNotation.mjs";
import EventEmitter from "../../Event/Emitter.mjs";

const valueRegExp = /^-?\d+(\.\d+)?/;
function parseValue(input) {
    const match = input.match(valueRegExp);
    const value = parseFloat(match[0]);
    const unit = match.index + match[0].length === input.length ? null : input.substring(match.index + match[0].length);
    return { value, unit };
}

class TransitionValue {
    scope;
    property;
    unit;
    _value;

    constructor(scope, property) {
        this.scope = scope;
        this.property = property;
        this.initialize();
    }

    get value() {
        return this._unit ? `${this._value.value}${this._value.unit}` : this._value;
    }

    set value(v) {
        if (v === this._value) return;
        if (typeof v == "string") {
            const { value, unit } = parseValue(v);
            this._value = value;
            this._unit = unit;
            this.scope[this.property] = this.value;
        } else {
            this._value = v;
        }
    }

    setValue(v) {
        this._value = v;
        this.scope[this.property] = this.value;
        return this._value;
    }

    newLerp(to, duration = 1) {
        const self = this;
        const { value, unit } = parseValue(to);
        const from = this._value;
        const span = to - from;
        let time = 0;
        return {
            delta(delta) {
                time += delta;
                const progress = time / duration;
                return self.setValue(from + span * progress);
            },
            progress: (progress) => {
                return self.setValue(from + span * progress);
            },
            time(t) {
                time = t;
                return self.setValue(from + (span * time) / duration);
            },
        };
    }

    parse() {
        const { scope, property } = this;
        const { value, unit } = parseValue(scope[property]);
        this.unit = unit;
        this._value = value;
    }

    initialize() {
        this.parse();
    }
}

class Transition extends EventEmitter {
    from;
    to;
    type;

    time = {
        start: 0,
        current: 0,
        delta: 0,
    };

    duration = 0;

    source = {};

    ops = [];
    lerps = [];

    properties = {};

    constructor(from, to, duration, easing = null) {
        this.from = from;
        this.to = to;
        this.duration = duration;
        this.easing = easing || Easing.linear;

        this.initialize();
    }

    onProgress(progress) {
        for (let i = 0; i < lerps.length; i++) {
            lerps[i].progress(progress);
        }
    }

    update(delta) {
        const { lerps } = this;
        this.time.current += delta;
        this.time.delta = delta;
        const progress = this.time.current / this.duration;
        this.onProgress(progress);

        if (progress >= 1) {
            this.emit("complete");
        }
    }

    initialize() {
        const { from, to } = this;
        const ops = [];
        for (let property in to) {
            const toValue = parseValue(to[property]);
            this.type = toValue.unit || "number";

            const fromValue = from[property];
            if (fromValue === toValue) continue;
            if (!from.hasOwnProperty(property)) from[property] = 0;
            this.properties[property] = new TransitionValue(from, property);
        }
    }
}

export default Transition;
import CircularBuffer from "../../DataTypes/CircularBuffer.mjs";

export class AnimationValue {
    //Animatiion Value
    HISTORY_LENGTH = 0;
    raw = 0;

    constructor(v, options = {}) {
        this._value = 0;
        this.history = new CircularBuffer(options.history || 3);
        if (options.debug) this.debug = true;
        if (options.type) this.type = options.type;
        if (v !== undefined && v !== null) {
            this._value = v;
            this.history.unshift(v);
        }
        this.options = options;

        if (this.type) {
            const type = this.type.charAt(0).toUpperCase() + this.type.slice(1);
            this.setter = this[`_set${type}Type`];
        } else {
            this.setter = this._setValue;
        }
    }

    reset() {
        this.value = 0;
    }

    getValue() {
        return this._value;
    }

    get value() {
        return this.getValue();
    }

    _setTyped(v) {
        this._value = v;
    }

    _setIntType(v) {
        if (!Number.isInteger(v)) {
            v = Math.floor(v);
        }
        this._value = v;
        return true;
    }

    _setFloatType(v) {
        this._value = parseFloat(v);
        return true;
    }

    _setValue(v) {
        this._value = v;
    }

    set value(v) {
        //If value is locked OR has not changed return
        if (this.locked || this._value === v) return;
        return this.setter(v);
    }

    valueOf() {
        return this._value;
    }

    lock(locked = true) {
        this.locked = locked;
    }

    save() {
        if (!this.dirty) return;
        if (this.history && this.history.size > 0) {
            this.history.unshift(this._value);
            this.history.print();
            console.log("saved");
        } else {
            console.log("no history");
        }
    }

    equals(v) {
        return this._value === v;
    }

    get dirty() {
        return this._value !== this.history.first;
    }
}

export default AnimationValue;
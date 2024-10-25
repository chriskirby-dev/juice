export class AnimationValue {
    //Animatiion Value
    HISTORY_LENGTH = 0;
    raw = 0;

    constructor(v, options = {}) {
        this._value = 0;
        this.history = [];
        if (options.debug) this.debug = true;
        if (options.type) this.type = options.type;
        this.HISTORY_LENGTH = options.history || 1;
        if (v !== undefined && v !== null) this._value = v;

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
        if (this.HISTORY_LENGTH) {
            //if history length is set store to history
            this.history.unshift(this._value);
            if (this.history.length > this.HISTORY_LENGTH) this.history.pop();
        }
    }

    equals(v) {
        return this._value === v;
    }

    get dirty() {
        return this._value !== this.history[0];
    }
}

export default AnimationValue;

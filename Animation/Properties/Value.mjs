export class AnimationValue {
    //Animatiion Value
    HISTORY_LENGTH = 0;
    raw = 0;

    constructor(v, options = {}) {
        this._value = 0;
        this.history = [];
        if (options.debug) this.debug = true;
        this.HISTORY_LENGTH = options.history || 1;
        if (v !== undefined && v !== null) this._value = v;
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

    set value(v) {
        //If value is locked OR has not changed return
        if (this.locked || this._value === v) return;
        this._value = v;
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

    is(v) {
        return this._value === v;
    }

    get dirty() {
        return this._value !== this.history[0];
    }
}

export default AnimationValue;

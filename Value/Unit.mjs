class UnitValue {
    constructor(value, unit) {
        if (/%|px|em|rem/.test(value)) {
            this._value = parseFloat(value);
            this._unit = value.replace(/[^%|px|em|rem]/g, "");
        } else {
            this._value = parseFloat(value);
            this._unit = unit || "px";
        }
    }

    get value() {
        return this._value;
    }

    get unit() {
        return this._unit;
    }

    toPercent(total) {
        if (this._unit == "%") return this._value;
        return this._value + this._unit;
    }

    toPx(total) {
        if (this._unit == "px") return this._value;
        return (this._value / 100) * total + this._unit;
    }

    valueOf() {
        return this._value + this._unit;
    }
}

export default UnitValue;

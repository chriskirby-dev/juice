/**
 * UnitValue represents a numeric value with a CSS unit (px, em, rem, %).
 * Provides conversion methods between different CSS units.
 * @module Value/Unit
 */

/**
 * UnitValue class for handling CSS unit values.
 * Parses and converts between different CSS units like px, em, rem, and %.
 * @class UnitValue
 * @example
 * const width = new UnitValue('50%');
 * const height = new UnitValue(200, 'px');
 */
class UnitValue {
    /**
     * Creates a new UnitValue instance.
     * @param {string|number} value - The value, can be a string with unit (e.g., "50px") or a number
     * @param {string} [unit='px'] - The unit to use if value is a number
     */
    constructor(value, unit) {
        if (/%|px|em|rem/.test(value)) {
            this._value = parseFloat(value);
            this._unit = value.replace(/[^%|px|em|rem]/g, "");
        } else {
            this._value = parseFloat(value);
            this._unit = unit || "px";
        }
    }

    /**
     * Gets the numeric value without the unit.
     * @returns {number} The numeric value
     */
    get value() {
        return this._value;
    }

    /**
     * Gets the unit (px, em, rem, or %).
     * @returns {string} The unit
     */
    get unit() {
        return this._unit;
    }

    /**
     * Converts the value to a percentage.
     * @param {number} total - The total value to calculate percentage from
     * @returns {string|number} The value as a percentage or original value with unit
     */
    toPercent(total) {
        if (this._unit == "%") return this._value;
        return this._value + this._unit;
    }

    /**
     * Converts the value to pixels.
     * @param {number} total - The total value for percentage calculations
     * @returns {string|number} The value in pixels or converted from percentage
     */
    toPx(total) {
        if (this._unit == "px") return this._value;
        return (this._value / 100) * total + this._unit;
    }

    /**
     * Returns the string representation of the value with its unit.
     * @returns {string} The value as a string with unit (e.g., "50px")
     */
    valueOf() {
        return this._value + this._unit;
    }
}

export default UnitValue;

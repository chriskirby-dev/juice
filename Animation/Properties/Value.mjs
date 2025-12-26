/**
 * AnimationValue provides a value wrapper with history tracking and type enforcement.
 * Supports value locking, dirty checking, and typed setters (int, float).
 * @module Animation/Properties/Value
 */

import CircularBuffer from "../../DataTypes/CircularBuffer.mjs";

/**
 * Represents an animation value with history tracking and type constraints.
 * @class AnimationValue
 * @param {*} v - Initial value
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.history=3] - History buffer size
 * @param {boolean} [options.debug] - Enable debug mode
 * @param {string} [options.type] - Value type ('int', 'float')
 * @example
 * const value = new AnimationValue(100, { type: 'int', history: 5 });
 * value.value = 150;
 * console.log(value.dirty); // true if changed
 */
export class AnimationValue {
    /** @type {number} History buffer length */
    HISTORY_LENGTH = 0;
    /** @type {number} Raw value storage */
    raw = 0;

    /**
     * Creates a new AnimationValue instance.
     * @param {*} v - Initial value
     * @param {Object} [options={}] - Configuration options
     */
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

    /**
     * Resets the value to 0.
     */
    reset() {
        this.value = 0;
    }

    /**
     * Gets the current value.
     * @returns {*} Current value
     */
    getValue() {
        return this._value;
    }

    /**
     * Gets the current value.
     * @type {*}
     */
    get value() {
        return this.getValue();
    }

    /**
     * Sets value with type conversion (internal).
     * @param {*} v - Value to set
     * @private
     */
    _setTyped(v) {
        this._value = v;
    }

    /**
     * Sets value as integer, flooring decimals.
     * @param {number} v - Value to set
     * @returns {boolean} Success status
     * @private
     */
    _setIntType(v) {
        if (!Number.isInteger(v)) {
            v = Math.floor(v);
        }
        this._value = v;
        return true;
    }

    /**
     * Sets value as float with parsing.
     * @param {number} v - Value to set
     * @returns {boolean} Success status
     * @private
     */
    _setFloatType(v) {
        this._value = parseFloat(v);
        return true;
    }

    /**
     * Sets value without type conversion.
     * @param {*} v - Value to set
     * @private
     */
    _setValue(v) {
        this._value = v;
    }

    /**
     * Sets the value using the configured setter.
     * Respects lock state and only updates if value changed.
     * @type {*}
     */
    set value(v) {
        //If value is locked OR has not changed return
        if (this.locked || this._value === v) return;
        return this.setter(v);
    }

    /**
     * Returns the primitive value.
     * @returns {*} The current value
     */
    valueOf() {
        return this._value;
    }

    /**
     * Locks or unlocks the value from being changed.
     * @param {boolean} [locked=true] - Lock state
     */
    lock(locked = true) {
        this.locked = locked;
    }

    /**
     * Saves current value to history buffer if dirty.
     */
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

    /**
     * Checks if value equals given value.
     * @param {*} v - Value to compare
     * @returns {boolean} True if equal
     */
    equals(v) {
        return this._value === v;
    }

    /**
     * Checks if value has changed since last save.
     * @type {boolean}
     */
    get dirty() {
        return this._value !== this.history.first;
    }
}

export default AnimationValue;
/**
 * SyncedValue maintains a value synced across multiple parent objects.
 * When the value changes, all synced properties are automatically updated.
 * @module DataTypes/SyncedValue
 */

/**
 * Value wrapper that synchronizes changes to multiple parent object properties.
 * @class SyncedValue
 * @param {*} value - Initial value
 * @example
 * const synced = new SyncedValue(10);
 * synced.sync(obj1, 'x');
 * synced.sync(obj2, 'width');
 * synced.value = 20; // Updates both obj1.x and obj2.width to 20
 */
class SyncedValue {
    constructor(value) {
        this._value = value;
        this.synced = [];
    }

    /**
     * Gets the current value.
     * @type {*}
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the value and updates all synced properties.
     * @type {*}
     */
    set value(value) {
        if (value == this._value) return;
        this._value = value;
        this.synced.forEach(({ parent, property }) => {
            parent[property] = value;
        });
    }

    /**
     * Syncs this value to a parent object's property.
     * The property will be updated whenever this value changes.
     * @param {Object} parent - Parent object to sync to
     * @param {string} property - Property name to sync
     */
    sync(parent, property) {
        parent[property] = this.value;
        this.synced.push({ parent, property });
    }

    /**
     * Removes sync relationship with a parent object's property.
     * @param {Object} parent - Parent object to unsync from
     * @param {string} property - Property name to unsync
     */
    unsync(parent, property) {
        parent[property] = this.value;
        const index = this.synced.indexOf({ parent, property });
        if (index === -1) return;
        this.synced.splice(index, 1);
    }
}

export default SyncedValue;
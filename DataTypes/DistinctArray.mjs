/**
 * DistinctArray maintains an array of unique values with automatic deduplication.
 * @module DataTypes/DistinctArray
 */

import Util from "../Util/Core.mjs";

/**
 * DistinctArray extends Array to automatically prevent duplicate values.
 * @class DistinctArray
 * @extends Array
 * @example
 * const arr = new DistinctArray(1, 2, 3, 2, 1);
 * // arr contains [1, 2, 3]
 */
class DistinctArray extends Array {
    /**
     * Merges multiple arrays into a new DistinctArray, removing duplicates.
     * @param {...Array} arrays - Arrays to merge
     * @returns {DistinctArray} New DistinctArray with unique values
     */
    merge(...arrays) {
        const set = new Set(this);
        arrays.forEach((array) => array.forEach((item) => set.add(item)));
        return new DistinctArray(...set);
    }

    constructor(...items) {
        super();
        this.push(...items);
    }

    push(...items) {
        const set = new Set(this);
        items.forEach((item) => set.add(item));
        this.length = 0;
        set.forEach((item) => super.push(item));
        return this.length;
    }

    remove(...items) {
        if (items.length === 0) return;
        const set = new Set(items);
        if (set.size === 0) return;
        try {
            this.splice(0, this.length, ...this.filter((item) => !set.has(item)));
        } catch (err) {
            console.error(err);
        }
    }

    has(item) {
        return this.includes(item);
    }

    index(item) {
        const idx = this.indexOf(item);
        return idx === -1 ? false : idx;
    }

    reset() {
        this.length = 0;
    }
}

export default DistinctArray;
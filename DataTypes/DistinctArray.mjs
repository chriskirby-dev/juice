import Util from "../Util/Core.mjs";

/**
 *     merge(...arrays):
        Merges multiple arrays into a new DistinctArray instance, removing duplicate values.

    constructor(items = []):
        Initializes the DistinctArray with the provided items. Duplicates are automatically removed.

    push(...items):
        Overrides the push method of Array to add items only if they are not already present in the array.

    remove(...items):
        Removes specified items from the DistinctArray.

    has(item):
        Checks if the given item exists in the DistinctArray.

    index(item):
        Returns the index of the specified item if it exists in the DistinctArray, otherwise, returns false.

    reset():
        Clears the DistinctArray.
 */

class DistinctArray extends Array {
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

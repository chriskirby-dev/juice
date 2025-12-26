/**
 * Array extension that emits events on mutations.
 * Extends native Array with event emission for push, pop, shift, unshift operations.
 * @module DataTypes/ArrayEmitter
 */

/**
 * Event-emitting array that fires events on mutation operations.
 * @class ArrayEmitter
 * @extends Array
 * @fires ArrayEmitter#push When items are pushed
 * @fires ArrayEmitter#pop When item is popped
 * @fires ArrayEmitter#shift When item is shifted
 * @fires ArrayEmitter#unshift When items are unshifted
 * @fires ArrayEmitter#get When item is accessed
 * @fires ArrayEmitter#remove When item is removed
 * @example
 * const arr = new ArrayEmitter();
 * arr.on('push', (item) => console.log('Pushed:', item));
 * arr.push(1, 2, 3);
 */
class ArrayEmitter extends Array {
    constructor(...args) {
        super(...args);
    }

    /**
     * Adds items to end and emits push event.
     * @param {...*} args - Items to add
     * @fires ArrayEmitter#push
     */
    push(...args) {
        super.push(...args);
        this.emit("push", ...args);
    }

    /**
     * Removes last item and emits pop event.
     * @returns {*} Removed item
     * @fires ArrayEmitter#pop
     */
    pop() {
        const result = super.pop(...args);
        this.emit("pop", result);
        return result;
    }

    /**
     * Removes first item and emits shift event.
     * @returns {*} Removed item
     * @fires ArrayEmitter#shift
     */
    shift() {
        const result = super.shift(...args);
        this.emit("shift", result);
        return result;
    }

    /**
     * Adds items to beginning and emits unshift event.
     * @param {...*} args - Items to add
     * @fires ArrayEmitter#unshift
     */
    unshift(...args) {
        super.unshift(...args);
        this.emit("unshift", ...args);
    }

    /**
     * Gets item at index and emits get event.
     * @param {number} index - Array index
     * @returns {*} Item at index
     * @fires ArrayEmitter#get
     */
    get(index) {
        const result = super.get(index);
        this.emit("get", index, result);
        return result;
    }

    /**
     * Removes item at index and emits remove event.
     * @param {number} index - Array index
     * @returns {*} Removed item
     * @fires ArrayEmitter#remove
     */
    remove(index) {
        const result = super.remove(index);
        this.emit("remove", index, result);
        return result;
    }
}
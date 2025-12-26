/**
 * CircularBuffer provides a fixed-size buffer with automatic wraparound.
 * When full, new elements overwrite the oldest elements.
 * Supports push, pop, shift, unshift operations like arrays.
 * @module DataTypes/CircularBuffer
 */

/**
 * Fixed-size circular buffer that overwrites oldest elements when full.
 * @class CircularBuffer
 * @param {number} size - Maximum buffer capacity
 * @example
 * const buffer = new CircularBuffer(3);
 * buffer.push(1);
 * buffer.push(2);
 * buffer.push(3);
 * buffer.push(4); // Overwrites 1
 * console.log(buffer.first); // 2
 */
class CircularBuffer {
    constructor(size) {
        this.size = size;
        this.buffer = new Array(size);
        this.head = 0; // Index to insert new elements
        this.tail = 0; // Index to remove elements
        this.length = 0; // Number of elements currently in the buffer
    }

    /**
     * Gets the most recently added element.
     * @type {*}
     */
    get last() {
        return this.buffer[this._last];
    }

    /**
     * Gets the oldest element in the buffer.
     * @type {*}
     */
    get first() {
        return this.buffer[this._first];
    }

    /**
     * Adds element to the end (most recent).
     * Overwrites oldest element if buffer is full.
     * @param {*} element - Element to add
     */
    push(element) {
        if (this.length === this.size) {
            // Buffer is full, overwrite the oldest element
            this.tail = (this.tail + 1) % this.size;
        } else {
            this.length++;
        }
        this.buffer[this.head] = element;
        this._last = this.head;
        this.head = (this.head + 1) % this.size;
    }

    /**
     * Removes and returns element from the end (most recent).
     * @returns {*|undefined} The removed element or undefined if empty
     */
    pop() {
        if (this.length === 0) return undefined; // Buffer is empty

        this.head = (this.head - 1 + this.size) % this.size;
        const element = this.buffer[this.head];
        this.length--;
        return element;
    }

    /**
     * Removes and returns element from the beginning (oldest).
     * @returns {*|undefined} The removed element or undefined if empty
     */
    shift() {
        if (this.length === 0) return undefined; // Buffer is empty

        const element = this.buffer[this.tail];
        this.tail = (this.tail + 1) % this.size;
        this.length--;
        return element;
    }

    /**
     * Adds element to the beginning (becomes oldest).
     * Overwrites newest element if buffer is full.
     * @param {*} element - Element to add
     */
    unshift(element) {
        if (this.length === this.size) {
            // Buffer is full, overwrite the oldest element
            this.tail = (this.tail + 1) % this.size;
        } else {
            this.length++;
        }
        this.tail = (this.tail - 1 + this.size) % this.size;
        this.buffer[this.tail] = element;
        this._first = this.tail;
    }

    // Get element at a specific index
    get(index) {
        if (index < 0 || index >= this.count) return undefined; // Index out of bounds

        // Calculate the position in the circular buffer
        const actualIndex = (this.tail + index) % this.size;
        return this.buffer[actualIndex];
    }

    // Print buffer contents
    print() {
        const result = [];
        for (let i = 0; i < this.length; i++) {
            result.push(this.buffer[(this.tail + i) % this.size]);
        }
        console.log(result);
    }
}
/*
// Example usage
const cb = new CircularBuffer(3);

cb.push(1);
cb.push(2);
cb.push(3);
cb.print(); // Output: [1, 2, 3]

cb.push(4);
cb.print(); // Output: [2, 3, 4] - 1 was overwritten

cb.pop();
cb.print(); // Output: [2, 4]

cb.unshift(5);
cb.print(); // Output: [5, 2, 4]

cb.shift();
cb.print(); // Output: [2, 4]
*/

export default CircularBuffer;
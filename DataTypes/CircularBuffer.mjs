class CircularBuffer {
    constructor(size) {
        this.size = size;
        this.buffer = new Array(size);
        this.head = 0; // Index to insert new elements
        this.tail = 0; // Index to remove elements
        this.length = 0; // Number of elements currently in the buffer
    }

    get last() {
        return this.buffer[this._last];
    }

    get first() {
        return this.buffer[this._first];
    }

    // Push (add to the end)
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

    // Pop (remove from the end)
    pop() {
        if (this.length === 0) return undefined; // Buffer is empty

        this.head = (this.head - 1 + this.size) % this.size;
        const element = this.buffer[this.head];
        this.length--;
        return element;
    }

    // Shift (remove from the beginning)
    shift() {
        if (this.length === 0) return undefined; // Buffer is empty

        const element = this.buffer[this.tail];
        this.tail = (this.tail + 1) % this.size;
        this.length--;
        return element;
    }

    // Unshift (add to the beginning)
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
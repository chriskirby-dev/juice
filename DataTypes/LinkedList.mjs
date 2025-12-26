/**
 * LinkedList data structure implementation.
 * Provides a singly-linked list with standard operations like push, pop, shift, and unshift.
 * @module DataTypes/LinkedList
 */

/**
 * Node represents a single element in the LinkedList.
 * @class Node
 * @private
 */
class Node {
    /**
     * Creates a new Node.
     * @param {*} value - The value to store in the node
     */
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

/**
 * LinkedList provides a singly-linked list data structure.
 * @class LinkedList
 * @example
 * const list = new LinkedList();
 * list.push('first');
 * list.push('second');
 * const value = list.pop(); // 'second'
 */
class LinkedList {
    /**
     * Creates a new LinkedList.
     */
    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    /**
     * Gets the node at the specified index.
     * @param {number} i - The index to retrieve
     * @returns {Node|null} The node at the index, or null if not found
     */
    index(i) {
        let current = this.head;
        let count = 0;
        while (current) {
            if (count === i) {
                return current;
            }
            count++;
            current = current.next;
        }
        return null;
    }

    /**
     * Appends a value to the end of the list.
     * @param {*} value - The value to append
     */
    push(value) {
        const newNode = new Node(value);
        if (this.tail) {
            this.tail.next = newNode;
        } else {
            this.head = newNode;
        }
        this.tail = newNode;
        this.size++;
    }

    /**
     * Removes and returns the last value from the list.
     * @returns {*} The removed value, or null if list is empty
     */
    pop() {
        if (!this.head) return null;

        let current = this.head;
        let previous = null;

        while (current.next) {
            previous = current;
            current = current.next;
        }

        if (previous) {
            previous.next = null;
            this.tail = previous;
        } else {
            this.head = this.tail = null;
        }

        this.size--;
        return current.value;
    }

    // Insert (insert at a specific position)
    insert(index, value) {
        if (index < 0 || index > this.size) return;

        const newNode = new Node(value);

        if (index === 0) {
            newNode.next = this.head;
            this.head = newNode;
            if (!this.tail) this.tail = newNode;
        } else {
            let current = this.head;
            let previous = null;
            let i = 0;

            while (i < index) {
                previous = current;
                current = current.next;
                i++;
            }

            previous.next = newNode;
            newNode.next = current;
            if (!newNode.next) this.tail = newNode;
        }

        this.size++;
    }

    // Splice (remove elements and insert new elements)
    splice(start, deleteCount, ...items) {
        if (start < 0 || start >= this.size) return;

        let current = this.head;
        let previous = null;
        let i = 0;

        while (i < start) {
            previous = current;
            current = current.next;
            i++;
        }

        while (deleteCount-- > 0 && current) {
            current = current.next;
            this.size--;
        }

        if (previous) {
            previous.next = current;
        } else {
            this.head = current;
        }

        for (const item of items) {
            const newNode = new Node(item);
            newNode.next = current;
            if (previous) {
                previous.next = newNode;
            } else {
                this.head = newNode;
            }
            previous = newNode;
            this.size++;
        }
    }

    // Print list
    print() {
        let current = this.head;
        const result = [];
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        console.log(result.join(" -> "));
    }
}

class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}

class DoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    // Push (append to the end)
    push(value) {
        const newNode = new Node(value);
        if (this.tail) {
            this.tail.next = newNode;
            newNode.prev = this.tail;
            this.tail = newNode;
        } else {
            this.head = this.tail = newNode;
        }
        this.size++;
    }

    // Pop (remove from the end)
    pop() {
        if (!this.tail) return null;

        const value = this.tail.value;
        if (this.head === this.tail) {
            this.head = this.tail = null;
        } else {
            this.tail = this.tail.prev;
            this.tail.next = null;
        }
        this.size--;
        return value;
    }

    // Insert (insert at a specific position)
    insert(index, value) {
        if (index < 0 || index > this.size) return;

        const newNode = new Node(value);

        if (index === 0) {
            if (this.head) {
                newNode.next = this.head;
                this.head.prev = newNode;
                this.head = newNode;
            } else {
                this.head = this.tail = newNode;
            }
        } else if (index === this.size) {
            this.push(value);
            return;
        } else {
            let current = this.head;
            let i = 0;

            while (i < index) {
                current = current.next;
                i++;
            }

            newNode.prev = current.prev;
            newNode.next = current;
            if (current.prev) {
                current.prev.next = newNode;
            }
            current.prev = newNode;
            if (current === this.head) {
                this.head = newNode;
            }
        }

        this.size++;
    }

    // Splice (remove elements and insert new elements)
    splice(start, deleteCount, ...items) {
        if (start < 0 || start >= this.size) return;

        let current = this.head;
        let i = 0;

        while (i < start) {
            current = current.next;
            i++;
        }

        // Remove elements
        let firstPart = current.prev;
        while (deleteCount-- > 0 && current) {
            current = current.next;
            this.size--;
        }
        if (firstPart) {
            firstPart.next = current;
        } else {
            this.head = current;
        }
        if (current) {
            current.prev = firstPart;
        } else {
            this.tail = firstPart;
        }

        // Insert new elements
        let prevNode = firstPart ? firstPart : this.head;
        for (const item of items) {
            const newNode = new Node(item);
            newNode.next = current;
            newNode.prev = prevNode;
            if (prevNode) {
                prevNode.next = newNode;
            } else {
                this.head = newNode;
            }
            if (current) {
                current.prev = newNode;
            } else {
                this.tail = newNode;
            }
            prevNode = newNode;
            this.size++;
        }
    }

    // Print list forward
    printForward() {
        let current = this.head;
        const result = [];
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        console.log(result.join(" <-> "));
    }

    // Print list backward
    printBackward() {
        let current = this.tail;
        const result = [];
        while (current) {
            result.push(current.value);
            current = current.prev;
        }
        console.log(result.join(" <-> "));
    }
}
/*
// Example usage
const dll = new DoublyLinkedList();
dll.push(1);
dll.push(2);
dll.push(3);
dll.printForward(); // Output: 1 <-> 2 <-> 3

dll.pop();
dll.printForward(); // Output: 1 <-> 2

dll.insert(1, 5);
dll.printForward(); // Output: 1 <-> 5 <-> 2

dll.splice(1, 1, 8, 9);
dll.printForward(); // Output: 1 <-> 8 <-> 9 <-> 2


// Example usage
const sll = new SinglyLinkedList();
sll.push(1);
sll.push(2);
sll.push(3);
sll.print(); // Output: 1 -> 2 -> 3

sll.pop();
sll.print(); // Output: 1 -> 2

sll.insert(1, 5);
sll.print(); // Output: 1 -> 5 -> 2

sll.splice(1, 1, 8, 9);
sll.print(); // Output: 1 -> 8 -> 9 -> 2
*/
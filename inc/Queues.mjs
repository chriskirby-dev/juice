/**
 * JuiceQueue represents a single queue with sequential item access.
 * Provides methods to iterate through items one by one or in batches.
 * @class JuiceQueue
 * @example
 * const queue = new JuiceQueue('tasks');
 * queue.items = [1, 2, 3];
 * queue.next(); // returns 1
 */
class JuiceQueue {
    index = -1;
    items = [];
    
    /**
     * Creates a new JuiceQueue with the given name.
     * @param {string} name - The name of the queue
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * Checks if the queue is empty (no more items to process).
     * @returns {boolean} True if there are no more items
     */
    get empty() {
        return this.items.length <= this.index + 1;
    }

    /**
     * Gets the next item in the queue and advances the index.
     * @returns {*} The next item in the queue
     */
    next() {
        this.index++;
        return this.items[this.index];
    }

    /**
     * Gets the last processed item (one position behind current index).
     * @returns {*} The previously processed item
     */
    last() {
        return this.items[this.index - 1];
    }

    /**
     * Gets the next batch of items from the queue.
     * @param {number} count - Number of items to retrieve in the batch
     * @returns {Array} Array of items in the batch
     */
    batch(count) {
        this.index++;
        const start = this.index;
        const end = this.index + count;
        this.index += count;
        return this.items.slice(start, end);
    }

    /**
     * Iterates through each item in the queue, calling the provided function.
     * @param {string} queueName - The name of the queue (not used in current implementation)
     * @param {Function} fn - Function to call for each item
     */
    each(queueName, fn) {
        function nextItem() {
            fn(this.next(queueName));
        }
    }

    /**
     * Resets the queue by clearing all items and resetting the index.
     */
    reset() {
        this.index = -1;
        this.items = [];
    }
}

/**
 * JuiceQueues manages multiple named queues.
 * Provides a centralized way to create, access, and remove queues.
 * @class JuiceQueues
 * @example
 * const queues = new JuiceQueues();
 * queues.create('tasks');
 * const taskQueue = queues.use('tasks');
 */
class JuiceQueues {
    queues = {};
    
    /**
     * Creates a new JuiceQueues manager instance.
     */
    constructor() {}

    /**
     * Gets a queue by name.
     * @param {string} queueName - The name of the queue to retrieve
     * @returns {Array|undefined} The queue array, or undefined if it doesn't exist
     */
    use(queueName) {
        return this.queues[queueName];
    }

    /**
     * Removes a queue by name.
     * @param {string} queueName - The name of the queue to remove
     */
    remove(queueName) {
        delete this.queues[queueName];
    }

    /**
     * Creates a new empty queue with the given name.
     * @param {string} queueName - The name of the queue to create
     */
    create(queueName) {
        this.queues[queueName] = [];
    }
}

export default JuiceQueues;

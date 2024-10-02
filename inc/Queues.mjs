class JuiceQueue {
    index = -1;
    items = [];
    constructor(name) {
        this.name = name;
    }

    get empty() {
        return this.items.length <= this.index + 1;
    }

    next() {
        this.index++;
        return this.items[this.index];
    }

    last() {
        return this.items[this.index - 1];
    }

    batch(count) {
        this.index++;
        const start = this.index;
        const end = this.index + count;
        this.index += count;
        return this.items.slice(start, end);
    }

    each(queueName, fn) {
        function nextItem() {
            fn(this.next(queueName));
        }
    }

    reset() {
        this.index = -1;
        this.items = [];
    }
}

class JuiceQueues {
    queues = {};
    constructor() {}

    use(queueName) {
        return this.queues[queueName];
    }

    remove(queueName) {
        delete this.queues[queueName];
    }

    create(queueName) {
        this.queues[queueName] = [];
    }
}

export default JuiceQueues;

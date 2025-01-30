class ArrayEmitter extends Array {
    constructor(...args) {
        super(...args);
    }

    push(...args) {
        super.push(...args);
        this.emit("push", ...args);
    }

    pop() {
        const result = super.pop(...args);
        this.emit("pop", result);
        return result;
    }

    shift() {
        const result = super.shift(...args);
        this.emit("shift", result);
        return result;
    }

    unshift(...args) {
        super.unshift(...args);
        this.emit("unshift", ...args);
    }

    get(index) {
        const result = super.get(index);
        this.emit("get", index, result);
        return result;
    }

    remove(index) {
        const result = super.remove(index);
        this.emit("remove", index, result);
        return result;
    }
}

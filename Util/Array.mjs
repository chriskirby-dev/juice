export class Cursor {
    index = -1;
    constructor(arr) {
        this.arr = arr;
        this.index = 0;
    }

    first(moveCursor) {
        if (moveCursor) this.index = 0;
        return this.arr[0];
    }

    current() {
        return this.arr[this.index];
    }

    next() {
        return this.arr[this.index++];
    }

    hasNext() {
        return this.index < this.arr.length;
    }

    last(moveCursor) {
        if (moveCursor) this.index = this.arr.length - 1;
        return this.arr[this.arr.length - 1];
    }

    reset() {
        this.index = 0;
    }
}

export function last(arr) {
    return arr[arr.length - 1];
}

export function first(arr) {
    return arr[0];
}

export function intersect(arr1, arr2) {
    return arr1.filter((value) => -1 !== arr2.indexOf(value));
}

export function distinct(arr1, arr2) {
    return arr1.filter((value) => -1 === arr2.indexOf(value));
}

export function merge(a, b) {
    const merged = a.slice(0);
    for (let i = 0; i < b.length; i++) {
        if (merged.indexOf(b[i]) === -1) {
            merged.push(b[i]);
        }
    }
    return merged;
}

export function equal(a, b) {
    a = a.slice().sort();
    b = b.slice().sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

class ArrUtil {
    static diff(a, b) {
        return {
            added: b.filter((i) => !a.includes(i)),
            removed: a.filter((i) => !b.includes(i)),
        };
    }

    static first(arr) {
        return arr[0];
    }

    static last(arr) {
        return arr[arr.length - 1];
    }
    static intersect(arr1, arr2) {
        return arr1.filter((value) => -1 !== arr2.indexOf(value));
    }

    static distinct(arr1, arr2) {
        return arr1.filter((value) => -1 === arr2.indexOf(value));
    }

    static merge(a, b) {
        const merged = a.slice(0);
        for (let i = 0; i < b.length; i++) {
            if (merged.indexOf(b[i]) === -1) {
                merged.push(b[i]);
            }
        }
        return merged;
    }

    static equal(a, b) {
        a = a.slice().sort();
        b = b.slice().sort();
        if (a.length !== b.length) return false;
        var i = a.length;
        while (i--) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    static contains(a, b) {
        let i = b.length;
        while (i--) {
            if (a.indexOf(b[i]) === -1) return false;
        }
        return true;
    }

    static indexesOf(value, arr) {
        const indexes = [];
        let i = -1;
        for (i = 0; i < arr.length; i++) {
            if (arr[i] === value) indexes.push(i);
        }
        return indexes;
    }

    static pluck(prop, arr) {
        return arr.map((item) => item[prop]);
    }

    static hasFunction(arr) {
        return arr.map((item) => typeof item == "function").filter((bool) => bool == true).length > 0;
    }

    static equalValues(arr) {
        return arr.every((v) => v === arr[0]);
    }
}

export default ArrUtil;

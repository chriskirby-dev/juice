/**
 * Cursor class provides an iterator-like interface for traversing arrays.
 * Maintains an internal index for sequential access to array elements.
 * @class Cursor
 * @example
 * const cursor = new Cursor([1, 2, 3]);
 * cursor.next(); // 1
 * cursor.next(); // 2
 */
export class Cursor {
    index = -1;
    
    /**
     * Creates a new Cursor for the given array.
     * @param {Array} arr - The array to create a cursor for
     */
    constructor(arr) {
        this.arr = arr;
        this.index = 0;
    }

    /**
     * Gets the first element of the array.
     * @param {boolean} [moveCursor=false] - Whether to move the cursor to the first position
     * @returns {*} The first element in the array
     */
    first(moveCursor) {
        if (moveCursor) this.index = 0;
        return this.arr[0];
    }

    /**
     * Gets the element at the current cursor position.
     * @returns {*} The current element
     */
    current() {
        return this.arr[this.index];
    }

    /**
     * Gets the current element and advances the cursor.
     * @returns {*} The current element before advancing
     */
    next() {
        return this.arr[this.index++];
    }

    /**
     * Checks if there are more elements after the current position.
     * @returns {boolean} True if there are more elements
     */
    hasNext() {
        return this.index < this.arr.length;
    }

    /**
     * Gets the last element of the array.
     * @param {boolean} [moveCursor=false] - Whether to move the cursor to the last position
     * @returns {*} The last element in the array
     */
    last(moveCursor) {
        if (moveCursor) this.index = this.arr.length - 1;
        return this.arr[this.arr.length - 1];
    }

    /**
     * Resets the cursor to the beginning of the array.
     */
    reset() {
        this.index = 0;
    }
}

/**
 * Returns the last element of an array.
 * @param {Array} arr - The array to get the last element from
 * @returns {*} The last element
 * @example
 * last([1, 2, 3]) // returns 3
 */
export function last(arr) {
    return arr[arr.length - 1];
}

/**
 * Returns the first element of an array.
 * @param {Array} arr - The array to get the first element from
 * @returns {*} The first element
 * @example
 * first([1, 2, 3]) // returns 1
 */
export function first(arr) {
    return arr[0];
}

/**
 * Returns the intersection of two arrays (elements present in both).
 * @param {Array} arr1 - The first array
 * @param {Array} arr2 - The second array
 * @returns {Array} Array of elements present in both arrays
 * @example
 * intersect([1, 2, 3], [2, 3, 4]) // returns [2, 3]
 */
export function intersect(arr1, arr2) {
    return arr1.filter((value) => -1 !== arr2.indexOf(value));
}

/**
 * Counts how many times a value appears in an array.
 * @param {Array} a - The array to search
 * @param {*} v - The value to count
 * @returns {number} The number of occurrences
 * @example
 * countOccurrences([1, 2, 2, 3], 2) // returns 2
 */
export function countOccurrences(a, v) {
    return a.reduce((count, val) => (val === v ? count + 1 : count), 0);
}

/**
 * Returns an array of distinct values from one or more arrays (removes duplicates).
 * @param {...Array} arrays - One or more arrays to process
 * @returns {Array} Array with only unique values
 * @example
 * distinct([1, 2, 2], [2, 3, 3]) // returns [1, 2, 3]
 */
export function distinct(...arrays) {
    const arr = [].concat(...arrays);
    return arr.filter((value, index) => arr.indexOf(value) === index);
}

/**
 * Merges two arrays, adding only unique elements from the second array.
 * @param {Array} a - The first array
 * @param {Array} b - The second array
 * @returns {Array} Merged array with unique elements
 * @example
 * merge([1, 2], [2, 3]) // returns [1, 2, 3]
 */
export function merge(a, b) {
    const merged = a.slice(0);
    for (let i = 0; i < b.length; i++) {
        if (merged.indexOf(b[i]) === -1) {
            merged.push(b[i]);
        }
    }
    return merged;
}

/**
 * Checks if two arrays are equal (same elements in same order after sorting).
 * @param {Array} a - The first array
 * @param {Array} b - The second array
 * @returns {boolean} True if arrays are equal
 * @example
 * equal([1, 2, 3], [3, 2, 1]) // returns true
 */
export function equal(a, b) {
    a = a.slice().sort();
    b = b.slice().sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * ArrUtil provides static utility methods for array operations.
 * @class ArrUtil
 */
class ArrUtil {
    /**
     * Compares two arrays and returns the differences (added and removed elements).
     * @param {Array} a - The original array
     * @param {Array} b - The new array to compare against
     * @returns {{added: Array, removed: Array}} Object with added and removed elements
     * @static
     * @example
     * ArrUtil.diff([1, 2], [2, 3]) // returns {added: [3], removed: [1]}
     */
    static diff(a, b) {
        return {
            added: b.filter((i) => !a.includes(i)),
            removed: a.filter((i) => !b.includes(i)),
        };
    }

    /**
     * Returns the first element of an array.
     * @param {Array} arr - The array
     * @returns {*} The first element
     * @static
     */
    static first(arr) {
        return arr[0];
    }

    /**
     * Returns the last element of an array.
     * @param {Array} arr - The array
     * @returns {*} The last element
     * @static
     */
    static last(arr) {
        return arr[arr.length - 1];
    }
    
    /**
     * Returns the intersection of two arrays (elements present in both).
     * @param {Array} arr1 - The first array
     * @param {Array} arr2 - The second array
     * @returns {Array} Array of common elements
     * @static
     */
    static intersect(arr1, arr2) {
        return arr1.filter((value) => -1 !== arr2.indexOf(value));
    }

    /**
     * Returns elements that are in the first array but not in the second.
     * @param {Array} arr1 - The first array
     * @param {Array} arr2 - The second array
     * @returns {Array} Array of distinct elements
     * @static
     */
    static distinct(arr1, arr2) {
        return arr1.filter((value) => -1 === arr2.indexOf(value));
    }

    /**
     * Merges two arrays, adding only unique elements from the second array.
     * @param {Array} a - The first array
     * @param {Array} b - The second array
     * @returns {Array} Merged array
     * @static
     */
    static merge(a, b) {
        const merged = a.slice(0);
        for (let i = 0; i < b.length; i++) {
            if (merged.indexOf(b[i]) === -1) {
                merged.push(b[i]);
            }
        }
        return merged;
    }

    /**
     * Checks if two arrays are equal (same elements in same order after sorting).
     * @param {Array} a - The first array
     * @param {Array} b - The second array
     * @returns {boolean} True if arrays are equal
     * @static
     */
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

    /**
     * Checks if array 'a' contains all elements from array 'b'.
     * @param {Array} a - The array to check
     * @param {Array} b - The elements to look for
     * @returns {boolean} True if all elements of b are in a
     * @static
     */
    static contains(a, b) {
        let i = b.length;
        while (i--) {
            if (a.indexOf(b[i]) === -1) return false;
        }
        return true;
    }

    /**
     * Returns all indexes where a value appears in an array.
     * @param {*} value - The value to search for
     * @param {Array} arr - The array to search in
     * @returns {Array<number>} Array of indexes where value was found
     * @static
     * @example
     * ArrUtil.indexesOf(2, [1, 2, 3, 2]) // returns [1, 3]
     */
    static indexesOf(value, arr) {
        const indexes = [];
        let i = -1;
        for (i = 0; i < arr.length; i++) {
            if (arr[i] === value) indexes.push(i);
        }
        return indexes;
    }

    /**
     * Extracts a specific property from all objects in an array.
     * @param {string} prop - The property name to extract
     * @param {Array<Object>} arr - Array of objects
     * @returns {Array} Array of property values
     * @static
     * @example
     * ArrUtil.pluck('name', [{name: 'John'}, {name: 'Jane'}]) // returns ['John', 'Jane']
     */
    static pluck(prop, arr) {
        return arr.map((item) => item[prop]);
    }

    /**
     * Checks if an array contains at least one function.
     * @param {Array} arr - The array to check
     * @returns {boolean} True if array contains a function
     * @static
     */
    static hasFunction(arr) {
        return arr.map((item) => typeof item == "function").filter((bool) => bool == true).length > 0;
    }

    /**
     * Checks if all elements in an array are equal to each other.
     * @param {Array} arr - The array to check
     * @returns {boolean} True if all elements are equal
     * @static
     * @example
     * ArrUtil.equalValues([1, 1, 1]) // returns true
     * ArrUtil.equalValues([1, 2, 1]) // returns false
     */
    static equalValues(arr) {
        return arr.every((v) => v === arr[0]);
    }
}

export default ArrUtil;
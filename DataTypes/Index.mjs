/**
 * Creates an index of an array of objects by a given property.
 * This index allows you to quickly look up an item by its property value.
 * @param {Array} array The array of objects.
 * @param {String} property The name of the property in the objects.
 * @returns {Map} A map where the keys are the property values and the values are the indexes of the items in the array.
 */
export function propertyIndex(array, property) {
    const index = new Map();

    array.forEach((item, i) => {
        if (item[property] !== undefined) {
            /**
             * Add the property value as a key and the index of the item as the value.
             * This way, you can quickly look up an item by its property value.
             */
            index.set(item[property], i);
        }
    });

    return index;
}

/**
 * Returns an array of sorted indexes based on the value of a given property
 * in each object of the input array.
 *
 * @param {Array} array - The input array of objects.
 * @param {string} property - The property to sort the array by.
 * @param {string} direction - The direction to sort the array ('asc' or 'desc'). Defaults to 'asc'.
 * @return {Array} - An array of sorted indexes.
 *
 */
export function sortedIndex(array, property, direction = "asc") {
    // Create an array of indexes
    const indexArray = array.map((_, i) => i); // indexArray = [0, 1, 2, ...]

    // Sort the indexes based on the value of the specified property
    indexArray.sort((a, b) => {
        // Get the values of the specified property for indexes a and b
        const propA = array[a][property];
        const propB = array[b][property];

        // Compare the property values and return -1, 0, or 1
        // If propA is less than propB and the direction is 'asc', return -1
        // If propA is greater than propB and the direction is 'desc', return -1
        // If propA is less than propB, return -1
        // If propA is equal to propB, return 0
        // If propA is less than propB and the direction is 'desc', return 1
        // If propA is greater than propB and the direction is 'asc', return 1
        return direction === "asc"
            ? propA < propB
                ? -1
                : propA > propB
                ? 1
                : 0
            : propA < propB
            ? 1
            : propA > propB
            ? -1
            : 0;
        // If propA is greater than propB, return 1
        return propA < propB ? -1 : propA > propB ? 1 : 0;
    });

    return indexArray; // Returns an array of sorted indexes
}

/**
 * Creates an inverted index from an array of objects based on a given property.
 *
 * @param {Array} array - The input array of objects.
 * @param {string} property - The property to create the index on.
 * @return {Map} - A map where the keys are the values of the specified property and
 * the values are arrays of indexes of the items in the array that have that value.
 */
export function createInvertedIndex(array, property) {
    const index = new Map();

    // Iterate over each item in the array
    array.forEach((item, i) => {
        const value = item[property];

        // If the value is an array, add each item to the index
        if (Array.isArray(value)) {
            value.forEach((v) => {
                // If the value doesn't exist in the index, create an empty array for it
                if (!index.has(v)) {
                    index.set(v, []);
                }
                // Add the current item's index to the array of indexes for the value
                index.get(v).push(i);
            });
        } else {
            // If the value isn't an array, add it to the index with its index
            if (!index.has(value)) {
                index.set(value, []);
            }
            index.get(value).push(i);
        }
    });

    return index;
}

/**
 * Performs a binary search on a sorted array of objects based on a specified property.
 *
 * @param {Array} array - The sorted array of objects.
 * @param {string} property - The property to search on.
 * @param {*} value - The value to search for.
 * @param {Array} indexArray - The array of indexes to search within.
 * @return {number} - The index of the object with the specified property value, or -1 if not found.
 */
export function binarySearch(array, property, value, indexArray) {
    // Initialize the left and right indices of the search range.
    let left = 0;
    let right = indexArray.length - 1;

    // Continue searching until the left index is greater than the right index.
    while (left <= right) {
        // Calculate the midpoint of the search range.
        const mid = Math.floor((left + right) / 2);

        // Get the value of the specified property at the midpoint of the search range.
        const midValue = array[indexArray[mid]][property];

        // If the midpoint value matches the search value, return its index.
        if (midValue === value) {
            return indexArray[mid];
        }
        // If the midpoint value is less than the search value, update the left index to search the right half.
        else if (midValue < value) {
            left = mid + 1;
        }
        // If the midpoint value is greater than the search value, update the right index to search the left half.
        else {
            right = mid - 1;
        }
    }

    // If the search value was not found, return -1.
    return -1;
}

/**
 * Usage example with a sorted index
const sortedIndexById = createSortedIndexByProperty(array, 'id');
const index = binarySearch(array, 'id', 2, sortedIndexById);
console.log(index); // Outputs: 2 (index of the object with id 2)
 */

class TrieNode {
    constructor() {
        this.children = {};
        this.indexes = [];
    }
}

export class TrieIndex {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word, index) {
        let node = this.root;
        for (const char of word) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
            node.indexes.push(index);
        }
    }

    search(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if (!node.children[char]) {
                return [];
            }
            node = node.children[char];
        }
        return node.indexes;
    }
}

/**
Usage example
const array = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
];

const trie = new Trie();
array.forEach((item, i) => {
    trie.insert(item.name.toLowerCase(), i);
});

const indexes = trie.search('al'); // Outputs: [0] (index of 'Alice')
console.log(indexes);

*/

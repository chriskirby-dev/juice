import Util from '../Util/Core.mjs';

/**
 *     merge(...arrays):
        Merges multiple arrays into a new DistinctArray instance, removing duplicate values.

    constructor(items = []):
        Initializes the DistinctArray with the provided items. Duplicates are automatically removed.

    push(...items):
        Overrides the push method of Array to add items only if they are not already present in the array.

    remove(...items):
        Removes specified items from the DistinctArray.

    has(item):
        Checks if the given item exists in the DistinctArray.

    index(item):
        Returns the index of the specified item if it exists in the DistinctArray, otherwise, returns false.

    reset():
        Clears the DistinctArray.
 */

class DistinctArray extends Array {

    merge(...arrays) {
        return new DistinctArray(...[].concat(...arrays));
    }

    constructor(items = []) {
        super(...items);
    }

    push( ...items ){
        items.forEach( item => { if( !this.has(item) ) super.push( item ) } );
        return this.length;
    }

    remove(...items) {
        this.splice(0, this.length, ...this.filter(item => !items.includes(item)));
    }

    has(item) {
        return this.includes(item);
    }

    index(item){
        const idx =  this.indexOf(item);
        return idx === -1 ? false : idx;
    }

    reset() {
        this.splice(0, this.length);
    }
}


export default DistinctArray;

/**
 * Typed array wrapper for storing objects with named properties efficiently.
 * Uses Float32Array or Uint32Array for memory-efficient storage of structured data.
 * @module DataTypes/PropertyArray
 */

/**
 * Array structure storing objects as typed arrays with named properties.
 * Optimized for storing many objects with same property structure.
 * @class PropertyArray
 * @param {number} [count=0] - Number of elements
 * @param {Array<string>} [props=[]] - Property names
 * @param {string} [type='float'] - Array type ('float' or 'uint')
 * @example
 * const particles = new PropertyArray(1000, ['x', 'y', 'vx', 'vy'], 'float');
 * particles.setMap({ x: 100, y: 200, vx: 1, vy: 2 }, 0);
 * console.log(particles.getMap(0)); // { x: 100, y: 200, vx: 1, vy: 2 }
 */
class PropertyArray {
    constructor(count = 0, props = [], type = "float") {
        this.count = count;
        this.props = props;
        this.spread = props.length;
        this.values = type === "float" ? new Float32Array(count * props.length) : new Uint32Array(count * props.length);
    }

    /**
     * Gets number of elements.
     * @type {number}
     */
    get length() {
        return this.values.length / this.props.length;
    }

    /**
     * Sets values from array at index.
     * @param {Array<number>} [a=[]] - Values array
     * @param {number} [i=0] - Element index
     * @param {number} [offset=0] - Property offset
     */
    set(a = [], i = 0, offset = 0) {
        i = i * this.spread + offset;
        if (i < 0 || i >= this.values.length) throw new RangeError(`Index ${i} out of bounds which is ${this.count}`);
        this.values.set(a, i);
    }

    /**
     * Sets values from object at index.
     * @param {Object} [o={}] - Object with property values
     * @param {number} [i=0] - Element index
     */
    setMap(o = {}, i = 0) {
        this.set(
            this.props.map((p) => o[p] || 0),
            i
        );
    }

    /**
     * Gets values array at index.
     * @param {number} [i=0] - Element index
     * @returns {Float32Array|Uint32Array} Values subarray
     */
    get(i = 0) {
        if (i < 0 || i >= this.length) throw new RangeError(`Index ${i} out of bounds which is ${this.count}`);
        const start = i * this.spread;
        return this.values.subarray(start, start + this.spread);
    }

    /**
     * Gets values as object at index.
     * @param {number} [i=0] - Element index
     * @returns {Object} Object with named properties
     */
    getMap(i = 0) {
        return this.get(i).reduce((r, v, idx) => {
            r[this.props[idx]] = v;
            return r;
        }, {});
    }

    /**
     * Iterates over all elements.
     * @param {Function} cb - Callback (value, index, array)
     */
    forEach(cb) {
        for (let i = 0; i < this.length; i++) {
            cb(this.get(i), i, this);
        }
    }

    /**
     * Maps and updates all elements in place.
     * @param {Function} cb - Callback returning new values
     */
    map(cb) {
        for (let i = 0; i < this.length; i++) {
            this.set(cb(this.get(i), i, this), i);
        }
    }

    /**
     * Async generator for reading elements.
     * @yields {{index: number, value: Float32Array|Uint32Array}}
     */
    async *read() {
        for (let i = 0; i < this.length; i++) {
            yield { index: i, value: this.get(i) };
        }
    }
}

export default PropertyArray;
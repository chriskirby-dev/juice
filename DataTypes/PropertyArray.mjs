class PropertyArray {
    constructor(count = 0, props = [], type = "float") {
        this.count = count;
        this.props = props;
        this.spread = props.length;
        this.values = type === "float" ? new Float32Array(count * props.length) : new Uint32Array(count * props.length);
    }

    get length() {
        return this.values.length / this.props.length;
    }

    set(a = [], i = 0, offset = 0) {
        i = i * this.spread + offset;
        if (i < 0 || i >= this.values.length) throw new RangeError(`Index ${i} out of bounds which is ${this.count}`);
        this.values.set(a, i);
    }

    setMap(o = {}, i = 0) {
        this.set(
            this.props.map((p) => o[p] || 0),
            i
        );
    }

    get(i = 0) {
        if (i < 0 || i >= this.length) throw new RangeError(`Index ${i} out of bounds which is ${this.count}`);
        const start = i * this.spread;
        return this.values.subarray(start, start + this.spread);
    }

    getMap(i = 0) {
        return this.get(i).reduce((r, v, idx) => {
            r[this.props[idx]] = v;
            return r;
        }, {});
    }

    forEach(cb) {
        for (let i = 0; i < this.length; i++) {
            cb(this.get(i), i, this);
        }
    }

    map(cb) {
        for (let i = 0; i < this.length; i++) {
            this.set(cb(this.get(i), i, this), i);
        }
    }

    async *read() {
        for (let i = 0; i < this.length; i++) {
            yield { index: i, value: this.get(i) };
        }
    }
}

export default PropertyArray;

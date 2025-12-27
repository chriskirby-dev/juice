/**
 * Canvas pixel data processor.
 * Extracts and processes pixel data from canvas for analysis.
 * @module Graphics/Canvas/Pixels
 */

/**
 * Pixel data processor for canvas operations.
 * @class CanvasPixels
 */
class CanvasPixels {
    constructor(canvas) {
        this.filled = new Float32Array();
        this.empty = new Float32Array();
        this.raw = new Float32Array();
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.process();
    }

    get data() {
        return this.imageData.data;
    }

    process() {
        const { width, height } = this.canvas;
        this.imageData = this.ctx.createImageData(width, height);
        const { data } = this.imageData;
        this.total = width * height;
        for (let i = 0; i < this.total; i++) {
            const index = i * 4;
            const [r, g, b, a] = data.subarray(index, index + 4);
            if (a > 0) {
                this.filled.push(i);
            } else {
                this.empty.push(i);
            }
            this.raw.push(r, g, b, a);
        }
    }

    each(fn) {
        for (let i = 0; i < this.total; i++) {
            const index = i * 4;
            const x = i % this.canvas.width;
            const y = Math.floor(i / this.canvas.width);
            const [r, g, b, a] = fn({ x, y, index: i }, ...this.raw.subarray(index, index + 4));
            this.raw[index] = result[0];
            this.raw[index + 1] = result[1];
            this.raw[index + 2] = result[2];
            this.raw[index + 3] = result[3];
        }
    }

    getIndex(i) {
        const index = i * 4;
        return this.raw.subarray(index, index + 4);
    }

    setIndex(i, [r, g, b, a]) {
        const index = i * 4;
        this.raw[index] = r;
        this.raw[index + 1] = g;
        this.raw[index + 2] = b;
        this.raw[index + 3] = a;
    }

    get(x, y) {
        const index = (y * this.canvas.width + x) * 4;
        return this.raw.subarray(index, index + 4);
    }

    set(x, y, [r, g, b, a]) {
        const index = (y * this.canvas.width + x) * 4;
        this.raw[index] = r;
        this.raw[index + 1] = g;
        this.raw[index + 2] = b;
        this.raw[index + 3] = a;
    }

    read() {
        return this.getIndex(...arguments);
    }

    write(x, y, [r, g, b, a]) {
        if (x) {
            return this.set(x, y, [r, g, b, a]);
        } else {
            const { width, height } = this.canvas;
            const { data } = this.imageData;
            for (let i = 0; i < this.total; i++) {
                const index = i * 4;
                const [r, g, b, a] = this.raw.subarray(index, index + 4);
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = a;
            }
        }
    }

    render() {
        this.write();
        this.ctx.putImageData(this.imageData, 0, 0);
    }
}

export default CanvasPixels;
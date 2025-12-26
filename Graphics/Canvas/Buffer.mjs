class CanvasBuffer {
    buffer;
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.get();
    }

    get() {
        this.buffer = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        return this.buffer;
    }

    put(ctx) {
        ctx.putImageData(this.buffer, 0, 0);
    }

    coordToIndex(x, y) {
        return (y * this.canvas.width + x) * 4;
    }

    pixel(x, y, rgba) {
        const index = this.coordToIndex(x, y);
        if (rgba) {
            const [r, g, b, a] = rgba;
            this.buffer.data[index] = r;
            this.buffer.data[index + 1] = g;
            this.buffer.data[index + 2] = b;
            this.buffer.data[index + 3] = a;
            //console.log(index, r, g, b, a);
        } else {
            return [
                this.buffer.data[index],
                this.buffer.data[index + 1],
                this.buffer.data[index + 2],
                this.buffer[index + 3],
            ];
        }
    }
}

export default CanvasBuffer;
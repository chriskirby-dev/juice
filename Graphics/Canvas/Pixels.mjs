class Pixels {
    constructor(canvas) {
        filled = [];
        empty = [];
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.process();
    }

    get data() {
        return this.imageData.data;
    }

    process() {
        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        const { data, width, height } = this.imageData;
        this.total = this.canvas.width * this.canvas.height;
        for (let i = 0; i < this.total; i++) {
            const index = i * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];
            if (a > 0) {
                this.filled.push(i);
            } else {
                this.empty.push(i);
            }
        }
    }
}

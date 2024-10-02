class CanvasAsset {
    loading = false;
    width = 1;
    height = 1;
    x = 0;
    y = 0;

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.initialize();
    }

    link(canvas) {
        this.canvas = canvas;
        canvas.addAsset(this);
    }

    initialize() {}
}

export default CanvasAsset;

class CanvasPixel extends CanvasAsset {
    rgb = [0, 0, 0];
    alpha = 1;
    constructor(x, y) {
        super(x, y);
    }

    get r() {
        return this.rgb[0];
    }

    get g() {
        return this.rgb[1];
    }

    get b() {
        return this.rgb[2];
    }

    set r(v) {
        this.rgb[0] = v;
    }
    set g(v) {
        this.rgb[1] = v;
    }
    set b(v) {
        this.rgb[2] = v;
    }

    initialize() {}
}

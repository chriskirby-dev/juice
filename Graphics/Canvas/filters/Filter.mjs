import Pixels from "../Pixels.mjs";

class Filter {
    constructor(canvas) {
        this.canvas = canvas;
    }

    apply() {
        //Get Pixels
        const pixels = new Pixels(this.canvas);

        if (this.alterPixel) {
            pixels.each(this.alterPixel);
        }

        pixels.render();
    }
}

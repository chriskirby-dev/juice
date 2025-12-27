/**
 * Base canvas filter class for image processing.
 * Foundation for implementing pixel-based filters.
 * @module Graphics/Canvas/filters/Filter
 */

import Pixels from "../Pixels.mjs";

/**
 * Base filter for canvas pixel manipulation.
 * @class Filter
 */
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
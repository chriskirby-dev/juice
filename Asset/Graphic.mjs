/**
 * Graphic asset loader supporting images, canvases, and image data.
 * Provides unified interface for loading different types of graphic assets.
 * @module Asset/Graphic
 */

import { type } from "../Util/Core.mjs";
import Canvas from "../Graphics/Canvas.mjs";

/**
 * GraphicAsset class for loading and managing graphic resources.
 * Supports Image elements, Canvas, ImageData, and URL strings.
 * @class GraphicAsset
 */
class GraphicAsset {
    width = 0;
    height = 0;

    /**
     * Creates a GraphicAsset from a source.
     * @param {string|Image|HTMLCanvasElement|ImageData|Canvas} source - The graphic source
     */
    constructor(source) {
        this.source = source;
    }

    /**
     * Loads the graphic asset and resolves with asset metadata.
     * @returns {Promise<Object>} Promise resolving to {asset, width, height, type}
     * @example
     * const graphic = new GraphicAsset('image.png');
     * graphic.load().then(({asset, width, height}) => {
     *   console.log(`Loaded ${width}x${height} image`);
     * });
     */
    load() {
        const src = this.source;
        return new Promise((resolve, reject) => {
            if (type(src, "string")) {
                this.type = "image";
                const image = new Image();
                image.crossOrigin = "Anonymous";
                image.onload = () => {
                    resolve({ asset: image, width: image.width, height: image.height });
                };
                image.src = src;
            } else if (src instanceof Image || src instanceof HTMLImageElement) {
                this.type = "image";
                resolve({ asset: src, width: src.width, height: src.height, type: this.type });
            } else if (src instanceof HTMLCanvasElement || src instanceof OffscreenCanvas) {
                this.type = "canvas";
                resolve({ asset: src, width: src.width, height: src.height, type: this.type });
            } else if (src instanceof Canvas) {
                this.type = "canvas";
                resolve({ asset: src.native, width: src.width, height: src.height, type: this.type });
            } else if (src instanceof ImageData) {
                this.type = "imagedata";
                resolve({ asset: src, width: src.width, height: src.height, type: this.type });
            }
        });
    }
}

export default GraphicAsset;
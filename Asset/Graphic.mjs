import { type } from "../Util/Core.mjs";
import Canvas from "../Graphics/Canvas.mjs";
class GraphicAsset {
    width = 0;
    height = 0;
    constructor(source) {
        this.source = source;
    }

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
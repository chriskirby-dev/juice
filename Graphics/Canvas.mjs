/**
 * Canvas utilities for 2D graphics rendering and manipulation.
 * @module Graphics/Canvas
 */

import { random } from "../Util/Math.mjs";
import PropertyArray from "../DataTypes/PropertyArray.mjs";
import Observe from "../Dom/Observe/Observe.mjs";

/**
 * Parses a target to extract canvas and context.
 * @param {Canvas|HTMLCanvasElement|OffscreenCanvas|CanvasRenderingContext2D} target - The target to parse
 * @returns {{canvas: HTMLCanvasElement|OffscreenCanvas, ctx: CanvasRenderingContext2D}} Canvas and context
 * @private
 */
function parseTarget(target) {
    let ctx = target;
    let canvas = target;
    if (target instanceof Canvas) {
        canvas = target.native;
        ctx = canvas.getContext("2d");
    } else if (target instanceof HTMLCanvasElement || target instanceof OffscreenCanvas) {
        canvas = target;
        ctx = canvas.getContext("2d");
    } else if (target.canvas) {
        canvas = target.canvas;
        ctx = target;
    }

    return { canvas, ctx };
}

/**
 * CanvasImageData provides pixel-level manipulation of canvas image data.
 * @class CanvasImageData
 */
export class CanvasImageData {
    /**
     * Creates a new CanvasImageData instance.
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {number} width - Width of the image data
     * @param {number} height - Height of the image data
     */
    constructor(canvas, width, height) {
        const ctx = canvas.getContext("2d");
        this.raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.totalPixels = this.width * this.height;
    }

    get width() {
        return this.raw.width;
    }

    get height() {
        return this.raw.height;
    }

    coord(x, y) {
        const index = (y * this.width + x) * 4;
        return this.raw.data.slice(index, index + 4);
    }

    pixelPlot(i) {
        const x = i % this.width;
        const y = Math.floor(i / this.width);
        return { x, y };
    }

    pixel(i) {
        const index = i * 4;
        return this.raw.data.slice(index, index + 4);
    }

    set(i, [r, g, b, a]) {
        const index = i * 4;
        this.raw.data[index] = r;
        this.raw.data[index + 1] = g;
        this.raw.data[index + 2] = b;
        this.raw.data[index + 3] = a;
    }

    place(target, x, y, { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight }) {
        const { canvas, ctx } = parseTarget(target);
        ctx.putImageData(this.raw, 0, 0, sourceX, sourceY, sourceWidth, sourceHeight);
    }

    put(target) {
        const { canvas, ctx } = parseTarget(target);
        ctx.putImageData(this.raw, 0, 0);
        ctx.draw();
    }
}

/**
 * Canvas class for creating and managing 2D canvas contexts.
 * @class Canvas
 */
export class Canvas {
    static instances = [];
    /**
     * Creates an offscreen canvas from an existing context.
     * @param {CanvasRenderingContext2D} ctx - The source context
     * @returns {CanvasRenderingContext2D} New offscreen context
     * @static
     */
    static createOffscreenFromContext(ctx) {
        const canvas = ctx.canvas;
        return this.createOffscreenContext(canvas.width, canvas.height);
    }
    static createOffscreenContext(width = innerWidth, height = innerHeight, contextAttributes) {
        return this.createOffscreen(width, height).getContext("2d", contextAttributes);
    }

    static createOffscreen(width, height) {
        let _canvas;

        if (typeof OffscreenCanvas !== "undefined") {
            _canvas = new OffscreenCanvas(parseFloat(width), parseFloat(height));
        } else {
            _canvas = this.create(width, height);
        }

        return _canvas;
    }

    static create(width = innerWidth, height = innerHeight, contextAttributes) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    static createContext(width = innerWidth, height = innerHeight, contextAttributes) {
        return this.create(width, height).getContext("2d", contextAttributes);
    }

    static clear(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    static getPixelData(ctx, x, y, w, h) {
        const canvas = ctx.canvas;
        return new CanvasImageData(canvas);
    }

    static alterPixel(imageData, x, y, r, g, b, a) {
        const pixelStart = (x + y * this.width) * 4;
        imageData[pixelStart] = r;
        imageData[pixelStart + 1] = g;
        imageData[pixelStart + 2] = b;
        imageData[pixelStart + 3] = a;
    }

    static eachPixel(ctx, callback, options = {}) {
        const imageData = new CanvasImageData(ctx.canvas);
        const totalPixels = this.width * this.height;
        for (let i = 0; i < totalPixels; i += 4) {
            const pixelStart = i * 4;
            const ALPHA = imageData[pixelStart + 3];
            if (!filledOnly || ALPHA) {
                const x = i % this.width;
                const y = Math.floor(i / this.width);
                const R = imageData[pixelStart];
                const G = imageData[pixelStart + 1];
                const B = imageData[pixelStart + 2];

                callback(x, y, R, G, B, ALPHA);
            }
        }
    }

    _offscreen;
    font = {
        size: "14px",
        family: "Arial",
    };

    constructor(options = {}) {
        this.options = options;
        Canvas.instances.push(this);
        this.build();
    }

    set width(w) {
        if (w == this._width) return;
        this._width = w;
        if (this.native) this.native.width = w;
    }

    get width() {
        return this._width;
    }

    set height(h) {
        if (h == this._height) return;
        this._height = h;
        if (this.native) this.native.height = h;
    }

    get height() {
        return this._height;
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
    }

    getPixelData() {
        return this.ctx.getImageData(0, 0, this.width, this.height);
    }

    eachPixel(callback, filledOnly = false) {
        const imageData = new CanvasImageData(this.native);
        for (let i = 0; i < imageData.totalPixels; i++) {
            const [R, G, B, ALPHA] = imageData.pixel(i);
            if (!filledOnly || ALPHA) {
                const { x, y } = imageData.pixelPlot(i);
                const pix = callback(x, y, R, G, B, ALPHA);
                imageData.set(i, pix);
            }
        }
        return imageData;
    }

    remove() {
        this.native.parentNode.removeChild(this.native);
    }

    clear(x, y, w, h) {
        if (arguments.length) {
            this.ctx.clearRect(x, y, w || this.width - x, h || this.height - y);
        } else {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    get center() {
        return {
            x: this.width / 2,
            y: this.height / 2,
        };
    }

    toParticles(density = 1, props = ["x", "y", "vx", "vy", "bx", "by"]) {
        const pixels = [];
        this.eachPixel(
            density,
            (x, y, r, g, b, a) => {
                pixels.push(random(this.width), random(this.height), 0, 0, x, y);
            },
            true
        );
        const mapped = new PropertyArray(pixels.length / props.length, props, "float");
        mapped.set(pixels, 0);
        return mapped;
    }

    placeImage({ ctx, image, url, position, x = 0, y = 0, width, height }, callback) {
        const readyToPlace = () => {
            (ctx || this.ctx).drawImage(image, x, y, width, height);
            if (callback) callback(image);
        };

        if (image instanceof Image) {
            readyToPlace(image);
        } else if (url || typeof image === "string") {
            image = new Image();
            image.crossOrigin = "Anonymous";
            image.onload = () => {
                if (!width) width = image.width;
                if (!height) height = image.height;
                readyToPlace(image);
            };
            image.src = url || image;
        }
    }

    _buffers = {};

    createBuffer({ id, width, height, buffer }) {
        const buff = buffer || this.ctx.createImageData(width || this.width, height || this.height);
        if (id) this._buffers[id] = buff;
        return buff;
    }

    getBuffer(id) {
        return this._buffers[id];
    }

    renderBuffer(id, x = 0, y = 0, { x: sourceX = 0, y: sourceY = 0, width = this.width, height = this.height }) {
        const buffer = this.getBuffer(id);
        console.log(buffer);
        console.log(x, y, sourceX, sourceY, width, height);
        this.ctx.putImageData(buffer, x, y, sourceX, sourceY, width, height);
    }

    get buffer() {
        return {
            create: () => {
                if (!this.ctx) this.getContext("2d");
                this._buffer = this.ctx.createImageData(this.width, this.height);
            },
            write: (canvas = this.ctx.canvas) => {
                if (!this._buffer) this.buffer.create();
                this._buffer.drawImage(canvas, 0, 0);
            },
            clear: () => {
                this._buffer = null;
            },
            reset: () => {
                if (!this._buffer) this.buffer.create();
                this._buffer.data.fill(0);
            },
            get: () => {
                return this._buffer;
            },
            set: (data, i) => {
                this._buffer.data.set(data, i);
            },
            apply: () => {
                this.ctx.putImageData(this._buffer, 0, 0);
            },
        };
    }

    addText(text, options) {
        let font, x, y, max;
        let align = "left";

        if (options.font) {
            this.font = Object.assign(this.font, options.font);
            this.ctx.font = `${this.font.size} ${this.font.family} ${this.font.bold ? " bold" : ""}${
                this.font.italic ? " italic" : ""
            }`;
        }

        if (options.x) x = options.x;
        if (options.y) y = options.y;
        if (options.align) align = options.align;
        const mesured = this.ctx.measureText(text);

        switch (align) {
            case "right":
                x -= mesured.width;
                break;
            case "center":
                x -= mesured.width / 2;
                break;
        }

        if (!options.stroke || options.fill) {
            this.ctx.fillText(text, x, y, max);
        }

        if (options.stroke) {
            this.ctx.strokeText(text, x, y, max);
        }
    }

    appendTo(container) {
        this.container = container;
        container.appendChild(this.native);

        Observe.resize(container).change((w, h) => {
            this.width = w;
            this.height = h;
        });

        if (!this.width || !this.height) {
            const rect = container.getBoundingClientRect();
            this.width = rect.width;
            this.height = rect.height;
        }

        this.ctx = this.native.getContext("2d");
    }

    render(options = {}) {
        if (options.before) {
            options.before(this.visible);
        }
        console.log(this.ctx.canvas);
        this.visible.drawImage(this.ctx.canvas, 0, 0);
        if (options.after) {
            options.after(this.visible);
        }
    }

    copy(canvas, x = 0, y = 0, w, h) {
        if (!w) w = canvas.width;
        if (!h) h = canvas.height;

        this.ctx.drawImage(canvas.native || canvas, x, y, w, h, 0, 0, w, h);
    }

    put(data, x = 0, y = 0) {
        this.ctx.putImageData(data, x, y);
    }

    toImageURL(type = "image/png") {
        return this.native.toDataURL(type);
    }

    build() {
        const { options } = this;
        let id, canvas, width, height;

        if (options.width && options.height) {
            ({ width, height } = options);
        } else if (options.container && (!options.width || !options.height)) {
            ({ width, height } = options.container.getBoundingClientRect());
        }

        if (options.canvas) {
            canvas = options.canvas;
        } else {
            if (options.offscreen) {
                if (typeof OffscreenCanvas !== "undefined") {
                    canvas = new OffscreenCanvas(width, height);
                } else {
                    canvas = this.create(width, height);
                }
            } else {
                canvas = document.createElement("canvas");
            }
        }

        if (options.id) {
            id = options.id;
        } else {
            id = `canvas-${Canvas.instances.length}`;
        }

        this.ctx = canvas.getContext("2d");
        this.width = canvas.width = parseInt(width);
        this.height = canvas.height = parseInt(height);
        canvas.id = id;

        this.native = canvas;
        this.visible = this.ctx;

        if (options.container && !options.offscreen) {
            this.appendTo(options.container);
        }

        if (options.preRender) {
            //If preRender set create a offscreen canvas for pre-rendering/proessing
            this.offscreen = new Canvas({
                offscreen: true,
                width: this.width,
                height: this.height,
            });
            this.visible = this.ctx;
            this.ctx = this.offscreen.ctx;
        }

        if (options.loadImage) {
            const onImagePlaced = () => {
                this.render();
            };

            if (typeof options.loadImage === "string") {
                this.placeImage({ url: options.loadImage, x: 0, y: 0 }, onImagePlaced);
            } else if (options.loadImage instanceof Image) {
                this.placeImage(
                    {
                        image: options.loadImage,
                        x: 0,
                        y: 0,
                        width: options.loadImage.width,
                        height: options.loadImage.height,
                    },
                    onImagePlaced
                );
            }
        }
    }
}

export default Canvas;
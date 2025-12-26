import Component from "./Component.mjs";
import { random } from "../Util/Math.mjs";
import PropertyArray from "../DataTypes/PropertyArray.mjs";
import Canvas from "../Graphics/Canvas.mjs";

class CanvasImageData {
    constructor(width, height, data) {
        this.data = data;
        this.width = width;
        this.height = height;
    }
}

class CanvasComponent extends Component.HTMLElement {
    static tag = "juice-canvas";

    static config = {
        name: "juice-canvas",
        nativeProxy: "canvas",
        properties: {
            prerender: { type: "exists", default: false, linked: true },
            width: { default: 100, type: "int", unit: "size", linked: true },
            height: { default: 100, type: "int", unit: "size", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "prerender"],
            attributes: [],
            properties: [],
        };
    }

    static html() {
        return `<canvas id="native"></canvas>`;
    }

    static get style() {
        return [
            {
                ":host": {
                    position: "relative",
                    display: "block",
                    width: "100%",
                    height: "100%",
                },
                ':host([resize="false"])': {
                    width: "auto",
                    height: "auto",
                },
                canvas: {
                    display: "block",
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    native;
    mouseX = 0;
    mouseY = 0;

    constructor() {
        super();
    }

    get center() {
        return {
            x: this.width / 2,
            y: this.height / 2,
        };
    }

    onResize(w, h) {
        this.width = w;
        this.height = h;
        return true;
    }

    onCreate() {
        // this.position = new Vector3d(0, 0, 0);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    get totalPixels() {
        return this.native.width * this.native.height;
    }

    getPixelData() {
        return this.ctx.getImageData(0, 0, this.native.width, this.native.height).data;
    }

    /**
     * Iterate over each pixel in the canvas with a given density.
     *
     * @param {number} density - The density at which to iterate over the pixels.
     * @param {Function} callback - The callback function to be called for each pixel.
     * @param {boolean} [ignoreEmpty=true] - Whether or not to ignore empty pixels.
     * @throws {Error} If pixel data cannot be retrieved.
     * @throws {Error} If invalid pixel data is encountered.
     */
    forEachPixel(density, callback, ignoreEmpty = true) {
        // Get the height and width of the canvas.
        const { height, width } = this;
        let lastY;
        // Get the pixel data from the canvas.
        const pixelData = this.getPixelData();

        // Throw an error if pixel data cannot be retrieved.
        if (!pixelData) {
            throw new Error("Could not get pixel data");
        }
        return new Promise((resolve, reject) => {
            // Iterate over each pixel with the given density.
            for (let i = 0; i < pixelData.length; i += 4 * density) {
                // Calculate the pixel index.
                const pixelIndex = i / 4;
                // Get the alpha value of the pixel.
                const alpha = pixelData[i + 3];
                // Get the x and y coordinates of the pixel.
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);

                if (y !== lastY && y < lastY + density) {
                    continue;
                }

                // If ignoreEmpty is false or the pixel is not empty, call the callback function.
                if (!ignoreEmpty || alpha !== 0) {
                    // Get the RGB values of the pixel.
                    const red = pixelData[i];
                    const green = pixelData[i + 1];
                    const blue = pixelData[i + 2];
                    lastY = y;

                    // Throw an error if invalid pixel data is encountered.
                    if ([red, green, blue].includes(undefined)) {
                        throw new Error(`Invalid pixel data RGB: ${red}, ${green}, ${blue}`);
                    }
                    //console.log("CALLING BACK", x, y);
                    // Call the callback function with the pixel data.
                    callback(x, y, red, green, blue, alpha, pixelIndex);
                }
            }
            resolve();
        });
    }

    /**
     * Load an image from the given URL.
     *
     * @param {string} imageUrl - The URL of the image to load.
     * @return {Promise<Image>} A Promise that resolves with the loaded Image object.
     */
    loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            // Create a new Image object.
            const image = new Image();

            // Set the crossOrigin property to allow loading images from any domain.
            image.crossOrigin = "Anonymous";

            // Set event listeners for the load and error events.
            image.onload = () => resolve(image);
            image.onerror = reject;

            // Set the source URL of the image.
            image.src = imageUrl;
        });
    }

    /**
     * Places an image on the canvas at the specified position.
     *
     * @param {Image} image - The image to place on the canvas.
     * @param {number} [posX=0] - The x-coordinate of the top-left corner of the image.
     * @param {number} [posY=0] - The y-coordinate of the top-left corner of the image.
     * @param {number} [width] - The width of the image. If not provided, the width of the image will be used.
     * @param {number} [height] - The height of the image. If not provided, the height of the image will be used.
     * @return {Promise<void>} A Promise that resolves when the image is placed on the canvas.
     * @throws {Error} If the provided image is not of type Image.
     */
    placeImage(image, posX = 0, posY = 0, width, height) {
        return new Promise((resolve, reject) => {
            // Check if the provided image is of type Image
            if (image instanceof Image) {
                // Set the crossOrigin property to allow loading images from any domain
                image.crossOrigin = "Anonymous";

                // Draw the image on the canvas at the specified position with the specified width and height
                this.ctx.drawImage(image, posX, posY, width || image.width, height || image.height);

                // Resolve the Promise
                resolve();
            } else {
                // Reject the Promise with an error if the provided image is not of type Image
                reject(new Error("Image is not of type Image" + typeof image));
            }
        });
    }

    inBounds(x, y) {
        return x <= this.width && x > 0 && y <= this.height && y > 0;
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
                if (i > this._buffer.data.length) {
                    return;
                }
                this._buffer.data.set(data, i);
            },
            apply: () => {
                this.ctx.putImageData(this._buffer, 0, 0);
            },
        };
    }

    getContext(type = "2d") {
        let scope = null;
        if (type.includes(":")) {
            const [type, scope] = type.split(":");
        }
        this.contextType = type;
        if (scope) {
            this.ctx = this[scope].getContext(type);
        } else {
            this.ctx = (this.prerender ? this.offscreen : this.native).getContext(type);
        }
        return this.ctx;
    }

    render() {
        if (this.prerender) {
            const ctx = this.native.getContext(this.contextType);
            ctx.clearRect(0, 0, this.width, this.height);
            ctx.drawImage(this.offscreen, 0, 0, this.width, this.height);
        }
    }

    renderBypass() {}

    onFirstConnect() {
        let { width, height } = this.getBoundingClientRect();

        this.native = this.ref("native");
        this.native.width = this.width;
        this.native.height = this.height;

        if (this.offscreen) {
            this.offscreen.width = this.width;
            this.offscreen.height = this.height;
        }

        if (this.hasAttribute("prerender")) {
            this.setupPrerender();
        }

        this.addEventListeners();
    }

    addEventListeners() {
        const handleMouseMove = this.handleMouseMove.bind(this);
        const handleMouseOut = this.handleMouseOut.bind(this);

        document.body.addEventListener("pointermove", handleMouseMove);
        document.body.addEventListener("mouseout", handleMouseOut);
    }

    handleMouseMove(event) {
        if (!this.isMouseOver) {
            document.body.setPointerCapture(event.pointerId);
            this.isMouseOver = event.pointerId;
        }
        this.mouseX = event.pageX;
        this.mouseY = event.pageY;
        this.dispatchEvent(new CustomEvent("change"));
    }

    handleMouseOut(event) {
        if (this.isMouseOver) {
            document.body.releasePointerCapture(this.isMouseOver);
            this.isMouseOver = false;
        }
    }

    setupPrerender() {
        this.prerender = true;
        const offscreenCanvas = new OffscreenCanvas(this.width, this.height);
        this.offscreen = offscreenCanvas;
        this.offscreenCtx = offscreenCanvas.getContext("2d");
    }

    onPropertyChanged(property, prevous, value) {
        if (property === "width" || property === "height") {
            if (this.native) this.native[property] = value;
            if (this.offscreen) this.offscreen[property] = value;
        } else if (property == "prerender") {
            this.prerender = value;
            if (value) this.setupPrerender();
        }
    }

    toImageURL(type = "image/png") {
        return this.native.toDataURL(type);
    }

    toImage(useTag) {
        if (!useTag) return this.toImageURL();
        const image = new Image();
        image.src = this.toImageURL();
        return image;
    }
}

customElements.define("juice-canvas", CanvasComponent);
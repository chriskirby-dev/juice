/**
 * Resource loader utility for loading content and images asynchronously.
 * Provides Promise-based loading for text content and images with CORS support.
 * @module File/Loader
 */

/**
 * Handles asynchronous loading of resources including text content and images.
 * @class Loader
 * @example
 * const loader = new Loader();
 * const content = await loader.loadContent('/data.json');
 * const image = await loader.loadImage('/image.png');
 */
class Loader {
    /** @type {boolean} Indicates if a loading operation is in progress */
    loading;

    /**
     * Creates a new Loader instance.
     */
    constructor() {
        this.loading = false;
    }

    /**
     * Loads a resource automatically detecting type (string URL loads content, otherwise loads image).
     * @param {string|*} source - The resource source (URL string for content, Image source for image)
     * @returns {Promise<string|Image>} Promise resolving to loaded content or image
     * @example
     * const result = await loader.load('/file.txt'); // Loads as content
     */
    load(source) {
        if (type(source) === "string") {
            return this.loadContent(source);
        } else {
            return this.loadImage(source);
        }
    }

    /**
     * Loads text content from a URL using XMLHttpRequest.
     * @param {string} source - The URL to load content from
     * @returns {Promise<string>} Promise resolving to the loaded text content
     * @example
     * const html = await loader.loadContent('/template.html');
     */
    loadContent(source) {
        this.loading = true;
        const req = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            req.addEventListener("load", () => {
                resolve(req.response);
            });
            req.addEventListener("error", () => {
                reject();
            });
            req.open("GET", source, true);
            req.responseType = "text";
            req.send();
        });
    }

    /**
     * Loads an image from a URL with CORS support.
     * @param {string} source - The image URL to load
     * @returns {Promise<Image>} Promise resolving to the loaded Image object
     * @example
     * const img = await loader.loadImage('/photo.jpg');
     * canvas.drawImage(img, 0, 0);
     */
    loadImage(source) {
        const image = new Image();
        image.crossOrigin = "Anonymous";
        return new Promise((resolve, reject) => {
            image.addEventListener("load", () => {
                resolve(image);
            });
            image.addEventListener("error", () => {
                reject();
            });
            image.src = source;
        });
    }

    /**
     * Marks the loading operation as complete.
     * @private
     */
    loaded() {
        this.loading = false;
    }

    /**
     * Handles loading errors.
     * @private
     */
    error() {
        this.loading = false;
        console.log("error");
    }
}
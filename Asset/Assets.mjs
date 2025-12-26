/**
 * Asset collection manager for loading and storing multiple assets.
 * Extends Array to provide convenient asset management with loading callbacks.
 * @module Asset/Assets
 */

import { type, empty } from "../Util/Core.mjs";
import { extention } from "../File/Path.mjs";
import Loader from "../File/Loader.mjs";

/**
 * Assets collection class for managing multiple asset loads.
 * Automatically loads images from URLs and tracks loading state.
 * @class Assets
 * @extends Array
 */
class Assets extends Array {
    /**
     * Creates a new Assets collection.
     */
    constructor() {
        super();
    }

    /**
     * Registers a callback to be called when all assets are loaded.
     * @param {Function} fn - Callback function to execute when loading is complete
     */
    ready(fn) {
        this._loaded = fn;
    }

    /**
     * Handles asset loading errors.
     * @param {string} asset - The asset that failed to load
     * @throws {Error} Always throws an error with asset information
     */
    error(asset) {
        throw new Error("Could not load asset: " + asset);
    }

    /**
     * Adds multiple assets at once.
     * @param {Array} assets - Array of assets (can contain nested arrays)
     */
    addAll(assets) {
        for (const asset of assets) {
            if (type(asset, "array")) {
                this.add(...asset);
            } else {
                this.add(asset);
            }
        }
    }

    /**
     * Adds an asset to the collection and starts loading if it's a URL.
     * @param {string|*} asset - Asset URL or asset object
     * @param {string} [asType] - Force asset type (e.g., 'image')
     */
    add(asset, asType) {
        if (empty(asset)) {
            return;
        }
        if (type(asset, "string")) {
            if (asType === "image" || (["jpeg", "jpg", "png"].includes(extention(asset)) && !asType)) {
                this.loading.push(asset);
                Loader.loadImage(asset)
                    .then((image) => {
                        this.push(image);
                        this.loading.splice(this.loading.indexOf(asset), 1);
                        if (this.loading.length === 0) {
                            if (this._loaded) this._loaded();
                        }
                    })
                    .catch(() => {
                        this.error();
                    });
            }
        } else {
            this.push(asset);
            if (this.loading.length === 0) {
                if (this._loaded) this._loaded();
            }
        }

        this.push(asset);
    }
}
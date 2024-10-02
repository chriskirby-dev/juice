import { type, empty } from "../Util/Core.mjs";
import { extention } from "../File/Path.mjs";
import Loader from "../File/Loader.mjs";

class Assets extends Array {
    constructor() {
        super();
    }

    ready(fn) {
        this._loaded = fn;
    }

    error(asset) {
        throw new Error("Could not load asset: " + asset);
    }

    addAll(assets) {
        for (const asset of assets) {
            if (type(asset, "array")) {
                this.add(...asset);
            } else {
                this.add(asset);
            }
        }
    }

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

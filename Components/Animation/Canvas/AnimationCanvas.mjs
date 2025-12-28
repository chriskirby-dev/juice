/**
 * Animation canvas component for rendering animations.
 * Custom element providing canvas-based animation rendering.
 * @module Components/Animation/Canvas/AnimationCanvas
 */

import { type } from "../../../Util/Core.mjs";
import Component from "../../Component.mjs";
import AnimationValue from "../../../Animation/Properties/Value.mjs";

/**
 * Canvas component for animation rendering.
 * @class AnimationCanvas
 * @extends Component.HTMLElement
 */
class AnimationCanvas extends Component.HTMLElement {
    static tag = "animation-canvas";

    static config = {
        name: "animation-canvas",
        tag: "animation-canvas",
        properties: {
            width: { type: "int", route: "w.value", default: 0, linked: true },
            height: { type: "int", route: "h.value", default: 0, linked: true },
            fps: { type: "int", default: 60, linked: true },
            debug: { type: "exists", default: false, linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "fps", "debug"],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    static html() {
        return `<canvas id="native" part="canvas" width="${this.width}" height="${this.height}" ></canvas>`;
    }

    assets = [];
    filters = [];
    mode = "normal";

    onFirstConnect() {
        this.dispatchEvent(new CustomEvent("connected", { detail: this }));
    }

    add(asset) {
        this.assets.push(asset);
    }

    reset() {
        this.ref("native").clearRect(0, 0, this.width, this.height);
    }

    update() {
        this.assets.forEach((asset) => {
            asset.update();
            if (asset.dirty) {
            }
        });
    }
}
/**
 * Animation layer component for layered rendering with camera support.
 * Custom element that provides a canvas or DOM-based rendering layer.
 * @module Components/Animation/Layer
 */

import Component from "../Component.mjs";
import Timeline from "../../Animation/Timeline.mjs";
import { Vector3D, Vector2D } from "../../Animation/Properties/Vector.mjs";
import AnimationStage from "./Stage.mjs";
import AnimationBody from "./Body.mjs";
import AnimationSprite from "./Sprite.mjs";
import Camera from "./Camera.mjs";

/**
 * Layer for rendering animated content with camera and stage management.
 * @class AnimationLayer
 * @extends Component.HTMLElement
 */
export class AnimationLayer extends Component.HTMLElement {
    static tag = "animation-layer";

    static config = {
        name: "animation-layer",
        tag: "animation-layer",
        properties: {
            width: { default: 100, type: "number", unit: "percent" },
            height: { default: 100, type: "number", unit: "percent" },
            type: { default: "canvas", type: "string" },
            debug: { default: false, type: "exists", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "debug"],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    static html() {
        return `<slot></slot>`;
    }

    viewer;

    onFirstConnect() {
        this.viewer = this.parentNode;
        this.type = "dom";
        if (this.hasAttribute("type")) {
            this.type = this.getAttribute("type");
        }
        switch (this.type) {
            case "canvas": {
                this.canvas = document.createElement("animation-canvas");
                break;
            }
            case "dom": {
                this.viewer = this;
                break;
            }
        }
        this.setup();
    }

    onChildren(children) {
        console.log("LAYER CHILDREN", children);
        children.forEach((child) => {
            if (child.animate) {
                this.viewer.addAnimation(child);
            }
        });
    }

    setup() {}

    update(time) {}

    render(time) {}
}

customElements.define(AnimationLayer.tag, AnimationLayer);
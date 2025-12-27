/**
 * Layer component for composition rendering.
 * Individual layer within a composition with canvas support.
 * @module Components/Composition/Layer
 */

import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import Canvas from "../../Graphics/Canvas.mjs";

/**
 * Layer for rendering content within a composition.
 * @class Layer
 * @extends Component.HTMLElement
 */
class Layer extends Component.HTMLElement {
    static tag = "juice-layer";

    static config = {
        tag: "juice-layer",
        properties: {
            name: { type: "string", default: "", linked: true },
            type: { type: "string", default: "", allowed: ["canvas"], linked: true },
            composition: { type: "object", default: null },
            index: { type: "int", default: 0, linked: true },
        },
    };

    static get observed() {
        return {
            all: ["name", "type", "index"],
            attributes: [],
            properties: [],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    position: "absolute",
                    display: "block",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                },
                slot: {
                    position: "absolute",
                    display: "block",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                },
                canvas: {
                    position: "absolute",
                    display: "block",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    static html() {
        return `
            <slot></slot>
        `;
    }

    set zIndex(index) {
        this.index = index;
    }

    #composition = null;

    get composition() {
        return this.#composition;
    }
    set composition(comp) {
        this.#composition = comp;
    }

    onCreate() {}

    onFirstConnect() {
        const children = this.children;
        const layers = this.parentNode.children;
        if (children.length > 0) {
        }
    }

    setContents(contents) {
        this.content = contents;
        this.append(...contents);
    }

    onResize(w, h) {
        if (this.canvas) {
            this.canvas.onResize(w, h);
        }
    }

    getCanvas() {
        if (this.canvas) return this.canvas;
        this.canvas = document.createElement("juice-canvas");
        this.append(this.canvas);
        return this.canvas;
    }

    onPropertyChanged(property, old, value) {
        switch (property) {
            case "name":
                break;
            case "index":
                break;
            case "type":
                if (value == "canvas") {
                    this.getCanvas();
                } else if (value == "custom") {
                } else if (value == "container") {
                }
                break;
        }
    }
}

customElements.define(Layer.tag, Layer);
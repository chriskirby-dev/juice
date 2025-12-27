/**
 * Composition component for layered content management.
 * Container for managing multiple layers with visibility and state control.
 * @module Components/Composition/Composition
 */

import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";

/**
 * Composition container for managing multiple layers.
 * @class Composition
 * @extends Component.HTMLElement
 */
class Composition extends Component.HTMLElement {
    static tag = "juice-composition";

    static allowedStates = ["visible", "hidden", "locked"];

    static config = {
        properties: {
            width: { default: 100, type: "number", unit: "percent" },
            height: { default: 100, type: "number", unit: "percent" },
            state: { default: "initial", type: "string", allowed: Composition.allowedStates },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "state"],
            attributes: [],
            properties: [],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    position: "relative",
                    display: "block",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                },
                "::slotted(juice-layer)": {
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

    layers = [];
    _index = {};

    constructor() {
        super();
    }

    onResize(w, h) {
        this.width = w;
        this.height = h;
        this.layers.forEach((layer, index) => {
            layer.onResize(w, h);
        });
    }

    addLayer(name, options = {}) {
        if (type(options, "number")) {
            options = { index: options };
        }
        const layer = document.createElement("juice-layer");
        layer.name = name;
        layer.composition = this;
        layer.index = this.#internal.getNextIndex();
        this.appendChild(layer);
        this.layers = Array.from(this.children);
        this.layers.forEach((child, index) => {
            child.index = index + 1;
        });
        return layer;
    }

    layer(id) {
        if (type(id, "string")) {
            return this.layers.find((layer) => layer.name == id);
        } else if (type(id, "number")) {
            return this.layers[id];
        }
    }

    newLayer(name, contents) {
        const layer = document.createElement("juice-layer");
        layer.name = name;
        layer.index = this.layers.length;
        layer.composition = this;
        this.layers.push();
        return layer;
    }

    get #internal() {
        const self = this;
        return {
            getNextIndex: function () {
                return self.children.length + 1;
            },
            findLayerIndex: function (element) {
                return Array.from(self.children).indexOf(element) + 1;
            },
        };
    }

    onCustomChildConnect(customChild) {
        switch (customChild.tagName) {
            case "JUICE-LAYER":
                // const index = this.#internal.findLayerIndex(customChild);
                // customChild.index = index;
                break;
        }
    }

    onConnect() {
        this.layers = Array.from(this.children);
        this.layers.forEach((child, index) => {
            child.index = index + 1;
        });
    }

    onCustomChildReady(child) {
        const index = this.#internal.findLayerIndex(child);
        child.index = index;
        Array.from(this.children).forEach((child, index) => {
            child.index = index;
        });
    }

    onPropertyChanged(property, old, value) {}
}

customElements.define(Composition.tag, Composition);
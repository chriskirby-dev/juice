/**
 * Particles component for rendering particle systems.
 * Custom element wrapper for particle rendering on canvas.
 * @module Components/Animation/Particles
 */

import Component from "../Component.mjs";
import Canvas from "../../Graphics/Canvas.mjs";

/**
 * Particles custom element for particle system rendering.
 * @class Particles
 * @extends Component.HTMLElement
 */
class Particles extends Component.HTMLElement {
    static get config() {
        return {
            properties: {
                width: { type: "number", default: 100, unit: "percent" },
                height: { type: "number", default: 100, unit: "percent" },
            },
        };
    }

    constructor() {
        super();
    }

    onFirstConnect() {
        this.canvas = new Canvas(this);
    }
}
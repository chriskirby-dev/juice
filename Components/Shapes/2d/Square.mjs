/**
 * Square shape component.
 * Renders a square shape with customizable properties.
 * @module Components/Shapes/2d/Square
 */

import Shape2d from "./Shape2d.mjs";

/**
 * Square custom element extending Shape2d.
 * @class SquareComponent
 * @extends Shape2d
 */
class SquareComponent extends Shape2d {
    static tag = "shape-square";
    static get style() {
        return {
            ".square": {},
        };
    }

    static html() {
        return `<div class="bg square width height rotation scale"></div>`;
    }
}

export default SquareComponent;
customElements.define(SquareComponent.tag, SquareComponent);
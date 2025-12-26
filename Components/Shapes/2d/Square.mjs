import Shape2d from "./Shape2d.mjs";
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
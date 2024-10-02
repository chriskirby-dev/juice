import Shape2d from "./Shape2d.mjs";
class CircleComponent extends Shape2d {
    static tag = "shape-circle";
    static get style() {
        return {
            ".circle": {
                borderRadius: "50%",
                backgroundColor: "var(--bg)",
            },
        };
    }

    static html() {
        return `<div class="circle width height rotation scale"></div>`;
    }
}

export default CircleComponent;
customElements.define(CircleComponent.tag, CircleComponent);

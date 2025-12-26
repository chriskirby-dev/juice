import Shape3d from "./Shape3d.mjs";

class Sphere extends Shape3d {
    static tag = "shape-sphere";

    static get style() {
        return {
            ".sphere": {
                borderRadius: "50%",
            },
        };
    }

    static html() {
        return `<div id="element" class="bg sphere width height rotation scale"></div>`;
    }

    onFirstConnect() {
        this.element = this.ref("element");
    }

    update(render) {
        const rocket = document.querySelector("#rocket");
        if (!rocket.ready) return;
        super.update();
        const thetaX = (rocket.rotation.x * Math.PI) / 180;
        const thetaY = (rocket.rotation.y * Math.PI) / 180;

        const width = this.size.x * Math.cos(thetaY) + this.size.y * Math.sin(thetaY);
        const height = this.size.x * Math.cos(thetaX) + this.size.y * Math.sin(thetaX);
        this.width = width;
        this.height = height;
    }
}

customElements.define(Sphere.tag, Sphere);
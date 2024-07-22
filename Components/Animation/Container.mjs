import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import { Rotation, Vector3D, AnimationValue } from "../../Animation/Properties/Core.mjs";
import { parseAnchor } from "../../Animation/Anchor.mjs";
import { radians } from "../../Util/Geometry.mjs";

class AnimationContainer extends Component.HTMLElement {
    static tag = "animation-container";

    animationComponent = true;
    animated = true;

    static config = {
        name: "animation-container",
        tag: "animation-container",
        template: "minimal",
        vdom: false,
        properties: {
            width: { type: "number", default: 0, unit: "mixed", linked: true },
            height: { type: "int", default: 0, unit: "mixed", linked: true },
            x: { type: "number", default: 0, linked: true },
            y: { type: "number", default: 0, linked: true },
            z: { type: "number", default: 0, linked: true },
            anchor: { type: "string", default: "center", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "x", "y", "z", "anchor"],
            attributes: [],
            properties: [],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                    position: "absolute",
                    width: "100vw",
                    height: "100vh",
                },
                slot: {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    static html(data = {}) {
        return `<slot></slot>`;
    }

    setAnchor(value) {
        const parsed = parseAnchor(value);
        this._anchor = parsed;
        console.log(parsed);

        this.ref("html").style.setProperty("--anchor-x", `${parsed.x * 100}%`);
        this.ref("html").style.setProperty("--anchor-y", `${parsed.y * 100}%`);
    }

    beforeCreate() {
        this.animationBody = true;
        this.rotation = new Rotation(0);
        this.position = new Vector3D(0, 0, 0);
    }

    onPropertyChanged(property, prevous, value) {
        switch (property) {
            case "width":
                this.styles.update(":host", { width: value + "px" }, "size");
                break;

            case "height":
                this.styles.update(":host", { height: value + "px" }, "size");
                break;
            case "anchor":
                this.setAnchor(value);
                break;
        }
    }

    update() {}

    render() {}

    onCustomChildReady(child) {
        /// if (!child) return;
        console.log("child connected", child, child.animate);
        if (this._timeline) {
            this._timeline.addAnimator(child);
        }
    }
}

customElements.define(AnimationContainer.tag, AnimationContainer);

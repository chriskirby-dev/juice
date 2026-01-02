import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import { Vector3D } from "../../Animation/Properties/Vector.mjs";

class Background extends Component.HTMLElement {
    static tag = "animation-background";
    static config = {
        properties: {
            width: { type: "int", route: "w.value", default: 0, linked: true },
            height: { type: "int", route: "h.value", default: 0, linked: true },
            x: { type: "number", route: "position.x", default: 0, linked: true },
            y: { type: "number", route: "position.y", default: 0, linked: true },
            z: { type: "number", route: "position.z", default: 0, linked: true },
            placement: { default: "world", type: "string", allowed: ["world", "parallax"] },
            factor: { default: 0.5, type: "number" } // Parallax factor (0-1, lower = further away)
        }
    };

    static get observed() {
        return {
            all: ["placement", "x", "y", "z", "width", "height", "factor"]
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
                    left: 0,
                    top: 0
                },
                ":host([parallax]) #background": {
                    display: "block",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    left: 0,
                    top: 0
                },
                ":host([world]) #background": {
                    display: "block",
                    position: "absolute",
                    transform: "translate3d(var(--x, 0), var(--y, 0), var(--z, 0))",
                    left: 0,
                    top: 0
                }
            }
        ];
    }

    static html(data = {}) {
        return `<div id="background" style="width: ${data.width}px; height: ${data.height}px;"><slot></slot></div>`;
    }

    beforeCreate() {
        this.position = new Vector3D(0, 0, 0, { history: 3 });
        this.stage = null;
        this.backgroundElement = null;
    }

    update(time) {
        if (!this.stage || !this.backgroundElement) return;

        const stagePos = this.stage.position;

        if (this.placement === "parallax") {
            // Parallax: move at a fraction of stage movement (parallax effect)
            // Lower factor = further away = moves slower
            this.position.x = stagePos.x * this.factor;
            this.position.y = stagePos.y * this.factor;
            this.position.z = stagePos.z * this.factor;
        } else if (this.placement === "world") {
            // World: moves with stage position (stays in world coordinates)
            this.position.x = stagePos.x;
            this.position.y = stagePos.y;
            this.position.z = stagePos.z;
        }
    }

    render(time) {
        if (!this.backgroundElement || !this.position.dirty) return;

        // Update CSS variables for transform
        this.setStyleVars({
            "--x": `${this.position.x}px`,
            "--y": `${this.position.y}px`,
            "--z": `${this.position.z}px`,
            "--width": `${this.width}px`,
            "--height": `${this.height}px`
        });

        this.position.save();
    }

    onChildren() {
        // Store reference to the background container
        this.backgroundElement = this.ref("background");
    }

    onFirstConnect() {
        const stage = this.closest("animation-stage");
        if (stage) {
            this.stage = stage;
            stage.addBackground(this, {
                placement: this.placement,
                animate: true, // Tell stage this background should be animated
                update: () => this.update(),
                render: () => this.render()
            });
        }

        // Set initial attribute for CSS selector
        this.setAttribute(this.placement, "");
    }
}
export default Background;
export { Background };

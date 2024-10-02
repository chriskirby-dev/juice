import Component from "../../Component.mjs";
import { Vector3D } from "../../../Animation/Properties/Vector.mjs";
import { Scale } from "../../../Animation/Properties/Scale.mjs";
import { Rotation3D } from "../../../Animation/Properties/Rotation.mjs";
import { Size3D } from "../../../Animation/Properties/Size.mjs";

function cssObjectToString(styles) {
    return Object.entries(styles)
        .map(([k, v]) => `${k}:${v}`)
        .join(";");
}

class Shape3d extends Component.HTMLElement {
    queue = {};

    static config = {
        name: "Shape2d",
        properties: {
            width: { type: "number", route: "size.x", unit: "size", linked: true },
            height: { type: "number", route: "size.z", unit: "size", linked: true },
            depth: { type: "number", route: "size.y", unit: "size", linked: true },

            rx: { type: "number", default: 0, route: "rotation.x", unit: "deg", linked: true },
            ry: { type: "number", default: 0, route: "rotation.y", unit: "deg", linked: true },
            rz: { type: "number", default: 0, route: "rotation.z", unit: "deg", linked: true },

            x: { type: "number", default: 0, route: "position.x", linked: true },
            y: { type: "number", default: 0, route: "position.y", linked: true },
            z: { type: "number", default: 0, route: "position.z", linked: true },

            bg: { type: "string", default: "#000", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "depth", "rx", "ry", "rz", "scale", "x", "y", "z", "bg"],
        };
    }

    beforeCreate() {
        const options = {};
        this.size = new Size3D(options.width || 100, options.height || 100, options.depth || 100);
        this.rotation = new Rotation3D(options.rotate || 0);
        this.position = new Vector3D(options.x || 0, options.y || 0, options.z || 0);
        this.scale = new Scale(options.scale || 1);
        this._offset = new Vector3D(0, 0, 0);
        this._anchor = new Vector3D(0, 0, 0);
    }

    static get baseStyle() {
        return [
            {
                ":host": {
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                },
                "#html, .width": {
                    width: "var(--width)",
                },
                "#html, .height": {
                    height: "var(--height)",
                },
                "#html": {
                    transform: `translate(-50%, -50%)`,
                },
                ".rotate": {
                    transform: "rotate(var(--rotate))",
                },
                ".scale": {
                    transform: "scale(var(--scale))",
                },
                ".bg": {
                    backgroundColor: "var(--bg)",
                },
            },
        ];
    }

    addLight(Light3D) {}

    anchor(x, y) {
        this._anchor = { x, y };
        this.element.style.transformOrigin = `${x}px ${y}px`;
    }

    offset(x, y) {
        this._offset = { x, y };
    }

    cssVars = {};
    queue = {};

    update(render = false) {
        console.log("UPdate called");
        const x = this.position.x + this._offset.x - this._anchor.x;
        const y = this.position.y + this._offset.y - this._anchor.y;
        this.queue.position = [x, y];

        if (this.size.dirty()) {
            this.width = this.size.x;
            this.height = this.size.y;
            this.depth = this.size.z;
            this.size.clean();
        }
        console.log("updated");
        if (render) this.render();
    }

    render() {
        const html = this.ref("html");
        const [x, y] = this.queue.position;
        const updates = {};

        if (this.dirty("width")) {
            updates[`--width`] = `${this.width}px`;
            this.clean("width");
        }

        if (this.dirty("height")) {
            updates[`--height`] = `${this.height}px`;
            this.clean("height");
        }

        if (this.dirty("rx")) {
            updates["--rotateX"] = `${this.rotation.x}deg`;
            this.clean("rx");
        }

        if (this.dirty("scale")) {
            updates["--scale"] = `${this.scale}`;
            this.clean("scale");
        }

        if (this.dirty("bg")) {
            updates["--bg"] = `${this.bg}`;
            this.clean("bg");
        }

        if (this.dirty("x", "y")) {
            updates["--x"] = `${x}px`;
            updates["--y"] = `${y}px`;
            this.styles.update(":host", {
                transform: `translate(${x}px, ${y}px)`,
            });
            this.clean("x", "y");
        }
        console.log("rendered");
        Object.assign(this.cssVars, updates);
        html.style.cssText = cssObjectToString(this.cssVars);
    }

    onFirstConnect() {
        this.update(true);
    }

    onPropertyChanged(property, old, value) {
        console.log("opc", property, old, value);
        switch (property) {
            case "size":
                this.width = value;
                this.height = value;
                break;
        }
    }
}

export default Shape3d;

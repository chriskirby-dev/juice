/**
 * Base 2D shape component with positioning and styling.
 * Foundation for all 2D shape custom elements.
 * @module Components/Shapes/2d/Shape2d
 */

import Component from "../../Component.mjs";
import { Vector2D } from "../../../Animation/Properties/Vector.mjs";
import { Scale } from "../../../Animation/Properties/Scale.mjs";
import { Rotation } from "../../../Animation/Properties/Rotation.mjs";
import StyleProperties from "../../../Style/Styles.mjs";

/**
 * Converts CSS object to inline style string.
 * @private
 * @param {Object} styles - CSS properties object
 * @returns {string} CSS string
 */
function cssObjectToString(styles) {
    return Object.entries(styles)
        .map(([k, v]) => `${k}:${v}`)
        .join(";");
}

class Shape2d extends Component.HTMLElement {
    queue = {};

    static config = {
        name: "Shape2d",
        properties: {
            width: { type: "number", unit: "mixed", linked: true },
            height: { type: "number", unit: "mixed", linked: true },
            rotate: { type: "number", default: 0, route: "_rotation.value", unit: "deg", linked: true },
            scale: { type: "number", default: 1, route: "_scale.value", linked: true },
            x: { type: "number", default: 0, route: "position.x", linked: true },
            y: { type: "number", default: 0, route: "position.y", linked: true },
            bg: { type: "string", default: "#000", linked: true },
            size: { type: "number", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "rotate", "scale", "x", "y", "size", "bg"],
            attributes: [],
            properties: [],
        };
    }

    constructor(options) {
        super();
    }

    beforeCreate() {
        const options = {};
        this._rotation = new Rotation(options.rotate || 0);
        this.position = new Vector2D(options.x || 0, options.y || 0);
        this._scale = new Scale(options.scale || 1);
        this._offset = new Vector2D(0, 0);
        this._anchor = new Vector2D(0, 0);
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

    static html() {
        return ``;
    }

    anchor(x, y) {
        this._anchor = { x, y };
        this.element.style.transformOrigin = `${x}px ${y}px`;
    }

    offset(x, y) {
        this._offset = { x, y };
    }

    update() {
        const x = this.position.x + this._offset.x - this._anchor.x;
        const y = this.position.y + this._offset.y - this._anchor.y;
        this.queue.position = [x, y];
    }

    cssVars = {};

    render() {
        const html = this.ref("html");
        const [x, y] = this.queue.position;
        const updates = {};

        if (this.dirty("width")) {
            this.cssVars[`--width`] = `${this.width}px`;
            this.clean("width");
        }

        if (this.dirty("height")) {
            this.cssVars[`--height`] = `${this.height}px`;
            this.clean("height");
        }

        if (this.dirty("rotate")) {
            this.cssVars["--rotate"] = `${this.rotate}deg`;
            this.clean("rotate");
        }

        if (this.dirty("scale")) {
            this.cssVars["--scale"] = `${this.scale}`;
            this.clean("scale");
        }

        if (this.dirty("bg")) {
            this.cssVars["--bg"] = `${this.bg}`;
            this.clean("bg");
        }

        if (this.dirty("x", "y")) {
            this.cssVars["--x"] = `${x}px`;
            this.cssVars["--y"] = `${y}px`;
            this.styles.update(":host", {
                transform: `translate(${x}px, ${y}px)`,
            });
            this.clean("x", "y");
        }

        html.style.cssText = cssObjectToString(this.cssVars);
    }

    onFirstConnect() {
        this.update();
        this.render();
    }

    onPropertyChanged(property, old, value) {
        switch (property) {
            case "size":
                this.width = value;
                this.height = value;
                this.update();
                this.render();
                break;
        }
    }
}

export default Shape2d;
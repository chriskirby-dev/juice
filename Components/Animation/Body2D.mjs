/**
 * 2D animation body component with simplified transformations.
 * Custom element for 2D animated bodies with position, rotation, and velocity.
 * @module Components/Animation/Body2D
 */

import Velocity from "../../Animation/Properties/Velocity.mjs";
import { parseAnchor } from "../../Animation/Anchor.mjs";
import Component from "../Component.mjs";
import { Vector2D } from "../../Animation/Properties/Vector.mjs";
import Rotation from "../../Animation/Properties/Rotation.mjs";

/**
 * 2D animation body custom element with physics properties.
 * @class Body2D
 * @extends Component.HTMLElement
 */
class Body2D extends Component.HTMLElement {
    static tag = "animation-body2d";

    static config = {
        name: "animation-body2d",
        tag: "animation-body2d",
        properties: {
            width: { type: "number", default: 0, unit: "mixed", linked: true },
            height: { type: "int", default: 0, unit: "mixed", linked: true },
            x: { type: "number", route: "position.x.value", default: 0, linked: true },
            y: { type: "number", route: "position.y.value", default: 0, linked: true },
            vx: { type: "number", route: "velocity.x.value" },
            vy: { type: "number", route: "velocity.y.value" },
            r: { type: "number", route: "rotation.value", default: 0, linked: true },
            scale: { type: "number", route: "s.value", default: 1, linked: true },
            anchor: { type: "string", default: "center", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "x", "y", "r", "vx", "vy", "anchor"],
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
                    width: "100%",
                    height: "100%",
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

    animationBody = true;
    animate = true;

    dialation = 1;

    set polorVelocity(velocity) {
        this.polorControl(velocity, this.rotation.value);
    }

    polorControl(velocity, angle) {
        if (!angle) {
            angle = this.rotation.value;
        }
        this.velocity.x = velocity * Math.cos(angle);
        this.velocity.y = velocity * Math.sin(angle);
    }

    beforeCreate() {
        this.rotation = new Rotation(0);
        this.rotation.OFFSET = 90;
        this.position = new Vector2D(0, 0);
        //Degaults to Cartesian Motion Control - For using separate velocity components along the X and Y axes (velocityX and velocityY).
        if (this.hasAttribute("polor")) {
            //For using a single velocity magnitude combined with an angle (velocity and angle).
            this.polorAnimation = true;
        }

        this.velocity = new Velocity(0, 0);
        this.s = new AnimationValue(1, {
            min: 0,
        });
        this.w = new AnimationValue(0, {
            min: 0,
        });
        this.h = new AnimationValue(0, {
            min: 0,
        });

        Object.defineProperty(this, "offset", {
            get: () => {
                return {
                    x: this._offset.x * this.parent.width,
                    y: this._offset.y * this.parent.height,
                };
            },
        });

        if (this.hasAttribute("anchor")) {
            this.setAnchor(this.getAttribute("anchor"));
        }

        if (this.hasAttribute("noanimate")) {
            this.animate = false;
        }
    }

    setAnchor(value) {
        const parsed = parseAnchor(value);
        this._anchor = parsed;
        if (this.ref("html")) {
            this.ref("html").style.setProperty("--anchor-x", `${parsed.x * 100}%`);
            this.ref("html").style.setProperty("--anchor-y", `${parsed.y * 100}%`);
        }
    }

    move(x, y) {
        this.position.add(x, y);
    }

    moveTo(x, y) {
        this.position.set(x, y);
    }

    movePolor(dist, angle) {
        this.position.x.value += dist * Math.cos(angle);
        this.position.y.value += dist * Math.sin(angle);
    }

    onFirstConnect() {}

    update() {
        if (this.beforeUpdate()) {
            this.beforeUpdate();
        }

        if (this.afterUpdate()) {
            this.afterUpdate();
        }
    }

    render() {
        if (this.beforeRender) {
            this.beforeRender();
        }
    }

    onChildren(children) {
        children.forEach((child) => {
            if (child.animate) {
                this.viewer.addAnimation(child);
            }
        });
    }

    onPropertyChanged(property, prevous, value) {
        console.log(this.root, property, value);
        switch (property) {
            case "r":
                this.rotation.x.value = value;
                break;
            case "scale":
                break;

            case "anchor":
                this.setAnchor(value);
                break;
            case "width":
                this.w.value = value;
                this.render();
                break;
            case "height":
                this.h.value = value;
                this.render();
                break;
        }
    }
}

customElements.define(Body2D.tag, Body2D);
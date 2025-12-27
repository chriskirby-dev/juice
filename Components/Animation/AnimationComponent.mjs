/**
 * Base animation component for animated UI elements.
 * Provides position, rotation, scale, and velocity properties for animations.
 * @module Components/Animation/AnimationComponent
 */

import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import AnimationValue from "../../Animation/Properties/Value.mjs";
import { Rotation3D } from "../../Animation/Properties/Rotation.mjs";
import { Vector3D, Vector2D } from "../../Animation/Properties/Vector.mjs";

/**
 * Base component class for animated elements with 3D transformation properties.
 * @class AnimationComponent
 * @extends Component.HTMLElement
 * @example
 * class MyAnimatedElement extends AnimationComponent {
 *   // Custom animation logic
 * }
 */
export class AnimationComponent extends Component.HTMLElement {
    static tag = "animation-body";

    static config = {
        name: "animation-component",
        tag: "animation-component",
        properties: {
            width: { type: "int", route: "w.value", default: 0, linked: true },
            height: { type: "int", route: "h.value", default: 0, linked: true },
            x: { type: "number", route: "position.x", default: 0, linked: true },
            y: { type: "number", route: "position.y", default: 0, linked: true },
            z: { type: "number", route: "position.z", default: 0, linked: true },
            vx: { type: "number", route: "velocity.x", default: 0, linked: true },
            vy: { type: "number", route: "velocity.y", default: 0, linked: true },
            vz: { type: "number", route: "velocity.z", default: 0, linked: true },
            offset: { type: "string", default: 0 },
            r: { type: "number", default: 0, linked: true },
            rx: { type: "number", route: "rotation.x", default: 0, linked: true },
            ry: { type: "number", route: "rotation.y", default: 0, linked: true },
            rz: { type: "number", route: "rotation.z", default: 0, linked: true },
            scale: { type: "number", route: "s.value", default: 1, linked: true },
            anchor: { type: "string", default: "center", linked: true },
            debug: { type: "exists", default: false, linked: true }
        }
    };

    static get observed() {
        return {
            all: ["anchor", "x", "y", "z", "r", "rx", "ry", "rz", "scale", "vx", "vy", "width", "height", "debug"],
            attributes: ["offset", "position", "", "rx", "ry", "rz"],
            properties: []
        };
    }

    beforeCreate() {
        this.animationBody = true;
        this.visible = true;
        this.rotation = new Rotation3D(-90, 0, 0);
        this.rotation.OFFSET.x = 90;
        this.position = new Vector3D(0, 0, 0);
        this.velocity = new Vector3D(0, 0, 0);
        this.s = new AnimationValue(1, {
            min: 0
        });
        this.w = new AnimationValue(0, {
            min: 0
        });
        this.h = new AnimationValue(0, {
            min: 0
        });

        Object.defineProperty(this, "offset", {
            get: () => {
                return {
                    x: this._offset.x * this.parent.width,
                    y: this._offset.y * this.parent.height
                };
            }
        });

        if (this.hasAttribute("anchor")) {
            this.setAnchor(this.getAttribute("anchor"));
        }

        if (this.hasAttribute("noanimate")) {
            this.animate = false;
        }
    }
}

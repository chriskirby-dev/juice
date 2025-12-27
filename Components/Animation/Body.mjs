/**
 * Animation body component with 3D transformations and physics properties.
 * Custom element for animated bodies with position, rotation, velocity, and scale.
 * @module Components/Animation/Body
 */

import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import AnimationValue from "../../Animation/Properties/Value.mjs";
import { Rotation3D } from "../../Animation/Properties/Rotation.mjs";
import { Vector3D, Vector2D } from "../../Animation/Properties/Vector.mjs";
import { parseAnchor } from "../../Animation/Anchor.mjs";
import { radians } from "../../Util/Geometry.mjs";
import UnitValue from "../../Value/Unit.mjs";
import "./Marker.mjs";

import AnimationStage from "./Stage.mjs";
import AnimationSprite from "./Sprite.mjs";

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

export class AnimationBody extends Component.HTMLElement {
    static tag = "animation-body";

    animationComponent = true;
    animate = true;
    cssVars = {};

    static config = {
        name: "animation-body",
        tag: "animation-body",
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

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                    position: "absolute",
                    width: "0px",
                    height: "0px",
                    left: "0px",
                    top: "0px",
                    transform: "translate3D(var(--x), var(--y), var(--z))"
                },
                "#html": {
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    rotate: "90deg"
                },
                "#body": {
                    position: "absolute",
                    width: "var(--width )",
                    height: "var(--height )",
                    translate: "calc( -100% * var(--anchor-x)) calc( -100% * var(--anchor-y))",
                    transformOrigin: "calc(var(--anchor-x) * 100%) calc(var(--anchor-y) * 100%)",
                    scale: "var(--scale)",
                    rotate: "var(--rotation)"
                },
                slot: {
                    position: "relative",
                    display: "block",
                    width: "100%",
                    height: "100%"
                },
                ":host([debug]) #body": {
                    outline: "1px solid lime"
                },
                ".anchor": {
                    width: "10px",
                    height: "10px",
                    border: "1px solid red",
                    position: "absolute",
                    zIndex: 100,
                    top: "-5px",
                    left: "-5px",
                    borderRadius: "50%"
                },
                ".anchor .x": {
                    position: "absolute",
                    width: "2px",
                    height: "40px",
                    backgroundColor: "red",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)"
                },
                ".anchor .x:before": {
                    display: "block",
                    content: "attr(data-value)",
                    color: "#FFF",
                    background: "#000",
                    fontSize: "8px",
                    position: "absolute",
                    left: "0%",
                    rotate: "-90deg",
                    transformOrigin: "top left"
                },
                ".anchor .y": {
                    position: "absolute",
                    width: "40px",
                    height: "2px",
                    backgroundColor: "red",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)"
                },
                ".anchor .y:before": {
                    display: "block",
                    content: "attr(data-value)",
                    color: "#FFF",
                    background: "#000",
                    fontSize: "8px",
                    position: "absolute",
                    left: "calc(50% + 5px)",
                    top: "5px"
                    // rotate: "-90deg",
                },
                ".anchor .debug-stats": {
                    position: "absolute",
                    top: "50%",
                    left: "30px",
                    transform: "translateX(-50%)",
                    transformOrigin: "top left",
                    fontSize: "8px",
                    color: "white",
                    padding: "5px",
                    rotate: "-90deg",
                    whiteSpace: "nowrap"
                },
                ".anchor .debug-stats .bg": {
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    width: "100%",
                    height: "100%",
                    background: "#000",
                    opacity: 0.6,
                    zIndex: -1,
                    borderRadius: "5px"
                },
                ".anchor .debug-stats .bg:before": {
                    display: "block",
                    width: "12px",
                    height: "12px",
                    content: '""',
                    position: "absolute",
                    top: "-6px",
                    left: "calc(50% - 6px)",
                    rotate: "45deg",
                    background: "#000"
                },
                ".anchor .debug-stats .stat:after": {
                    content: "attr(data-value)"
                }
            }
        ];
    }

    static html(data = {}) {
        return `

        <div id="anchor" class="anchor">
            <div id="anchor-x" class="x"></div>
            <div id="anchor-y" class="y"></div>
            <div id="debug-stats" class="debug-stats">
                <div class="bg"></div>
                <div id="debug-size" class="stat" data-value="0,0">(w,h): </div>
                <div id="debug-position" class="stat" data-value="0,0">(x,y): </div>
                <div id="debug-rotation" class="stat" data-value="0,0">(Rotation): </div>
                <div id="debug-scale" class="stat" data-value="1">(Scale): </div>
            </div>
        </div>
        
        <div id="body" part="body" class="animation-body" >
            ${this.bodyHTML ? this.bodyHTML() : ""}
            <slot></slot>
        </div>
        `;
    }

    _offset = { x: 0, y: 0 };

    //scale = 1;

    freezeAt(x, y, z) {
        this.freeze = new Vector3D(x, y, z);
        this.position.set(x, y, z);
    }

    get innerContentBox() {
        const { width: w, height: h, scale, _anchor } = this;
        const width = w * scale;
        const height = h * scale;
        const anchor = {
            x: _anchor.x * width,
            y: _anchor.y * height
        };
        return {
            width,
            height,
            top: anchor.y,
            left: anchor.x,
            right: width - anchor.x,
            bottom: height - anchor.y
        };
    }

    get bounds() {
        const self = this;
        return {
            x: self.x,
            y: self.y,
            width: self.width * self.scale,
            height: self.height * self.scale,
            anchor: self._anchor,
            bottom: () => {
                return self.y + (1 - self._anchor.y * self.height) * Math.sin(radians(self.rotation.value));
            }
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

    setAnchor(value) {
        const parsed = parseAnchor(value);
        this._anchor = parsed;
        if (this.ref("html")) {
            const anchor = {};
            anchor["--anchor-x"] = parsed.x;
            anchor["--anchor-y"] = parsed.y;
            this.writeStyleVars(anchor);
        }
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    onPropertyChanged(property, previous, value) {
        if (this.debug) console.log(`[${this.constructor.name}] ${property}=${value}`);
        switch (property) {
            case "r":
                this.rotation.x.value = value;
                break;
            case "anchor":
                this.setAnchor(value);
                break;
        }
    }

    onAttributeChanged(property, prevous, value) {
        switch (property) {
            case "offset":
                const [x, y] = value.split(/\s(.*)/);
                this.setOffset(x, y);
                break;
        }
    }

    isInViewport() {
        if (!this.viewer) return true;
        const rect = this.getBoundingClientRect();
        const viewerRect = this.viewer.getBoundingClientRect();

        return !(
            rect.bottom < viewerRect.top ||
            rect.top > viewerRect.bottom ||
            rect.right < viewerRect.left ||
            rect.left > viewerRect.right
        );
    }

    update(time) {
        this.visible = this.isInViewport();

        if (!this.visible) return;

        if (this.velocity.dirty()) {
            this.position.add(this.velocity);
            this.velocity.clean();
        }

        if (this.rotation.dirty()) {
        }
    }
    render(time) {
        if (!this.visible) return;

        const updates = {};
        const debugUpdates = {};

        if (this.w.dirty) {
            updates["--width"] = this.w.value + "px";
            this.w.save();
        }

        if (this.h.dirty) {
            updates["--height"] = this.h.value + "px";
            this.h.save();
        }

        if (this.position.dirty()) {
            updates["--x"] = this.position.x + "px";
            updates["--y"] = this.position.y + "px";
            updates["--z"] = this.position.z + "px";
            this.position.clean();

            if (this.debug) {
                debugUpdates["position"] = `${this.position.x.toFixed(2)},${this.position.y.toFixed(2)}`;
            }
        }

        if (this.rotation.dirty("x")) {
            updates["--rotation"] = `${this.rotation.x}deg`;
            this.rotation.clean("x");

            if (this.debug) {
                debugUpdates["rotation"] = `${this.rotation
                    .toArray()
                    .map((v) => v.toFixed(2))
                    .join("deg ,")}deg`;
            }
        }

        if (this.s.dirty) {
            updates["--scale"] = `${this.scale}`;
            this.s.save();

            if (this.debug) {
                debugUpdates["scale"] = `${this.scale.toFixed(2)}x`;
            }
        }

        if (this.w.dirty || this.h.dirty) {
            if (this.debug) {
                debugUpdates["size"] = `${this.w.value.toFixed(2)}px, ${this.h.value.toFixed(2)}px`;
            }
        }

        if (Object.keys(updates).length) {
            this.writeStyleVars(updates);
        }

        if (Object.keys(debugUpdates).length) {
            Object.entries(debugUpdates).forEach(([key, value]) => {
                const el = this.ref(`debug-${key}`);
                if (el) el.setAttribute("data-value", value);
            });
        }
    }

    setOffset(left, top) {
        this.styles.update(":host", {
            top: top,
            left: left
        });
        const parentRect = this.parentNode.getBoundingClientRect();
        const rect = this.getBoundingClientRect();

        this._offset = { x: rect.left - parentRect.left, y: rect.top - parentRect.top };
    }

    absolutePosition() {
        let x = this._offset.x;
        let y = this._offset.y;
        for (let i = 0; i < this.stack.length; i++) {
            x += this.stack[i].x || 0;
            y += this.stack[i].y || 0;
        }
        return { x, y };
    }

    /**
     * Returns position relative to viewer (cached for performance).
     * This is the fast path called during animation updates.
     * @returns {Object} - An object with x and y properties
     */
    viewerPosition() {
        let isDirty = false;

        // Check if any element in stack has dirty position
        if (!this._cachedViewerPos) {
            isDirty = true;
        } else {
            for (let i = 0; i < this.stack.length; i++) {
                if (
                    this.stack[i].position &&
                    typeof this.stack[i].position.dirty === "function" &&
                    this.stack[i].position.dirty()
                ) {
                    isDirty = true;
                    break;
                }
            }
        }

        if (isDirty) {
            let x = this._offset.x;
            let y = this._offset.y;

            for (let i = 0; i < this.stack.length; i++) {
                x += this.stack[i].x || 0;
                y += this.stack[i].y || 0;
            }

            this._cachedViewerPos = { x, y };

            // ✅ Clean the dirt flags so next frame won't recalculate
            for (let i = 0; i < this.stack.length; i++) {
                if (this.stack[i].position && typeof this.stack[i].position.clean === "function") {
                    this.stack[i].position.clean();
                }
            }
        }

        return this._cachedViewerPos;
    }

    get stage() {
        return this.viewer?.stage;
    }

    /**
     * Returns the position of the element with respect to the stage.
     * This is calculated by subtracting the stage position from the viewer position.
     * @returns {Object} - An object with x and y properties that represent the position of the element with respect to the stage.
     */
    getStagePosition() {
        const viewPos = this.viewerPosition();

        // Get stage position - handle both stage and viewer
        let stageX = 0;
        let stageY = 0;

        if (this.viewer && this.viewer.stage) {
            const stage = this.viewer.stage;
            stageX = stage.position?.x || 0;
            stageY = stage.position?.y || 0;
        }

        return {
            x: viewPos.x - stageX,
            y: viewPos.y - stageY
        };
    }

    /**
     * Returns position relative to a specific ancestor element (optimized fast path).
     * @param {HTMLElement} relativeTo - The element to compute relative position to.
     * @returns {Object} - An object with x and y properties that represent the relative position of the given element.
     */
    relativePosition(relativeTo) {
        // Find the element in the stack
        const index = this.stack.indexOf(relativeTo);

        if (index === -1) {
            // Not in stack - fallback to full calculation
            let x = this.x || 0;
            let y = this.y || 0;
            let el = this.parentNode;

            while (el && el !== relativeTo && el.animationComponent) {
                x += el.x || 0;
                y += el.y || 0;
                el = el.parentNode;
            }

            return { x, y };
        }

        // Fast path: element is in stack, sum from index onwards
        let x = this._offset.x;
        let y = this._offset.y;

        for (let i = 0; i <= index; i++) {
            x += this.stack[i].x || 0;
            y += this.stack[i].y || 0;
        }

        return { x, y };
    }

    topParent() {
        return this.stack[this.stack.length - 1];
    }

    onAnimationConnect() {
        this.parent = this.parentNode;
        let el = this;
        const stack = [this];

        while (el.parentNode && !["ANIMATION-VIEWER", "BODY"].includes(el.parentNode.tagName)) {
            el = el.parentNode;
            if (el.animationComponent && !el.animationViewer) {
                stack.push(el);
            }
        }
        this.stack = stack;
        if (this.debug) console.log("stack", this.stack);
    }
}

export default AnimationBody;

customElements.define(AnimationBody.tag, AnimationBody);
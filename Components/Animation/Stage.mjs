import Component from "../Component.mjs";
import Timeline from "../../Animation/Timeline.mjs";
import { Position } from "../../Animation/Properties/Core.mjs";
import { Vector2D } from "../../Animation/Properties/Vector.mjs";
import { parseAnchor } from "../../Animation/Anchor.mjs";

class AnimationStage extends Component.HTMLElement {
    static tag = "animation-stage";

    animationComponent = true;
    animated = true;

    static allowedStates = ["initial", "actve", "inactve", "complete"];

    static config = {
        properties: {
            width: { default: 100, type: "int", unit: "percent", linked: true },
            height: { default: 100, type: "int", unit: "percent", linked: true },
            x: { default: 0, route: "position.x", type: "number", unit: "percent" },
            y: { default: 0, route: "position.y", type: "number", unit: "percent" },
            anchor: { default: "center center", type: "string" },
            frction: { default: 0.6, type: "number", unit: "coefficient" },
            gravity: { default: 9.81, type: "number", unit: "meters per second sq" },
            fps: { default: 10, type: "number", unit: "frames per second", linked: true },
            state: { default: "initial", type: "string", allowed: AnimationStage.allowedStates },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "friction", "gravity", "state", "fps", "x", "y", "anchor"],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    bottom: 0,
                    zIndex: 0,
                },
                slot: {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    zIndex: 100,
                },
                "#background": {
                    display: "block",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                },
                "#background > *": {
                    display: "block",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    left: 0,
                    top: 0,
                },
            },
        ];
    }

    static html(data = {}) {
        return `
        <div id="background"></div>
        <slot></slot>
        `;
    }

    beforeCreate() {
        this.position = new Position(0, 0);
    }

    get dimentions() {
        const { width, height } = this.getBoundingClientRect();
        return { width, height };
    }

    index = { bodies: [] };
    bodies = [];
    animations = [];

    moveTo(x, y) {
        this.position.set(x, y);
    }

    move(x, y) {
        this.position.add(x, y);
    }

    update() {
        if (this.backgrounds.length) {
            this.backgrounds.forEach((background) => {
                if (background.animate && background.update) {
                    background.update();
                }
            });
        }
    }

    render() {
        if (this.backgrounds.length) {
            this.backgrounds.forEach((background) => {
                if (background.animate && background.render) {
                    background.render();
                }
            });
        }
    }

    onAttributeChanged(property, prevous, value) {
        if (!this.root) return;

        switch (property) {
            case "width":
                this.styles.update(":host", { width: value + "px" }, "size");
                break;
            case "height":
                this.styles.update(":host", { height: value + "px" }, "size");

                break;
            case "x":
                console.log(value);
                this.x = value;
                if (this.viewer) this.position.x = value * this.width - this.viewer.center.x;
                break;
            case "y":
                this.y = value;
                if (this.viewer) this.position.y = value * this.height - this.viewer.center.y;
                break;
        }
    }

    onPropertyChanged(property, prevous, value) {
        switch (property) {
            case "fps":
                this.timeline.fps = value;
                break;
            case "width":
                this.styles.update(":host", { width: value + "px" }, "size");
                break;
            case "height":
                this.styles.update(":host", { height: value + "px" }, "size");
                break;
        }
    }

    backgrounds = [];

    addBackground(element, options = {}) {
        this.ref("background").appendChild(element);
        this.backgrounds.push({
            element: element,
            ...options,
        });
    }

    update(data) {}

    render(data) {
        if (this.viewer) {
            if (this.position.dirty) {
                const translate = `translate3d(${this.position.x}px, ${this.position.y}px,0)`;
                this.style.transform = translate;
            }
        }
    }

    onCustomChildReady(child) {
        /// if (!child) return;
        console.log("child connected", child, child.animate);
        if (this.viewer) {
            this.viewer.onAssetAdded(child);
        }
        if (this._timeline) {
            this._timeline.addAnimator(child);
        }
    }

    onFirstConnect() {
        if (this.customChildren.length > 0) {
            alert("has custom children");
        }
    }

    onViewerConnect(viewer) {
        this.viewer = viewer;
        this.position.x = -(this.x * this.width - this.viewer.center.x);
        this.position.y = -(this.y * this.height - this.viewer.height);
    }
}

export default AnimationStage;

customElements.define(AnimationStage.tag, AnimationStage);

/**
 * Animation viewer component with timeline and camera controls.
 * Main container for animated scenes with stage, camera, and debug features.
 * @module Components/Animation/Viewer
 */

import Component from "../Component.mjs";
import Timeline from "../../Animation/Timeline.mjs";
import { Vector3D, Vector2D } from "../../Animation/Properties/Vector.mjs";
import AnimationStage from "./Stage.mjs";
import AnimationBody from "./Body.mjs";
import AnimationSprite from "./Sprite.mjs";
import AnimationStats from "./Stats.mjs";
import Camera from "./Camera.mjs";

/**
 * Viewer component for displaying and controlling animations.
 * @class AnimationViewer
 * @extends Component.HTMLElement
 */
export class AnimationViewer extends Component.HTMLElement {
    static tag = "animation-viewer";

    static allowedStates = ["initial", "actve", "inactve", "complete"];

    animationComponent = true;
    animationViewer = true;

    static config = {
        properties: {
            width: { default: 100, type: "number", unit: "percent" },
            height: { default: 100, type: "number", unit: "percent" },
            fps: { default: 60, type: "number", unit: "frames per second", linked: true },
            state: { default: "initial", type: "string", allowed: AnimationViewer.allowedStates },
            follow: { default: false, type: "string" },
            debug: { default: false, type: "exists", linked: true }
        }
    };

    static get observed() {
        return {
            all: ["width", "height", "fps", "state", "follow", "debug"]
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    position: "relative",
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden"
                },
                slot: {
                    display: "block",
                    position: "absolute",
                    width: "100%",
                    height: "100%"
                },
                "#background": {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    top: 0,
                    left: 0,
                    zIndex: -1
                },
                "#parallax": {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                    overflow: "hidden"
                },
                "#world": {
                    position: "absolute",
                    width: "var(--width, 100% )",
                    height: "var( --height, 100% )"
                }
            }
        ];
    }

    static html(data = {}) {
        return `
        <div id="background">
            <div id="parallax"></div>
            <div id="world"></div>
        </div>
        <slot></slot>`;
    }

    stage;
    index = [];
    animatedAssets = [];

    constructor() {
        super();
        this.camera = new Camera(this);
        if (!this.timeline) {
            this.timeline = new Timeline(this, { defer: true, fps: this.fps });

            this.timeline.update = this.update.bind(this);

            this.timeline.afterUpdate((time) => {
                this.updateCamera(time);
            });

            this.timeline.render = this.render.bind(this);

            this.timeline.complete = () => {};
        }
    }

    get center() {
        return { x: this.width / 2, y: this.height / 2 };
    }

    onResize(w, h) {
        this.width = w;
        this.height = h;
        this.dispatchEvent(new CustomEvent("resize", { detail: { width: w, height: h } }));
    }

    changes = {};

    onStageConnect(stage) {
        this.stage = stage;
        stage.viewer = this;

        const stageWidth = stage.width;
        const stageHeight = stage.height;

        this.max = {
            x: stageWidth - this.width,
            y: stageHeight - this.height
        };
        this.min = {
            x: 0,
            y: 0
        };

        stage.onViewerConnect(this);

        // Add stage to timeline so its update/render methods are called
        this.onAssetAdded(stage);
        console.log("Stage Added");

        this.dispatchEvent(new CustomEvent("stageconnect", { detail: { stage } }));
    }

    onTargetConnect(target) {
        this.target = target;
    }

    onChildren(children) {
        console.log("VIEWER CHILDREN", children);
        if (children) {
            children.forEach((asset) => {
                if (asset.animate) {
                    this.onAssetAdded(asset);
                }
            });
        }
    }

    onCustomChildReady(child) {
        if (child.animate) {
        }
    }

    cache = { stage_rect: "" };

    updateCamera(time) {
        this.camera.update(time);
    }

    update(time) {
        if (this.stage) {
            const stageRect = this.stage.getBoundingClientRect();
            const stageRectValue = `T: ${stageRect.top}, L: ${stageRect.left}, W: ${stageRect.width}, H: ${stageRect.height}`;
            this.stats.stage_rect = stageRectValue;
        }

        const viewSizeValue = `W: ${this.width}, H: ${this.height}`;
        if (this.stats) {
            this.stats.update(time);
            this.stats.view_size = viewSizeValue;
        }
    }

    render() {
        this.camera.render();
    }

    onCustomChildConnect(child) {
        console.log("VIEWER CHILD", child);
        if (child.hasAttribute("noanimate")) {
            return false;
        }
        if (child instanceof AnimationStage) {
            console.log("AnimationStage");

            this.onStageConnect(child);
        } else if (child instanceof AnimationBody) {
            console.log("AnimationBody");
            this.onAssetAdded(child);
        } else if (child instanceof AnimationSprite) {
            console.log("AnimationSprite");
            this.onAssetAdded(child);
        } else if (["animation-stage", "animation-body", "animation-sprite"].includes(child.tagName.toLowerCase())) {
            this.onAssetAdded(child);
        } else if (child.animationComponent) {
            this.onAssetAdded(child);
        }
    }

    updateCamera(time) {
        this.camera.update(time);
    }

    follow(target) {
        this.following = target;
        this.camera.follow(target);
    }

    animations = [];
    onAssetAdded(asset) {
        console.log("Add Animation", asset);
        this.index.push(asset.id);
        this.animatedAssets.push(asset);
        asset.viewer = this;

        if (!this.stage && asset instanceof AnimationStage) {
            console.log("AnimationStage");
            return this.onStageConnect(asset);
        }

        if (asset.animate) this.timeline.addAnimator(asset);

        if (asset.onAnimationConnect) asset.onAnimationConnect(this);

        if (asset.tagName) {
            asset.dispatchEvent(new CustomEvent("animationconnect"));
        }
    }

    onFirstConnect() {
        const { width, height } = this.getBoundingClientRect();
        this.width = width;
        this.height = height;

        if (this.hasAttribute("stats")) {
            const stats = document.createElement("animation-stats");
            this.appendChild(stats);

            stats.addEventListener("ready", () => {
                stats.addStat("stage_rect", "");
                stats.addStat("view_size", "");
            });
            console.dir(stats);
            this.stats = stats;
        }

        this.onTimelineReady(this.timeline);
        this.timelineReady = true;
    }

    onTimelineReady() {
        return true;
    }

    /***
     * ANIMATION LAYERS
     */

    namedLayers = {};
    addLayer(name, options = {}) {
        if (!options.index) index = this.layers.length;
        const layers = this.layers;
        const layer = document.createElement("animation-layer");
        if (options.type) layer.setAttribute("type", options.type);
        if (name) layer.setAttribute("name", name);
        if (options.index) layer.setAttribute("index", options.index);
        if (options.width) layer.setAttribute("width", options.width);
        if (options.height) layer.setAttribute("height", options.height);
        this.insertBefore(layer, this.layers[index]);
        this.layers.splice(index, 0, layer);
        if (name) {
            this.namedLayers[name] = layer;
        }
    }

    appendLayer(name, options = {}) {
        options.index = this.layers.length;
        return this.addLayer(name, options);
    }

    prependLayer(name, options = {}) {
        options.index = 0;
        return this.addLayer(name, options);
    }

    layer(indexOrName = 0) {
        if (typeof indexOrName == "string") {
            return this.namedLayers[indexOrName];
        }
        return this.layers[indexOrName];
    }
}

customElements.define(AnimationViewer.tag, AnimationViewer);

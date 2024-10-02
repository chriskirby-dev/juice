import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import { Canvas, CanvasImageData } from "../../Graphics/Canvas.mjs";
import GraphicAsset from "../../Asset/Graphic.mjs";
import { AnimationValue } from "../../Animation/Properties/Value.mjs";
import SpriteSheet from "../../Graphics/WebGL/SpriteSheet.mjs";
export function sheetMap(tileSize, sheetSize, startX, startY) {
    const map = [];
    for (let y = startY; y < sheetSize; y += tileSize) {
        for (let x = startX; x < sheetSize; x += tileSize) {
            map.push({ x, y });
        }
        startX = 0;
        startY += tileSize.y;
    }
    return map;
}

export class AnimationSprite extends Component.HTMLElement {
    static tag = "animation-sprite";

    animationComponent = true;

    static config = {
        name: "animation-sprite",
        tag: "animation-sprite",
        properties: {
            src: { type: "string", default: "", linked: true },
            width: { type: "int", default: 0, linked: true },
            height: { type: "int", default: 0, linked: true },
            frames: { type: "int", default: 1, linked: true },
            frame: { type: "int", default: null, linked: true },
            tempo: { type: "float", default: 0.1, linked: true },
            loop: { type: "exists", default: false, linked: true },
            auto: { type: "exists", default: false, linked: true },
            noanimation: { type: "exists", default: false, linked: true },
            in: { type: "int", default: 0, linked: true },
            out: { type: "int", default: 0, linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "src", "frame", "frames", "tempo", "loop", "in", "out", "auto"],
            attributes: [],
            properties: [],
        };
    }

    static html() {
        return `
            <div id="spritesheet"></div>
            <div id="view">
                <slot></slot>
            </div>
        `;
    }

    static get style() {
        return [
            {
                "#view": {
                    position: "relative",
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                },
                "::slotted(img)": {
                    position: "absolute",
                    display: "block",
                    top: "0",
                    left: "0",
                    width: "auto",
                    height: "100% !important",
                    maxWidth: "none !important",
                },
                "#spritesheet": {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                },
                "#spritesheet > *": {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    views = {};
    sheet = null;
    onFirstConnect() {
        this.sheet = new SpriteSheet(this.width, this.height, this.ref("spritesheet"));

        this.frame = this.in || 0;
        if (this.noanimation) {
        }

        if (this.auto) {
            this.paused = false;
        }

        if (!this.out) this.out = this.frames;
        let w = this.width,
            h = this.height;

        if (this.src) {
            this.sheet.addSheet(this.src).then(() => {
                this.sheet.render(true);
            });
        }
    }

    queued = null;
    time = 0;
    last = {};
    dirty = false;
    paused = true;

    update(data) {
        if (this.paused) return;
        this.time += data.delta;

        if (this.auto) {
            //Loop Aniumation
            if (this.time - this.last.time > this.tempo) {
                //Step Forward
                this.next();
            }
        }
    }
    render(force = false) {
        if (!force && (this.paused || !this.dirty)) return;
        this.sheet.render();

        this.dirty = false;
    }

    next() {
        let next = this.frame + 1;
        if (next > this.out) {
            next = this.loop ? this.in : this.out;
            if (!this.loop) this.paused = true;
        }
        this.frame = next;
    }

    prev() {
        let prev = this.frame - 1;
        if (prev < this.in) {
            prev = this.out;
        }
        this.frame = prev;
    }

    activeLayers = [];
    layers = {};

    addSheet(src, width, height) {
        this.sheet.addSheet(src, width, height);

        return layer;
    }

    onPropertyChanged(property, old, value) {
        switch (property) {
            case "frame":
                this.last.frame = old || 0;
                //console.log("Sprite Frame", value);
                this.ref("html").style.setProperty("--frame", value);
                this.dirty = false;
                this.last.time = this.time;
                if (this.sheet) {
                    this.sheet.frame = value;
                    this.sheet.render();
                }
                break;
            case "width":
                this.styles.update(":host", {
                    width: value + "px",
                });
                break;
            case "height":
                this.styles.update(":host", {
                    height: value + "px",
                });
                break;
        }
    }
}

customElements.define(AnimationSprite.tag, AnimationSprite);

export default AnimationSprite;

import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import { Canvas, CanvasImageData } from "../../Graphics/Canvas.mjs";
import GraphicAsset from "../../Asset/Graphic.mjs";
import { AnimationValue } from "../../Animation/Properties/Value.mjs";

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

class SpriteSheet {
    static map(tileSize, sheetSize, startX, startY) {
        const map = [];
        let x = startX;
        let y = startY;
        for (y = startY; y < sheetSize.height; y += tileSize.height) {
            for (x = startX; x < sheetSize.width; x += tileSize.width) {
                map.push({ x, y });
            }
        }
        return map;
    }

    width = 0;
    height = 0;
    map = {};
    canvas = null;
    _filter = null;

    set filter(value) {
        if (this._filter == value) return;
        this._filter = value;
        this.dirty = true;
    }

    get filter() {
        return this._filter;
    }

    constructor(src, options = {}) {
        this.src = src;
        this.options = options;
        this.isReady = true;
        if (src) this.initialiize(options);
    }

    imageData() {
        return new CanvasImageData(this.canvas, this.width, this.height);
    }

    ready(fn) {
        this._ready = fn;
    }

    drawTo(ctx, tileId, options = "default") {
        console.log("drawto", tileId, options);
        if (typeof options == "string") {
            options = { group: options };
        }
        const tile = tileId - 1;
        if (!this.map[options.group || "default"][tile]) return;
        const { x, y } = this.map[options.group][tile] || { x: 0, y: 0 };

        //if (this.filter) ctx.filter = "brightness(0%)";
        ctx.drawImage(this.canvas, x, y, this.tile.width, this.tile.height, 0, 0, this.tile.width, this.tile.height);
        this.last = { x, y };
    }

    drawXYTo(ctx, x, y) {
        //if (this.filter) ctx.filter = "brightness(0%)";
        ctx.drawImage(this.canvas, x, y, this.tile.width, this.tile.height, 0, 0, this.tile.width, this.tile.height);
        this.last = { x, y };
    }

    append(src, options = {}) {
        let startW = this.width;
        let startH = this.height;
        let startData = this.ctx.getImageData();

        return new Promise((resolve, reject) => {
            const asset = new GraphicAsset(src);
            asset.load().then((resp) => {
                const width = Math.max(resp.width, startW);
                const height = startH + resp.height;
                this.canvas = new OffscreenCanvas(width, height);
                this.ctx = this.canvas.getContext("2d");
                this.ctx.putImageData(startData, 0, 0);
                this.canvas.drawImage(resp.graphic, 0, startH);
                const map = SpriteSheet.map(this.tile, { width: this.width, height: this.height }, 0, startH);
                if (options.mapId) {
                    this.map[options.mapId] = map;
                }
                this.map.default = this.map.default.concat(map);
            });
        });
    }

    initialiize(options = {}) {
        console.log("OPTIONS", options);
        const self = this;
        if (options.tile) {
            this.tile = options.tile;
        }
        this.map = { default: options.map || [] };
        const asset = new GraphicAsset(this.src);
        asset.load().then((resp) => {
            console.log(resp);
            self.width = resp.width;
            self.height = resp.height;
            self.canvas = new OffscreenCanvas(self.width, self.height);

            self.ctx = self.canvas.getContext("2d");
            if (options.filter) {
                self.ctx.filter = options.filter;
            }
            if (resp.type == "imagedata") {
                self.ctx.putImageData(resp.asset, 0, 0);
            } else {
                self.ctx.drawImage(resp.asset, 0, 0);
            }
            const map = SpriteSheet.map(self.tile, { width: this.width, height: this.height }, 0, 0);
            this.map.default = map;
            self.isReady = true;
            if (self._ready) this._ready();
        });
    }
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
            frames: { type: "int", default: "1", linked: true },
            frame: { type: "int", default: 0, linked: true },
            tempo: { type: "float", default: 0.1, linked: true },
            loop: { type: "exists", default: false, linked: true },
            auto: { type: "exists", default: false, linked: true },
            noanimation: { type: "exists", default: false, linked: true },
            in: { type: "int", default: 1, linked: true },
            out: { type: "int", default: 0, linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "src", "frame", "frames", "tempo", "loop", "in", "out"],
            attributes: [],
            properties: [],
        };
    }

    static html() {
        return `
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
                canvas: {
                    position: "absolute",
                    top: "0",
                    left: "0",
                },
            },
        ];
    }

    views = {};
    sheet = null;
    onFirstConnect() {
        if (this.noanimation) {
        }

        if (this.auto) {
            this.paused = false;
        }

        if (!this.out) this.out = this.frames;
        let w = this.width,
            h = this.height;

        this.addLayer("default", {
            source: this.src,
            callback: () => {
                this.dispatchEvent(new CustomEvent("loaded"));
            },
        });
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
    render() {
        if (this.paused) return;
        console.log("render");
        //if (!this.dirty) return;

        this.activeLayers.forEach((layer) => {
            console.log(layer.frame.value, layer.frame.dirty);
            if (layer.frame.dirty) {
                console.log("RENDERING LAYER", layer.id, layer.frame, layer.filter.value);
                layer.render();
                layer.frame.save();
            }
        });

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

    addLayer(id, options = {}) {
        const sprite = this;

        const renderer =
            options.renderer ||
            new Canvas({
                width: this.width,
                height: this.height,
                id: id,
            });

        if (options.index !== undefined) renderer.native.style.zIndex = options.index;

        renderer.appendTo(this.ref("view"));

        const layer = {
            id: id,
            renderer: renderer,
            filter: new AnimationValue(""),
            frame: new AnimationValue(options.frame || sprite.frame, { debug: true }),
            sheet: new SpriteSheet(options.source, {
                tile: { width: sprite.width, height: sprite.height },
                filter: options.filter || null,
            }),
        };

        layer.sheet.ready(() => {
            layer.sheet.drawTo(renderer.ctx, layer.frame.value);
            layer.frame.save();
            if (options.callback) options.callback();
        });

        layer.render = () => {
            if (layer.frame.dirty || layer.filter.dirty) {
                console.log("RENDERING LAYER", layer.id, layer.frame, layer.filter.value);
                renderer.ctx.clearRect(0, 0, renderer.width, renderer.height);
                renderer.ctx.filter = layer.filter.value;
                layer.sheet.drawTo(renderer.ctx, layer.frame.value);
                layer.filter.save();
                layer.frame.save();
            }
        };

        sprite.activeLayers.push(layer);
        sprite.layers[id] = layer;

        return layer;
    }

    layer(id) {
        return this.layers[id];
    }

    onPropertyChanged(property, old, value) {
        switch (property) {
            case "frame":
                console.log("Sprite Frame", value);
                this.activeLayers.forEach((layer) => {
                    layer.frame.value = value;
                    layer.render();
                });
                this.dirty = false;
                this.last.frame = value;
                this.last.time = this.time;
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

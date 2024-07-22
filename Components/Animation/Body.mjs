import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import AnimationValue from "../../Animation/Properties/Value.mjs";
import Rotation from "../../Animation/Properties/Rotation.mjs";
import { Vector3D, Vector2D } from "../../Animation/Properties/Vector.mjs";
import { parseAnchor } from "../../Animation/Anchor.mjs";
import { radians } from "../../Util/Geometry.mjs";
import UnitValue from "../../Value/Unit.mjs";
export class AnimationBody extends Component.HTMLElement {
    static tag = "animation-body";

    animationComponent = true;
    animated = true;

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
            scale: { type: "number", route: "s.value", default: 1, linked: true },
            anchor: { type: "string", default: "center", linked: true },
            debug: { type: "exists", default: false, linked: true },
        },
    };

    //scale = 1;

    static get observed() {
        return {
            all: ["anchor", "x", "y", "z", "r", "scale", "vx", "vy", "width", "height", "debug"],
            attributes: ["offset", "position", "", "rx", "ry", "rz"],
            properties: [],
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
                },
                "#html": {
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    rotate: "90deg",
                    transformOrigin: "var(--anchor-x) var(--anchor-y)",
                },
                "#body": {
                    position: "absolute",
                    width: "var(--width )",
                    height: "var(--height )",

                    translate: "calc(var(--anchor-x) * -1) calc(var(--anchor-y) * -1)",
                    transformOrigin: "var(--anchor-x) var(--anchor-y)",
                    transform: "rotate(var(--rotation)) scale(var(--scale))",
                },
                slot: {
                    position: "relative",
                    display: "block",
                    width: "100%",
                    height: "100%",
                },
                ":host([debug]) #body": {
                    outline: "1px solid lime",
                },
                ".anchor": {
                    width: "10px",
                    height: "10px",
                    border: "1px solid red",
                    position: "absolute",
                    zIndex: 100,
                    top: "-5px",
                    left: "-5px",
                    borderRadius: "50%",
                },
                ".anchor .x": {
                    position: "absolute",
                    width: "2px",
                    height: "40px",
                    backgroundColor: "red",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
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
                    transformOrigin: "top left",
                },
                ".anchor .y": {
                    position: "absolute",
                    width: "40px",
                    height: "2px",
                    backgroundColor: "red",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                },
                ".anchor .y:before": {
                    display: "block",
                    content: "attr(data-value)",
                    color: "#FFF",
                    background: "#000",
                    fontSize: "8px",
                    position: "absolute",
                    left: "calc(50% + 5px)",
                    top: "5px",
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
                    whiteSpace: "nowrap",
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
                    borderRadius: "5px",
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
                    background: "#000",
                },
                ".anchor .debug-stats .stat:after": {
                    content: "attr(data-value)",
                },
            },
        ];
    }

    static html(data = {}) {
        return `<div id="anchor" class="anchor">
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
            <slot></slot>
            </div>
        </div>
        `;
    }

    get innerContentBox() {
        const { width: w, height: h, scale, _anchor } = this;
        const width = w * scale;
        const height = h * scale;
        const anchor = {
            x: _anchor.x * width,
            y: _anchor.y * height,
        };
        return {
            width,
            height,
            top: anchor.y,
            left: anchor.x,
            right: width - anchor.x,
            bottom: height - anchor.y,
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
            },
        };
    }

    beforeCreate() {
        this.animationBody = true;
        this.rotation = new Rotation(-90, { offset: 90 });
        this.position = new Vector3D(0, 0, 0);
        this.velocity = new Vector3D(0, 0, 0);
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
        console.log(parsed);
        if (this.ref("html")) {
            /*
            this.styles.update(":host", {
                transformOrigin: `-${parsed.x * this.height}px -${parsed.y * this.width}px`,
            });
            */
            this.ref("html").style.setProperty("--anchor-x", `${parsed.x * 100}%`);
            this.ref("html").style.setProperty("--anchor-y", `${parsed.y * 100}%`);
        }
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    onPropertyChanged(property, prevous, value) {
        console.log(this.root, property, value);
        switch (property) {
            case "r":
                this.rotation.value = value;
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

    onAttributeChanged(property, prevous, value) {
        switch (property) {
            case "offset":
                const [x, y] = value.split(/\s(.*)/);
                this.setOffset(x, y);
                break;
        }
    }

    update() {
        // console.log(this.velocity.dirty);
        if (this.velocity.dirty) {
            this.position.add(this.velocity);
            this.velocity.save();
        }

        if (this.rotation.dirty) {
        }
    }
    render(time) {
        if (this.debug) {
            if (this.position.dirty) {
                this.ref("debug-position").setAttribute(
                    "data-value",
                    `${this.position.x.toFixed(2)},${this.position.y.toFixed(2)}`
                );
            }
            if (this.rotation.dirty) {
                this.ref("debug-rotation").setAttribute("data-value", `${this.rotation.value.toFixed(2)}deg`);
            }
            if (this.dirty("scale")) {
                this.ref("debug-scale").setAttribute("data-value", `${this.scale.toFixed(2)}x`);
            }
            if (this.w.dirty || this.h.dirty) {
                this.ref("debug-size").setAttribute(
                    "data-value",
                    `${this.w.value.toFixed(2)}px, ${this.h.value.toFixed(2)}px`
                );
            }
        }

        if (this.w.dirty) {
            const w = this.w.value;
            this.ref("html").style.setProperty("--width", w + "px");
        }

        if (this.h.dirty) {
            const h = this.h.value;
            this.ref("html").style.setProperty("--height", h + "px");
        }

        //console.log("position", this.position.dirty);
        if (this.position.dirty) {
            const translate = `translate3d(${this.position.x}px, ${this.position.y}px, ${this.position.z}px)`;
            // console.log(translate);
            this.style.transform = translate;
            this.position.save();
        }

        if (this.rotation.dirty) {
            //  console.log("rotation dirty");
            this.ref("html").style.setProperty("--rotation", this.rotation.value + "deg");
            this.rotation.save();
        }

        if (this.dirty("scale")) {
            this.ref("html").style.setProperty("--scale", this.scale);
            this.clean("scale");
        }
    }

    _offset = { x: 0, y: 0 };
    setOffset(left, top) {
        this.styles.update(":host", {
            top: top,
            left: left,
        });

        const rect = this.getBoundingClientRect();

        this._offset = { x: rect.left, y: rect.top };
    }

    viewerPosition() {
        return this.stack.reduce(
            (acc, el) => {
                acc.x += el.x;
                acc.y += el.y;
                return acc;
            },
            { x: this._offset.x, y: this._offset.y }
        );
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
            if (el.animationComponent) {
                stack.push(el);
            }
        }
        this.stack = stack;
        console.log(this.stack);
        //this.animation.update();
        //this.animation.render();
        this.setupObservers();
        document.addEventListener("resize", () => {});
    }

    setupObservers() {
        let intersectionObserver = new IntersectionObserver(
            (entries, observer) => {
                console.log("INTERSECT", entries);
                const isVisible = entries[0].isVisible;
                const rect = entries[0].boundingClientRect;
                const rootBounds = entries[0].rootBounds;
                if (this.visible !== isVisible) {
                    if (
                        rect.top > rootBounds.bottom ||
                        rect.bottom < rootBounds.top ||
                        rect.left > rootBounds.right ||
                        rect.right < rootBounds.left
                    ) {
                        this.visible = false;
                    } else {
                        this.visible = true;
                    }
                }

                if (this.visible) {
                    if (rect.top > rootBounds.bottom || rect.bottom < rootBounds.top) {
                    }
                }
            },
            {
                root: this.viewer,
                rootMargin: "0px",
                threshold: [0, 1],
            }
        );

        intersectionObserver.observe(this);
    }

    onObservePosition(rect) {
        console.log("onPosition", this, rect);
    }
}

export default AnimationBody;

customElements.define(AnimationBody.tag, AnimationBody);

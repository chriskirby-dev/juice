import Component from "../Component.mjs";
import Observe from "../../Dom/Observe/Observe.mjs";
import { lerp, diff, fixedClamp } from "../../Util/Math.mjs";
import AnimationValue from "../../Animation/Properties/Value.mjs";
import { Ease, easeInOutQuad, easeOutSine } from "../../Animation/Easing.mjs";

class ScrollBar extends Component.HTMLElement {
    static tag = "scroll-bar";

    static config = {
        name: "scroll-bar",
        properties: {
            axis: { type: "string", default: "y", linked: true },
            hidden: { type: "exists", default: false, linked: true },
            width: { type: "int", default: 0, linked: true },
            height: { type: "int", default: 0, linked: true },
            color: { type: "string", default: "#000000", linked: true },
            bgcolor: { type: "string", default: "#ffffff", linked: true },
            align: { type: "string", default: "right", linked: true },
            value: { type: "number", default: 0, linked: true },
        },
    };

    offset = 0;

    scrollSpeed = 0.025;
    visible;

    scroll = {
        current: {
            percent: 0,
            value: 0,
        },
        target: {
            percent: 0,
            value: 0,
        },
    };
    constructor() {
        super();

        this.onHandleMove = this.onHandleMove.bind(this);
        this.onHandleDown = this.onHandleDown.bind(this);
        this.onHandleUp = this.onHandleUp.bind(this);
    }

    static get observed() {
        return {
            all: ["color", "bgcolor", "axis", "align", "width", "height", "hidden"],
        };
    }

    static html() {
        return `
            <div id="bar" part="bar">
                <div id="handle" part="handle" ></div>
            </div>
        `;
    }

    static get style() {
        return [
            {
                ":host": {
                    position: "absolute",
                    display: "block",
                    zIndex: 10,
                    overflow: "hidden",
                },
                ":host([hidden])": {
                    display: "none",
                },
                ':host([axis="x"])': {
                    width: "100%",
                    position: "absolute",
                    height: "20px",
                },
                ':host([axis="y"])': {
                    height: "100%",
                    position: "absolute",
                    width: "20px",
                },

                ':host([align="right"])': {
                    top: 0,
                    right: 0,
                },
                ':host([align="left"])': {
                    top: 0,
                    left: 0,
                },
                ':host([align="top"])': {
                    top: 0,
                    left: 0,
                },
                ':host([align="bottom"])': {
                    bottom: 0,
                    left: 0,
                },
                "#handle": {
                    position: "absolute",
                    display: "block",
                    width: "25px",
                    height: "25px",
                    overflow: "hidden",
                    backgroundColor: "#666",
                    cursor: "grab",
                },
                "#bar": {
                    position: "relative",
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                },
                ':host([axis="y"]) #handle': {
                    width: "100%",
                },
                ':host([axis="x"]) #handle': {
                    height: "100%",
                },
            },
        ];
    }

    onFirstConnect() {
        if (this.hasAttribute("content")) {
            this.content = document.querySelector(this.getAttribute("content"));
        } else {
            this.content = document.body;
        }

        Observe.resize(this.content, this.onContentResize.bind(this));

        this.handle = this.ref("handle");
        this.bar = this.ref("bar");
        this.content.addEventListener("wheel", this.onWheel.bind(this));
        this.handle.addEventListener("pointerdown", this.onHandleDown, false);
    }

    onWheel(event) {
        event.preventDefault();
        //  console.log(this.clamp);
        // Normalize the scroll delta
        const delta = event.deltaY || event.detail || event.wheelDelta;
        //  console.log(delta);
        const pixels = delta * this.scrollSpeed * 60;
        this.scroll.target.value = Math.max(0, Math.min(this.maxContentOffset, this.scroll.target.value + pixels));
        // this.targetOffset += delta * this.scrollSpeed;
        this.scroll.target.percent = this.scroll.target.value / this.maxContentOffset;
        // Clamp the target scroll position within content bounds
        // console.log(this.scroll.target);
        if (!this.scrolling) this.smoothScroll();
        // Prevent default scroll behavior
    }

    onHandleDown(e) {
        const clientProp = "client" + this.axis.toUpperCase();
        const rect = this.getBoundingClientRect();
        const elementOffset = {
            x: e.pageX + e.target.offsetLeft,
            y: e.pageY + e.target.offsetTop,
        };

        this.offset = e[clientProp] - elementOffset[this.axis];

        this.grabbed = {
            clientProp,
            client: e[clientProp],
            offset: this.offset,
            rect,
            elementOffset: elementOffset,
        };

        this.handle.setPointerCapture(e.pointerId);
        window.addEventListener("pointermove", this.onHandleMove);
        window.addEventListener("pointerup", this.onHandleUp);
    }
    onHandleMove(e) {
        // if (!this.grabbed) return;
        const { grabbed } = this;
        const currentClient = e[grabbed.clientProp];
        const difference = currentClient - grabbed.client;
        const draggedOffset = grabbed.offset + difference;

        //Calc Percent of visible content
        this.scroll.target.percent = this.clamp(draggedOffset) / this.maxOffset;
        this.scroll.target.value = this.scroll.target.percent * this.maxContentOffset;
        // console.log(this.scroll.target);
        //If not scrolling, smooth scroll
        if (!this.scrolling) this.smoothScroll();
    }

    onHandleUp(event) {
        this.handle.releasePointerCapture(event.pointerId);
        window.removeEventListener("pointermove", this.onHandleMove);
        window.removeEventListener("pointerup", this.onHandleUp);
        this.handle.addEventListener("pointerdown", this.onHandleDown);
    }

    smoothScroll() {
        // console.log("SMOOTH SCROLL");
        const self = this;
        if (this.scrolling) return;
        //Set Scrolling flag to true
        this.scrolling = true;
        const { current, target } = this.scroll;
        //Set target Offset determines where the content
        //and habdle should be positioned
        let targetPercent = target.percent;

        const start = { ...current };
        // console.log("CURRENT OFFSET", start.percent, "TARGET OFFSET", target.percent);
        //Start Position of content
        // console.log("START POSITION", start.value, "TARGET POSITION", target.value);
        //Total distance between start and target position
        let TOTAL_CHANGE = target.percent - start.percent;
        let TARGET_PERCENT = target.percent;
        let distance;
        let progress = 0;

        // console.log("TOTAL_CHANGE", TOTAL_CHANGE);

        function scrollAnimation(currentTime) {
            // console.log("scrollAnimation called");
            //Check if targetOffset has changed
            if (target.percent !== TARGET_PERCENT) {
                //  console.log("TARGET OFFSET CHANGE FROM", TARGET_PERCENT, "-->", target.percent);
                //If so, set the new target position and total distance
                TARGET_PERCENT = target.percent;
                TOTAL_CHANGE = target.percent - start.percent;
                progress = (current.percent - start.percent) / TOTAL_CHANGE;
            }

            distance = TARGET_PERCENT - current.percent;

            progress += this.scrollSpeed;
            // console.log("progress", progress);
            //            const scrollOffset = (distance * progress) / totalDistance;
            current.percent = start.percent + TOTAL_CHANGE * progress;
            current.value = current.percent * (this.maxContentOffset - this.height);

            // console.log("TOTAL_CHANGE", TOTAL_CHANGE, "distance", distance, "scrollOffset", current.percent);
            //  const ease = easeOutCubic(progress);
            //  const scrollOffset = lerp(startPosition, targetPosition, ease);
            // console.log(current);
            this.content.style.transform = `translate3d(0, -${current.value}px, 0)`;
            // console.log("content.style.transform set to", `translate3d(0, -${current.value}px, 0)`);
            // window.scrollTo(0, startPosition + distance * ease);

            this.offset = target.percent * this.maxOffset;
            this.handle.style.top = `${this.offset}px`;

            if (this.hooks.length > 0) {
                for (let i = 0; i < this.hooks.length; i++) {
                    this.hooks[i](current);
                }
            }

            if (progress < 1) {
                requestAnimationFrame(scrollAnimation);
            } else {
                this.scrolling = false;
                //   console.log("this.scrolling set to", false);
            }
        }

        scrollAnimation = scrollAnimation.bind(this);

        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        function easeOutCubic(t) {
            return --t * t * t + 1;
        }

        requestAnimationFrame(scrollAnimation);
    }

    resizeHandle() {
        if (this.axis == "x") {
            this.handleSize = this.width * this.scale;
            this.styles.update("#handle", {
                width: this.handleSize + "px",
                height: "100%",
            });
            this.maxOffset = this.width - this.handleSize;
        } else {
            this.handleSize = this.height * this.scale;
            this.styles.update("#handle", {
                width: "100%",
                height: this.handleSize + "px",
            });
            this.maxOffset = this.height - this.handleSize;
        }
        this.clamp = fixedClamp(0, this.maxOffset);
    }

    onResize(w, h) {
        this.width = w;
        this.height = h;
        console.log(w, h);
        if (this.contentHeight) {
            if (this.axis == "x") {
                this.scale = this.width / this.contentWidth;
                this.ratio = 1 / this.scale;
            } else {
                this.scale = this.height / this.contentHeight;
                this.ratio = 1 / this.scale;
                console.log(this.scale, this.ratio);
            }
            this.resizeHandle();
        }
    }

    onContentResize(w, h) {
        this.contentWidth = w;
        this.contentHeight = h;
        this.maxContentOffset = this.contentHeight - this.height;

        if (this.height) {
            if (this.axis == "x") {
                this.scale = this.width / this.contentWidth;
                this.ratio = 1 / this.scale;
            } else {
                this.scale = this.height / this.contentHeight;
                this.ratio = 1 / this.scale;
            }
            this.resizeHandle();
        }
    }

    hooks = [];
    hook(fn) {
        this.hooks.push(fn);
    }

    show() {
        this.visible = true;
        this.dispatchEvent(new Event("show"));
    }
    hide() {
        this.visible = false;
        this.dispatchEvent(new Event("hide"));
    }

    build() {}

    onPropertyChanged(prop, previous, value) {
        switch (prop) {
            case "color":
                break;
            case "bgcolor":
                break;
            case "axis":
                break;
            case "align":
                break;
            case "hidden":
                if (value) {
                }
                break;
        }
    }
}

customElements.define("scroll-bar", ScrollBar);

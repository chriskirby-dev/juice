import Component from "../Component.mjs";
import Observe from "../../Dom/Observe/Observe.mjs";
import { lerp, diff, fixedClamp } from "../../Util/Math.mjs";
import Timeline from "../../Animation/Timeline.mjs";
import AnimationValue from "../../Animation/Properties/Value.mjs";
import "./ScrollBar.mjs";
function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
}
class ScrollView extends Component.HTMLElement {
    static tag = "scroll-view";

    static config = {
        name: "scroll-view",
        properties: {
            x: { type: "int", default: 0, linked: true },
            y: { type: "int", default: 0, linked: true },
            width: { type: "int", default: 0, linked: true },
            height: { type: "int", default: 0, linked: true },
            color: { type: "string", default: "#000000", linked: true },
            bgcolor: { type: "string", default: "#ffffff", linked: true },
            content: { type: "selector", default: "body > *", linked: true },
            lock: { type: "string", default: "" },
        },
    };

    static get observed() {
        return {
            all: ["color", "bgcolor", "x", "y", "width", "height"],
        };
    }

    static html() {
        return `

            <div id="content" part="content">
                <slot></slot>
            </div>
           <scroll-bar id="scroll-x" part="scroll-x" axis="x" align="bottom" value="0" content="#scroll-content" ></scroll-bar>
           <scroll-bar id="scroll-y" part="scroll-y" axis="y" align="right" value="0" content="#scroll-content" ></scroll-bar>
       
        `;
    }

    static get style() {
        return [
            {
                ":host": {
                    position: "absolute",
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                },
                "#html": {
                    position: "absolute",
                    display: "block",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                },

                "#content": {
                    position: "relative",
                    display: "block",
                    width: "calc(100% - 25px)",
                    height: "auto",
                    zIndex: 1,
                },
                slot: {
                    position: "relative",
                    display: "block",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                },
                "#bg": {
                    position: "absolute",
                    display: "block",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    target = {};

    constructor() {
        super();
        this.x = new AnimationValue(0);
        this.y = new AnimationValue(0);
    }

    stateData = {
        contentY: 0,
        contentX: 0,
        content: {},
        x: {
            axis: "x",
            size: 25,
            position: 0,
            max: 0,
            visible: false,
            rect: {
                top: 0,
                left: 0,
                width: 0,
                height: 0,
            },
        },
        y: {
            axis: "y",
            size: 25,
            position: 0,
            max: 0,
            visible: false,
            rect: {
                top: 0,
                left: 0,
                width: 0,
                height: 0,
            },
        },
        scrolling: false,
    };

    activeAxis = [];

    activateAxis(axis) {
        if (this.activeAxis.includes(axis)) {
            return;
        }
        const bar = this.ref("scroll-" + axis);
        bar.show();
        this.activeAxis.push(axis);
    }

    deactivateAxis(axis) {
        if (!this.activeAxis.includes(axis)) {
            return;
        }
        const bar = this.ref("scroll-" + axis);
        bar.hide();
        this.activeAxis.splice(this.activeAxis.indexOf(axis), 1);
    }

    onFirstConnect() {
        this.content = this.ref("content");
        this.scrollX = this.ref("scroll-x");
        this.scrollY = this.ref("scroll-y");

        this.scrollX.hook(({ value, percent }) => {
            this.x.value = value;
            this.dispatchEvent(new CustomEvent("scroll-x", { detail: { value, percent } }));
        });

        this.scrollY.hook(({ value, percent }) => {
            this.y.value = value;
            this.dispatchEvent(new CustomEvent("scroll-y", { detail: { value, percent } }));
        });

        if (this.hasAttribute("lock")) {
            this.lock = this.getAttribute("lock");
            if (["x", "y"].includes(this.lock)) {
                this.deactivateAxis(this.lock);
            }
        }

        const { width, height } = this.getBoundingClientRect();
        this.width = width;
        this.height = height;
        const { width: contentWidth, height: contentHeight } = this.content.getBoundingClientRect();
        this.contentSize = { width: contentWidth, height: contentHeight };

        this.updateActiveScrollbars();

        Observe.resize(this.content).change((w, h) => {
            this.contentSize = { width: w, height: h };
            this.content.setAttribute("width", w);
            this.content.setAttribute("height", h);
            this.updateActiveScrollbars();
        });
    }

    onPropertyChanged(prop, previous, value) {
        switch (prop) {
            case "x":
                break;
            case "y":
                break;
            case "width":
                break;
            case "barwidth":
                this.ref("html").style.setProperty("--scrollbar-width", value + "px");
                break;
            case "height":
                break;
        }
    }

    updateActiveScrollbars() {
        const { x: xState, y: yState } = this.stateData;

        yState.scale = this.height / this.contentSize.height;
        xState.scale = this.width / this.contentSize.width;

        if (yState.visible && yState.scale > 1) {
            // this.barY.style.display = "none";
            this.deactivateAxis("y");
            yState.visible = false;
        } else {
            // this.barY.style.display = "block";
            this.activateAxis("y");
            yState.visible = true;
        }

        if (xState.visible && xState.scale > 1) {
            // this.barX.style.display = "none";
            this.deactivateAxis("x");
            xState.visible = false;
        } else {
            //  this.barX.style.display = "block";
            this.activateAxis("x");
            xState.visible = true;
        }
    }

    onResize(w, h) {
        this.width = w;
        this.height = h;
    }
}

customElements.define("scroll-view", ScrollView);
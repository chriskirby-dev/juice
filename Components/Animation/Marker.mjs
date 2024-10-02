import Component from "../Component.mjs";
import { Vector2D } from "../../Animation/Properties/Vector.mjs";

class Marker extends Component.HTMLElement {
    static tag = "animation-marker";
    static config = {
        name: "animation-marker",
        tag: "animation-marker",
        properties: {
            x: { type: "number", default: 0, linked: true },
            y: { type: "number", default: 0, linked: true },
        },
    };

    static get observed() {
        return {
            all: ["x", "y"],
        };
    }

    constructor(options) {
        super();

        this.position = new Vector2D();
    }

    static get style() {
        return {
            ":host": {
                position: "absolute",
                width: "1px",
                height: "1px",
            },
            "#html": {
                transform: `translate(-50%, -50%)`,
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
        };
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
        `;
    }
}

customElements.define(Marker.tag, Marker);

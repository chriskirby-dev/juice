import Component from "../Component.mjs";
import Canvas from "../../Graphics/Canvas.mjs";

class Particles extends Component.HTMLElement {
    static get config() {
        return {
            properties: {
                width: { type: "number", default: 100, unit: "percent" },
                height: { type: "number", default: 100, unit: "percent" },
            },
        };
    }

    constructor() {
        super();
    }

    onFirstConnect() {
        this.canvas = new Canvas(this);
    }
}

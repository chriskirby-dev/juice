import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";
import AnimationValue from "../../Animation/Properties/Value.mjs";

class AnimationLoop extends Component.HTMLElement {
    static tag = "animation-loop";

    static get config() {
        return {
            properties: {
                asset: { type: "url", default: null, linked: true },
                from: { type: "object", default: {}, linked: true },
                to: { type: "object", default: {}, linked: true },
                duration: { type: "number", default: 1000, linked: true },
            },
        };
    }

    static get observed() {
        return {
            all: ["asset", "from", "to", "duration"],
            attributes: [],
            properties: [],
        };
    }
}

customElements.define(AnimationLoop.tag, AnimationLoop);
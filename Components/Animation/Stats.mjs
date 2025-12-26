import Component from "../Component.mjs";
import StringUtil from "../../Util/String.mjs";
class AnimationStats extends Component.HTMLElement {
    static tag = "animation-stats";

    static config = {
        name: "animation-stats",
        useVirtualDom: false, // Bypass VDom - we manage content manually
        properties: {
            fps: { default: 0, type: "integer", unit: "per Second" },
            time: { default: 0, type: "number", unit: "Seconds" }
        }
    };

    static get observed() {
        return {
            all: ["fps", "time"],
            attributes: [],
            properties: []
        };
    }

    static html(data = {}) {
        return `<ul id="list">
        <li>FPS: <span id="fps">0</span></li>
        <li>Time: <span id="time">0</span></li>
        <li>Memory: <span id="memory">0</span></li>
        </ul>`;
    }

    static get style() {
        return [
            {
                ":host": {
                    position: "absolute",
                    zIndex: 100000,
                    display: "block",
                    width: "auto",
                    height: "auto",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "white",
                    padding: "10px",
                    top: 0,
                    lrft: 0
                },
                ul: {
                    margin: 0,
                    padding: 0,
                    display: "block"
                },
                "ul li": {
                    display: "block",
                    margin: 0,
                    padding: 0,
                    fontSize: "12px"
                }
            }
        ];
    }

    addStat(key, value) {
        const item = document.createElement("li");

        const label = document.createElement("label");
        label.innerText = StringUtil.ucwords(key);

        const span = document.createElement("span");
        span.innerText = value;

        item.appendChild(label);
        item.appendChild(span);

        this.ref("list").appendChild(item);
        this["_" + key] = value;
        Object.defineProperty(this, key, {
            get: () => this["_" + key],
            set: (value) => {
                if (this["_" + key] == value) return;
                this["_" + key] = value;
                span.innerText = value;
            }
        });
    }

    update(time) {
        if (this.last && time.seconds - this.last < 0.25) return;
        this.ref("fps").innerText = time.fps.toFixed(1);
        this.ref("time").innerText = time.seconds.toFixed(3);
        this.last = time.seconds;
    }
}

customElements.define(AnimationStats.tag, AnimationStats);

export default AnimationStats;
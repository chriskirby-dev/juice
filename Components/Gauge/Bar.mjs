import { type } from "../../Util/Core.mjs";
import Component from "../Component.mjs";

export class BarGauge extends Component.HTMLElement {
    static tag = "gauge-bar";

    static config = {
        name: "gauge-bar",
        properties: {
            direction: { type: "string", default: "horizontal" },
            value: { type: "number", default: 0, linked: true },
            min: { type: "number", default: 0, linked: true },
            max: { type: "number", default: 100, linked: true },
            width: { type: "int", default: 0, linked: true },
            height: { type: "int", default: 0, linked: true },
            label: { type: "string", default: "", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "value", "min", "max", "label"],
        };
    }

    static get style() {
        return [
            {
                ".value": {
                    position: "absolute",
                    height: "100%",
                    width: "var(--value, 0%)",
                },
                "label::before": {
                    display: "block",
                    content: `var(--label, "")`,
                },
                ".gauge-bar": {
                    position: "relative",
                    display: "block",
                },
                "#value": {
                    float: "right",
                },
            },
        ];
    }

    static html() {
        return `
        <div id="value" part="label"></div>
            <label id="label" part="label"></label>
            <div class="gauge-bar" part="box">
                <div class="value" part="bar"></div>
            </div>
        `;
    }

    onPropertyChanged(prop, previous, value) {
        // console.log("onPropertyChanged", prop, previous, value);
        switch (prop) {
            case "width":
                this.styles.update(":host", {
                    width: value + "px",
                });
                break;
            case "height":
                this.styles.update(".gauge-bar", {
                    height: value + "px",
                });

                break;
            case "value":
                this.ref("value").innerText = value;
                const span = Math.abs(this.max - this.min);
                const v = value - this.min;
                this.ref("html").style.setProperty("--value", (v / span) * 100 + "%");
                break;
            case "label":
                this.ref("label").innerText = value;
                break;
        }
    }
}

customElements.define(BarGauge.tag, BarGauge);
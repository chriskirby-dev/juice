/**
 * Range input form component with slider UI.
 * @module Components/Form/FormRangeComponent
 */

import Component from "../Component.mjs";
import { BaseInput } from "./FormBaseComponents.mjs";
//import setupCSS from "!../../../sass/component--setup.scss?toString";

/**
 * FormRangeComponent provides a range slider with min/max labels and value display.
 * @class FormRangeComponent
 * @extends BaseInput
 */
class FormRangeComponent extends BaseInput {
    static tag = "form-range";

    static config = {
        shadow: true,
        closed: true,
        properties: {
            min: { type: "number", linked: true, default: 0 },
            max: { type: "number", linked: true, default: 0 },
            step: { type: "number", linked: true, default: 0.1 },
            unit: { linked: true, default: "" },
            type: { linked: true },
            "value-position": { linked: true, default: "top" },
        },
    };

    static get observed() {
        return {
            attributes: ["min", "max", "precision", "step", "unit", "type", "value-position"],
            properties: ["min", "max", "precision", "step", "unit", "type", "value-position"],
        };
    }

    static html() {
        return `
        <div class="outer flex-h w-100 h-100 ${this.valuePosition ? "text-" + this.valuePosition : ""}">
            <div class="input range w-100">
                <header class="flex-h" >
                    <div ref="min-label" class="label min" >${this.min}</div>
                    <div class="w-100"></div>
                    <div ref="max-label" class="label max" >${this.max}</div>
                </header>
                <main ref="main">
                    <div ref="mock" class="mock">
                    <div class="slider" ref="slider">
                    ${
                        this.valuePosition == "popup"
                            ? `
                    <div ref="text-input-wrapper" class="input value-display text flex-static ${this.valuePosition}">
                        <input ref="text-input" type="text" value="${this.value + this.unit}" />
                    </div>
                    `
                            : ""
                    }
                    </div>
                    </div>
                </main>
                <footer>
                <label for="range">${this.label || ""}</label>
                </footer>
            </div>
            ${
                this.valuePosition == "none" || this.valuePosition == "popup"
                    ? ""
                    : `
            <div ref="text-input-wrapper" class="input value-display text flex-static ${this.valuePosition}">
                <input ref="text-input" type="text" value="${this.value + this.unit}" />
            </div>
            `
            }
        </div>
        `;
    }

    static get style() {
        return super.style.concat([
            setupCSS,
            {
                ":host(form-range)": {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    color: "inherit",
                },
                ".input.range": {
                    paddingRight: "1rem",
                    paddingTop: "7px",
                },
                ".label": {
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                },
                ".input.range input": {
                    width: "100%",
                },
                ".input.text": {
                    width: "60px",
                    minWidth: "60px",
                },
                ".outer.text-bottom": {
                    flexWrap: "wrap",
                },
                ".input.text.bottom": {
                    flex: "0 0 auto",
                    width: "100%",
                },
                ".input.text input": {
                    width: "100%",
                    height: "100%",
                    fontSize: "1.3rem",
                    border: 0,
                },
                header: {
                    userSelect: "none",
                },
                ".value-display": {
                    width: "50px",
                },
                label: {
                    position: "relative",
                    color: "var(--color-dark-gray)",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                },
                ":host([minimal]) header .label": {
                    fontSize: "0.5rem",
                },
                ":host([minimal]) footer label": {
                    fontSize: "0.6rem",
                    lineHeight: 1,
                },
                ":host([minimal]) .input.text input": {
                    fontSize: "1rem",
                },
                ":host([minimal]) .input.range": {
                    paddingTop: "0",
                },
                ":host([minimal]) .input.text": {
                    width: "50px",
                    minWidth: "50px",
                },
                ".mock": {
                    width: "100%",
                    height: "5px",
                    border: "1px solid #d2d2d2",
                    background: "#FFF",
                    position: "relative",
                },
                ".slider": {
                    height: "100%",
                    position: "absolute",
                    width: "10px",
                    background: "var(--color-blue)",
                },
                ".slider:before": {
                    content: '""',
                    display: "block",
                    height: "200%",
                    width: "100%",
                    minWidth: "20px",
                    minHeight: "20px",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    cursor: "pointer",
                    position: "absolute",
                    zIndex: 100,
                },
                ".slider:hover:after": {
                    background: "rgba(255,255,255,0.5)",
                    content: '""',
                    display: "block",
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                },
                ".slider .input.text": {
                    display: "none",
                    position: "absolute",
                    left: "50%",
                    top: "-25px",
                    transform: "translateX(-50%)",
                    fontSize: "0.5rem",
                    textAlign: "center",
                },
                ".slider .input.text input": {
                    textAlign: "center",
                    width: "30px",
                    fontSize: "0.7rem",
                    height: "20px",
                },
                ".outer:hover .slider .input.text, .active .slider .input.text": {
                    display: "block",
                },
                ".outer": {
                    marginBottom: "1rem",
                },
            },
        ]);
    }

    drag = {};

    startDrag(e) {
        e.preventDefault();
        const rect = this.ref("main").getBoundingClientRect();
        const slideRect = this.ref("slider").getBoundingClientRect();
        this.drag.clientStartX = e.clientX;
        this.drag.startX = e.clientX - rect.left;
        this.drag.maxX = rect.width - slideRect.width;
        document.addEventListener("mousemove", this.onDragging);
        window.addEventListener("mouseup", this.stopDrag);
    }

    onDragging(event) {
        const rect = this.ref("main").getBoundingClientRect();
        const slideRect = this.ref("slider").getBoundingClientRect();
        const x = event.clientX - rect.left;
        const perc = Math.max(0, Math.min(x / rect.width, 1));
        this.drag.moveX = event.clientX - this.drag.clientStartX;
        this.ref("slider").style.left = `${Math.max(
            0,
            Math.min(this.drag.startX + this.drag.moveX, this.drag.maxX)
        )}px`;
        let value = Number(this.min + perc * (this.max - this.min));
        this.setValue(value);
    }

    stopDrag(event) {
        document.removeEventListener("mousemove", this.onDragging);
    }

    setValue(value, adjustSlider) {
        if (this.step) {
            //  value = Math.floor(value) + (( value - Math.floor(value) ).toPrecision() );
            value = Math.floor(value / this.step) * this.step;
            if (value !== Math.floor(value)) value = value.toFixed(("" + this.step).split(".")[1].length);
        }
        if (this.value !== value) {
            this.value = value;
        }
        if (this.ref("text-input")) this.ref("text-input").value = this.value + this.unit;

        if (adjustSlider) {
            const rect = this.ref("main").getBoundingClientRect();
            const slideRect = this.ref("slider").getBoundingClientRect();
            const per = (this.value - this.min) / (this.max - this.min || 0);
            this.ref("slider").style.left = per * rect.width - slideRect.width / 2 + "px";
        }
    }

    onReady() {
        const rect = this.getBoundingClientRect();
        if (this.hasAttribute("value")) {
            this.setValue(this.getAttribute("value"), true);
        }
        /*
        this.ref('range-input').addEventListener('input', () => {
            const value = this.ref('range-input').value;
            this.value = value;
            this.ref('text-input-wrapper').style.width = `${( value.length * 15 ) }px`;
            this.ref('text-input').value = scopedInput.value = this.ref('range-input').value + this.unit;
            scopedInput.dispatchEvent(new Event('input'));
        });
*/
        this.ref("main").addEventListener("click", (e) => {
            const rect = this.ref("main").getBoundingClientRect();
            const x = e.clientX - rect.left;
            const perc = Math.max(0, Math.min(x / rect.width, 1));
            let value = Number(this.min + perc * (this.max - this.min));
            this.setValue(value);

            const slideRect = this.ref("slider").getBoundingClientRect();
            this.ref("slider").style.left = `${Math.min(x - slideRect.width / 2, rect.width - slideRect.width)}px`;
        });

        this.startDrag = this.startDrag.bind(this);
        this.onDragging = this.onDragging.bind(this);
        this.stopDrag = this.stopDrag.bind(this);

        this.ref("slider").addEventListener("mousedown", this.startDrag);

        this.ref("slider").style.width = 100 / (this.max - this.min) + "%";
        // this.appendChild(scopedInput);
    }
}

customElements.define(FormRangeComponent.tag, FormRangeComponent);
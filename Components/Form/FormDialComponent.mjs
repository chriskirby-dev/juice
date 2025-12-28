/**
 * Form dial component for rotary input control.
 * Provides a circular dial input with draggable rotation.
 * @module Components/Form/FormDialComponent
 */

import Component from "../Component.mjs";
import { BaseInput } from "./FormBaseComponents.mjs";
import Obj from "../../Util/Object.mjs";
//import setupCSS from "!../../../sass/component--setup.scss?toString";
import MathGeom from "../../Util/Geometry.mjs";
import Draggable from "../../Control/DragDrop/Draggable.mjs";

/**
 * Dial input component for rotary value selection.
 * @class FormDialComponent
 * @extends BaseInput
 */
class FormDialComponent extends BaseInput {
    static tag = "form-dial";

    static config = {
        shadow: true,
        closed: true,
        properties: {
            size: { type: "int", linked: true, default: 50 },
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
            attributes: ["size", "min", "max", "precision", "step", "unit", "type", "value-position"],
            properties: ["size", "min", "max", "precision", "step", "unit", "type", "value-position"],
        };
    }

    static html() {
        return `
            <main style="width:${this.size}px">
                <div class="base">
                    <svg class="bg" viewBox="0 0 100 100" >
                        <circle ref="indicator-strokebg" cx="50" cy="50"r="48" fill="none" stroke="var(--color-gray)" stroke-width="2" />
                    </svg>
                    <svg class="value" viewBox="0 0 100 100" >
                        <circle ref="indicator-stroke" cx="50" cy="50"r="48" fill="none" stroke="var(--color-green)" stroke-width="4" />
                    </svg>
                    <div class="dial" ref="dial">
                    <div class="indicator"></div>
                    </div>
                </div>
                
            </main>
            <div class="min-max">
                <label for="min" ref="value-min" >${this.min || 0}</label>
                <label for="max" ref="value-max" >${this.max || ""}</label>
            </div>
            <label class="value-label" for="current"  ref="value-current" >${this.value || this.min || 0}${
            this.unit
        }</label>
            
        
        `;
    }

    static get style() {
        return super.style.concat([
            setupCSS,
            {
                ":host(form-dial)": {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    color: "inherit",
                },
                main: {
                    position: "relative",
                    cursor: "pointer",
                },
                ".value-label": {
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "11px",
                    fontWeight: "bold",
                },
                ".component--html": {
                    padding: "0 1rem",
                },
                "main:after": {
                    content: `""`,
                    display: "block",
                    position: "relative",
                    width: "100%",
                    paddingBottom: "100%",
                },
                ".base": {
                    position: "absolute",
                    borderRadius: "50%",
                    width: "100%",
                    height: "100%",
                },
                ".base svg": {
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    transformOrigin: "center",
                    transform: "rotate(115deg)",
                },
                ".base svg circle": {
                    strokeDashoffset: 0,
                },
                ".base svg.bg circle": {},
                ".dial": {
                    position: "absolute",
                    width: "calc( 100% - 7px )",
                    height: "calc( 100% - 7px )",
                    top: "4px",
                    left: "4px",
                    borderRadius: "50%",
                    transform: "rotate(25deg)",
                    transformOrigin: "center",
                    border: "1px solid #d2d2d2",
                    boxShadow: "rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px",
                    background: "var(--input-bg)",
                    cursor: "pointer",
                },
                ".dial .indicator": {
                    display: "block",
                    position: "absolute",
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    border: "1px solid #d2d2d2",
                    top: "80%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    overflow: "hidden",
                },
                ".dial .indicator:after": {
                    content: `""`,
                    display: "block",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    background: "-moz-linear-gradient(top,  rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)",
                    background: "-webkit-linear-gradient(top,  rgba(0,0,0,0.35) 0%,rgba(0,0,0,0) 100%)",
                    background: "linear-gradient(to bottom,  rgba(0,0,0,0.35) 0%,rgba(0,0,0,0) 100%)",
                    filter: "progid:DXImageTransform.Microsoft.gradient( startColorstr='#a6000000', endColorstr='#00000000',GradientType=0 )",
                },
                footer: {
                    display: "flex",
                    flexDirection: "row",
                    paddingTop: "5px",
                },
                ".min-max": {
                    height: "10px",
                    position: "relative",
                },
                ".min-max label": {
                    fontSize: "10px",
                    width: "100%",
                },
                '.min-max label[for="min"]': {
                    position: "absolute",
                    textAlign: "right",
                    bottom: 0,
                    right: "calc( 50% + 10px )",
                },
                '.min-max label[for="max"]': {
                    position: "absolute",
                    textAlign: "left",
                    bottom: 0,
                    left: "calc( 50% + 10px )",
                },
                'footer label[for="current"]': {
                    textAlign: "center",
                    fontWeight: "bold",
                },
            },
        ]);
    }

    drag = {};
    rotation = 0;

    get isMax() {
        return this.value == this.max;
    }

    startDrag(e) {
        const { event } = e.detail;
        const rect = this.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        this.drag.start = { rotation: this.rotation, center: center };
        const sx = event.x - center.x;
        const sy = event.y - center.y;
        let stheta = Math.atan2(sx, sy);
        this.drag.start.angle = (stheta *= 180 / Math.PI) + 180; // rads to degs, range (-180, 180]
        debug(this.drag.start);
    }

    onDragging(e) {
        this.drag.lastValue = this.value;
        const { current } = e.detail;
        const center = this.drag.start.center;
        const sx = current.x - center.x;
        const sy = current.y - center.y;
        let stheta = Math.atan2(sx, sy);
        const angle = (stheta *= 180 / Math.PI) + 180; // rads to degs, range (-180, 180]
        const rotation = this.drag.start.angle - angle;
        this.rotation = MathGeom.rotation(this.drag.start.angle + rotation);

        const percent = (this.rotation - 25) / 310;

        const v = Math.max(this.min, Math.min(this.min + percent * this.span, this.max));

        if ((this.isMax && v > this.drag.lastValue) || (this.isMin && v < this.drag.lastValue)) {
            return;
        }
        this.value = v;
        debug(angle, rotation);

        // this.value = value;
    }

    stopDrag(event) {
        this.drag = {};
    }

    rotationOfValue(value) {}

    get span() {
        return this.max - (this.min || 0);
    }

    onValueChange(value) {
        const { min, max, step } = this;
        const percent = (value - min) / (this.span || 0);
        if (step) {
            //  value = Math.floor(value) + (( value - Math.floor(value) ).toPrecision() );
            value = Math.floor(value / this.step) * this.step;
            if (value !== Math.floor(value)) value = value.toFixed(("" + this.step).split(".")[1].length);
        }

        this.ref("value-current").innerText = value + this.unit;
        const maxRotation = 360 - 50;
        const rotation = 25 + percent * maxRotation;
        this.rotation = rotation;
        this.ref("dial").style.transform = `rotate(${rotation}deg)`;

        if (this.strokeLen) {
            const strokeLen = this.strokeLen;

            this.ref("indicator-stroke").style.strokeDashoffset = `${strokeLen - strokeLen * percent}`;
        }
    }

    onReady() {
        const strokeLen = this.ref("indicator-stroke").getTotalLength();
        this.strokeLen = strokeLen;
        this.ref("indicator-stroke").setAttribute("stroke-dasharray", `${strokeLen}`);
        this.ref("indicator-strokebg").setAttribute("stroke-dasharray", `${strokeLen}`);

        this.ref("indicator-stroke").style.strokeDashoffset = `${strokeLen * 0.5}`;
        this.ref("indicator-strokebg").style.strokeDashoffset = `${strokeLen * 0.1388888888888889}`;

        Draggable.make(this);
        this.addEventListener("dragstart", this.startDrag, false);
        this.addEventListener("drag", this.onDragging, false);
        this.addEventListener("dragstop", this.stopDrag, false);

        this.onValueChange(this.value);
        /*
        const rect = this.getBoundingClientRect();
       if(this.hasAttribute('value')){
        this.setValue(this.getAttribute('value'), true);
       }

        this.ref('main').addEventListener('click', (e) => {
            const rect = this.ref('main').getBoundingClientRect();
            const x = e.clientX - rect.left;
            const perc = Math.max( 0, Math.min( x / rect.width, 1) );
            let value = Number(this.min + perc * (this.max - this.min));
            this.setValue(value);
           
            const slideRect = this.ref('slider').getBoundingClientRect();
            this.ref('slider').style.left = `${Math.min( x - slideRect.width/2, rect.width-slideRect.width)}px`;
        });

        this.startDrag = this.startDrag.bind(this);
        this.onDragging = this.onDragging.bind(this);
        this.stopDrag = this.stopDrag.bind(this);

        this.ref('slider').addEventListener('mousedown', this.startDrag );
       
        this.ref('slider').style.width = (100 / (this.max - this.min)) + '%';
       // this.appendChild(scopedInput);
       */
    }
}

customElements.define(FormDialComponent.tag, FormDialComponent);
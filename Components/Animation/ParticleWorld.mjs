import Component from "../Component.mjs";
import Canvas from "../../Graphics/Canvas.mjs";
import CanvasBuffer from "../../Graphics/Canvas/Buffer.mjs";
import * as vForm from "../../Form/VirtualBuilder.mjs";
import ParticleWorld from "../../Animation/Particles/World.mjs";
import VirtualDom from "../../VirtualDom/VirtualDom.mjs";
import Form from "../../Form/Form.mjs";
import formsCSS from "../../../../css/forms.css?inline";
import { random, randomInt, round, floor, randomBetween } from "../../Util/Math.mjs";
import PropertyArray from "../../DataTypes/PropertyArray.mjs";
import { getDotPath, setDotPath } from "../../Util/DotNotation.mjs";
import ParticlesGL from "../../Graphics/WebGL/Particles.mjs";
const formVdom = vForm.container({}, [
    vForm.fieldset("Force Options", [vForm.vector("force", [0, 0, 0], ["X", "Y", "Z"], { label: "Forces" })]),
    vForm.fieldset("Repel Options", [
        vForm.row("", [
            vForm.checkbox("repel", 0, { attributes: { "data-type": "int" } }),
            vForm.button("Set Repel Point", { "data-type": "int" }, function (target) {
                console.dir(target);
                const shadow = target.shadowRoot;
                const repelPointX = target.parentNode.parentNode.querySelector("#repelPointx");
                const repelPointY = target.parentNode.parentNode.querySelector("#repelPointy");

                console.log(repelPointX, repelPointY);
                function onMouseClick(e) {
                    repelPointX.value = e.pageX / (window.innerWidth / 2) - 1;
                    repelPointY.value = e.pageY / (window.innerHeight / 2) - 1 * -1;
                    repelPointX.dispatchEvent(new Event("change"));
                    repelPointY.dispatchEvent(new Event("change"));
                    window.removeEventListener("mousemove", onMouseMove);
                    window.removeEventListener("click", onMouseClick);
                }

                function onMouseMove(e) {
                    repelPointX.value = e.pageX / (window.innerWidth / 2) - 1;
                    repelPointY.value = e.pageY / (window.innerHeight / 2) - 1;
                    repelPointX.dispatchEvent(new Event("change"));
                    repelPointY.dispatchEvent(new Event("change"));
                }

                window.addEventListener("mousemove", onMouseMove);
                setTimeout(() => {
                    window.addEventListener("click", onMouseClick);
                }, 0);
            }),
        ]),
        vForm.vector("repelPoint", [0, 0, 0], ["X", "Y", "Z"], { label: "Repel Point" }),
        vForm.range("repelPoint[3]", 0, {
            label: "Radius",
            min: 0.001,
            max: 2,
            step: 0.001,
            value: 0.5,
            size: 10,
            labelInline: true,
        }),
        vForm.select("repelParams[x]", 0, {
            label: "Dimentions",
            value: 2,
            options: { "2D": 2.0, "3D": 3.0 },
        }),

        vForm.number("repelParams[z]", 0, {
            label: "Z",
            value: 0.5,
            step: 0.001,
            value: 0.5,
        }),
    ]),
    vForm.fieldset("Orbit Options", [
        vForm.row("", [
            vForm.checkbox("orbit", 1, { attributes: { "data-type": "int" } }),
            vForm.button("Set Orbit Point", { "data-type": "int" }, function (target) {
                console.dir(target);
                const shadow = target.shadowRoot;
                const orbitPointX = target.parentNode.parentNode.querySelector("#orbitPoint0");
                const orbitPointY = target.parentNode.parentNode.querySelector("#orbitPoint1");

                console.log(orbitPointX, orbitPointY);
                function onMouseClick(e) {
                    orbitPointX.value = e.pageX / (window.innerWidth / 2) - 1;
                    orbitPointY.value = (e.pageY / (window.innerHeight / 2) - 1) * -1;
                    orbitPointX.dispatchEvent(new Event("change"));
                    orbitPointY.dispatchEvent(new Event("change"));

                    window.removeEventListener("mousemove", onMouseMove);
                    window.removeEventListener("click", onMouseClick);
                }

                function onMouseMove(e) {
                    orbitPointX.value = e.pageX / (window.innerWidth / 2) - 1;
                    orbitPointY.value = (e.pageY / (window.innerHeight / 2) - 1) * -1;
                    orbitPointX.dispatchEvent(new Event("change"));
                    orbitPointY.dispatchEvent(new Event("change"));
                }

                window.addEventListener("mousemove", onMouseMove);
                setTimeout(() => {
                    window.addEventListener("click", onMouseClick);
                }, 0);
            }),
        ]),
        vForm.row(
            "Orbit Point",
            [
                vForm.number("orbitPoint[0]", 0, {
                    labelInline: true,
                    label: "X",
                    min: -1,
                    max: 1,
                    step: 0.001,
                    inline: true,
                }),
                vForm.number("orbitPoint[1]", 0, {
                    labelInline: true,
                    label: "Y",
                    min: -1,
                    max: 1,
                    step: 0.001,
                    inline: true,
                }),
                vForm.number("orbitPoint[2]", 0, {
                    labelInline: true,
                    label: "Z",
                    min: -1,
                    max: 1,
                    step: 0.001,
                    inline: true,
                }),
            ],
            { inline: true }
        ),
        vForm.range("orbitPoint[3]", 0, {
            label: "Radius",
            min: 0.001,
            max: 2,
            step: 0.001,
            value: 0.5,
            size: 10,
            labelInline: true,
        }),
        vForm.select("uOrbitParams[x]", 0, {
            label: "Dimentions",
            value: 3.0,
            options: { "2D": 2.0, "3D": 3.0 },
        }),

        vForm.number("uOrbitParams[z]", 0, {
            label: "Z",
            value: 0.5,
            step: 0.001,
            value: 0.5,
        }),
    ]),
]);

const CONTROL_SCHEMA = {
    repelGroup: {
        type: "fieldset",
    },
    repel: {
        type: "checkbox",
        label: "Repel",
        value: 1,
        checked: false,
        attributes: {
            "data-type": "int",
        },
    },
    "repelParams[x]": {
        label: "Dimentions",
        value: 2,
        type: "select",
        options: ["2", "3"],
    },
    orbit: {
        type: "checkbox",
        label: "Orbit",
        value: true,
        checked: false,
    },
    spawnrate: {
        type: "range",
        label: "Spawn Rate",
        min: 1,
        max: 100,
        value: 5,
    },
    gravity: {
        type: "range",
        min: 0.1,
        max: 20,
    },
    lifespan: {
        type: "range",
        label: "Lifespan",
        min: 0.1,
        max: 20,
        value: 5,
    },
    velocity: {
        type: "range",
        label: "Velocity",
        min: 0.1,
        max: 200,
        value: 25,
    },
    emitter: {
        type: "select",
        options: ["point", "map", "plane"],
        value: "point",
    },
};

const PARTICLE_CONFIG = {
    maxParticles: 500,
    density: 0,
    randomness: 1,
    mask: null,
    env: {
        forces: [],
    },
};

class ParticleWorldComponent extends Component.HTMLElement {
    static tag = "particle-world";

    animate = true;
    count = 0;

    RESIZE_ACTION = "fill";

    static config = {
        properties: {
            renderer: { type: "string", default: "canvas", linked: true },
            width: { type: "number", default: 100, unit: "percent", linked: true },
            height: { type: "number", default: 100, unit: "percent", linked: true },
            depth: { type: "number", default: 100, unit: "percent", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "renderer"],
        };
    }

    static get style() {
        return [
            formsCSS,
            {
                ":host": {
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                },
                "#renderer": {
                    width: "100%",
                    height: "100%",
                    position: "relative",
                },
                "#controls": {
                    position: "absolute",
                    bottom: "1rem",
                    left: "1rem",
                    width: "auto",
                    height: "auto",
                    backgroundColor: "#999",
                    zIndex: 100,
                    padding: "1rem",
                },
                "#controls h3": {
                    margin: 0,
                },
            },
        ];
    }

    static html() {
        if (this.hasAttribute("renderer")) {
            this.renderer = this.getAttribute("renderer");
        }
        return `
            <div id="controls">
            <h3>Particle World</h3>
            <form id="control-form">
            </form>
            </div>
            ${this.renderer == "dom" ? `<div id="renderer"></div>` : `<canvas id="renderer"></canvas>`}
        `;
    }

    constructor() {
        super();
    }

    addForce(force, vx, vy) {
        this.forces[force] = { x, y };
    }

    removeForce(force) {
        delete this.forces[force];
    }

    showControls() {
        console.log(formVdom);
        const controlForm = Form.fromVDom(formVdom, this.ref("control-form"));
        let refreshTO;
        controlForm.on("input", (name, value) => {
            console.log(name, value);
            setDotPath(PARTICLE_CONFIG, name, value);
            console.log(this.particleViewer);
            this.particleViewer.setValue(name, value);
        });
        controlForm.on("change", (name, value) => {
            setDotPath(PARTICLE_CONFIG, name, value);
            this.particleViewer.setValue(name, value);
        });
    }

    hideControls() {}

    /*************  ✨ Codeium Command ⭐  *************/
    /**
     * Initializes particle arrays before creating the particle world.
     * @protected
     */
    /******  cf5945ac-0717-453c-af14-28be8ea0e20f  *******/
    beforeCreate() {
        const { maxParticles } = PARTICLE_CONFIG;
        this.positions = new Float32Array(maxParticles * 3); // (x, y) positions
        this.velocities = new Float32Array(maxParticles * 3); // (vx, vy) velocities
        this.sizes = new Float32Array(maxParticles); // Particle sizes
        this.colors = new Float32Array(maxParticles * 4); // (r, g, b, a) colors
        this.lifetimes = new Float32Array(maxParticles); // Lifetimes

        this.orbits = new Float32Array(maxParticles * 3);
    }

    update(time) {
        // if (this.particleViewer) this.particleViewer.update(time.delta);
        // console.log("Updated", this.count);
    }

    render() {
        /*
        const buffer = new CanvasBuffer(this.canvas);
        for (let i = 0; i < this.count; i++) {
            const p = i * 3;
            const x = this.positions[p];
            const y = this.positions[p + 1];
            const z = this.positions[p + 2];
            if (i == 0) console.log(x, y);
            buffer.pixel(x, y, [255, 255, 255, 255]);
        }
        buffer.put(this.ctx);

        console.log("Rendered", this.count);
        */
    }

    build() {
        const { randomness, maxParticles } = PARTICLE_CONFIG;
        const spawnPoint = { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
        for (let i = 0; i < maxParticles; i++) {
            const position = [randomBetween(-1, 1), randomBetween(-1, 1), randomBetween(-1, 1)];
            const orbits = [100 + random(200), random(Math.PI * 2), 0.01 + random(0.02)];
            this.orbits.set(orbits, i * 3);
            this.positions.set(position, i * 3);
            this.lifetimes[i] = 0;
            this.count = i;
        }

        this.spawnPoint = spawnPoint;

        console.log("Built", maxParticles);

        this.update({ delta: 0 });
        this.render();
    }

    onResize(width, height) {
        console.log(width, height);
        this.width = width;
        this.height = height;
        if (this.renderer == "canvas" || this.renderer == "webgl") {
            this.ref("renderer").width = width;
            this.ref("renderer").height = height;
            this.offscreen = new OffscreenCanvas(this.width, this.height);
        }
        this.build();
    }

    onFirstConnect() {
        this.showControls();

        const canvas = this.ref("renderer");
        canvas.width = this.width;
        canvas.height = this.height;
        this.canvas = canvas;
        if (this.renderer == "webgl") {
            // this.ctx = canvas.getContext("webgl2");
            const { maxParticles, emitRate } = PARTICLE_CONFIG;
            this.particleViewer = new ParticlesGL(this.canvas, maxParticles, emitRate);
            this.particleViewer.start();
        } else {
            this.ctx = canvas.getContext("2d");
        }
    }

    onPropertyChanged(property, prevous, value) {
        switch (property) {
            case "width":
                break;
            case "height":
                break;
        }
    }

    mask(source) {}
}

customElements.define(ParticleWorldComponent.tag, ParticleWorldComponent);

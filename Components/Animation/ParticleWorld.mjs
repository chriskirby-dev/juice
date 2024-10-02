import Component from "../Component.mjs";
import Canvas from "../../Graphics/Canvas.mjs";
import CanvasBuffer from "../../Graphics/Canvas/Buffer.mjs";

import ParticleWorld from "../../Animation/Particles/World.mjs";
import VirtualDom from "../../VirtualDom/VirtualDom.mjs";
import Form from "../Form/Form.mjs";
import formsCSS from "../../../../css/forms.css?inline";
import { random, randomInt, round, floor } from "../../Util/Math.mjs";
import PropertyArray from "../../DataTypes/PropertyArray.mjs";
import { getDotPath, setDotPath } from "../../Util/DotNotation.mjs";
import ParticlesGL from "../../Graphics/WebGL/Particles.mjs";

const CONTROL_SCHEMA = {
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

class ParticleWorldComponent extends Component.HTMLElement {
    static tag = "particle-world";

    animate = true;
    setup;
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

    setup = {
        maxParticles: 400,
        density: 0,
        randomness: 1,
        mask: null,
        env: {
            forces: [],
        },
    };

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
        const controlForm = Form.fromSchema(CONTROL_SCHEMA, this.ref("control-form"));
        let refreshTO;
        controlForm.on("input", (name, value) => {
            setDotPath(this.setup, name, value);
            clearTimeout(refreshTO);
            refreshTO = setTimeout(() => {
                this.build();
            }, 500);
        });
        controlForm.on("change", (name, value) => {
            setDotPath(this.setup, name, value);
            clearTimeout(refreshTO);
            refreshTO = setTimeout(() => {
                this.build();
            }, 500);
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
        this.setup = {
            maxParticles: 1200,
            emitRate: 10,
            density: 0,
            randomness: 1,
            mask: null,
            env: {
                forces: [],
            },
        };

        const { maxParticles } = this.setup;
        this.positions = new Float32Array(maxParticles * 3); // (x, y) positions
        this.velocities = new Float32Array(maxParticles * 3); // (vx, vy) velocities
        this.sizes = new Float32Array(maxParticles); // Particle sizes
        this.colors = new Float32Array(maxParticles * 4); // (r, g, b, a) colors
        this.lifetimes = new Float32Array(maxParticles); // Lifetimes

        this.orbits = new Float32Array(maxParticles * 3);
    }

    update(time) {
        if (this.viewer) this.viewer.update(time.delta);

        for (let i = 0; i < this.count; i++) {
            const p = i * 3;
            let x = this.positions[p];
            let y = this.positions[p + 1];
            const z = this.positions[p + 2];

            const radius = this.orbits[p];
            let angle = this.orbits[p + 1];
            const speed = this.orbits[p + 2];

            angle += speed;

            x = this.spawnPoint.x + radius * Math.cos(angle);
            y = this.spawnPoint.y + radius * Math.sin(angle);

            this.positions[p] = round(x);
            this.positions[p + 1] = round(y);

            this.orbits[p + 1] = angle;
        }
        console.log("Updated", this.count);
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
        const { randomness, maxParticles } = this.setup;
        const spawnPoint = { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
        for (let i = 0; i < maxParticles; i++) {
            const position = [spawnPoint.x + randomInt(50), spawnPoint.y + randomInt(50), randomInt(this.depth)];
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

        if (this.renderer == "canvas" || this.renderer == "webgl") {
            const canvas = this.ref("renderer");
            canvas.width = this.width;
            canvas.height = this.height;
            this.canvas = canvas;
            if (this.renderer == "webgl") {
                this.ctx = canvas.getContext("webgl");
                const { maxParticles, emitRate } = this.setup;
                this.viewer = new ParticlesGL(this.ctx, maxParticles, emitRate);
            } else {
                this.ctx = canvas.getContext("2d");
            }
        }

        if (this.renderer == "dom") {
            const stage = this.ref("renderer");
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

import { Vector2D } from "./Properties/Vector.mjs";
import AnimationStepper from "./Stepper.mjs";
import AnimationValue from "./Properties/Value.mjs";

export class Particle {
    size = 1;
    color = "white";

    constructor(options = {}) {
        //Set Initial Properties
        this.type = options.type || "circle";
        this.start = { x: options.x, y: options.y };
        this.position = new Vector2D(0, 0);
        this.age = options.age || 0;
        this.lifetime = options.lifetime || 10;
        this.size = new AnimationValue(options.size || 0);
        this.color = options.color || "#FFF";
        this.opacity = new AnimationValue(options.opacity || 1);
        this.rotation = options.rotation || 0;
        this.vars = options.vars || {};
        if (options.floor) this.floor = options.floor;

        if (this.steps) {
            this.stepper = new AnimationStepper(steps);
        }

        this.options = options;

        this.build();
    }

    get x() {
        return this.start.x + this.position.x;
    }

    get y() {
        return this.start.y + this.position.y;
    }

    update(delta) {
        this.age += delta;
        this.progress = this.age / this.lifetime;
    }

    remove() {
        if (this.body) this.body.remove();
    }

    build() {
        const { options } = this;
        switch (options.as) {
            case "dom":
                this.body = document.createElement("div");
                this.body.classList.add("particle");
                this.body.style.position = "absolute";
                this.body.style.zIndex = 100;
                // this.body.style.background = "transparent";

                this.body.style.opacity = `${this.opacity.value}`;
                this.body.style.top = `${this.start.y}px`;
                this.body.style.left = `${this.start.x}px`;
                this.body.classList.add(options.type);
                this.vars["--size"] = this.size.value + "px";
                this.vars["--color"] = this.color;
                for (let name in this.vars) {
                    this.body.style.setProperty(name, this.vars[name]);
                }
                if (options.type === "circle") {
                    this.body.style.borderRadius = "50%";
                }
                break;
            case "canvas":
                this.render = this.renderCanvas;
                break;
            default:
        }
    }
}

export class AnimationParticle extends Particle {
    constructor(options = {}) {
        super(options);
        this.velocity = new Vector2D(options.velocity?.x || 0, options.velocity?.y || 0);
        this.direction = options.direction || 0;
        this._update = (options.update || function () {}).bind(this);
        switch (options.as) {
            case "dom":
                this.render = this.renderDom;
                break;
            case "canvas":
                this.render = this.renderCanvas;
                break;
            default:
        }
        this.random = Math.random();
    }

    update(delta, forces) {
        super.update(delta);
        const { age, progress } = this;
        //console.log(forces);
        this.forces = forces;
        let vx = this.velocity.x + this.forces.x;
        let vy = this.velocity.y + this.forces.y;

        this.position.x += vx * delta;
        this.position.y += vy * delta;

        this._update(delta);
    }

    renderDom() {
        if (this.opacity.dirty) this.body.style.opacity = this.opacity.value;

        if (this.position.dirty) this.body.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;

        if (this.size.dirty) {
            this.body.style.setProperty("--size", `${this.size.value}px`);
        }
    }
}

export class DomParticle {
    constructor(element, options) {
        if (element) this.body = element;
        this.initialize();
    }

    render() {}

    initialize() {
        if (!this.body) {
            this.body = document.createElement("div");
            this.body.classList.add("particle");
        }
    }
}

export class CanvasParticle {
    constructor(canvas) {
        this.canvas = canvas;
    }

    render() {}
}

export class SteppedParticle {
    constructor() {}
}

export class ParticleEmitter {
    forces = [];
    force = { x: 0, y: 0 };
    time = 0;
    last = 0;

    constructor(source, options = {}) {
        const _source = document.createElement("div");
        _source.className = "particle-source";
        _source.style.position = "absolute";
        _source.style.top = 0;
        _source.style.left = 0;
        _source.style.width = "100%";
        _source.style.height = "100%";
        source.appendChild(_source);

        this.source = _source;

        const rect = source.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.particles = [];
        this.maxParticles = options.maxParticles || 100;
        this.options = options;
        this.initialize();
    }

    emit() {
        const x = Math.random() * this.width;
        this.particles.push(new Particle(x, 0));
    }

    update(delta) {
        this.time += delta;
        // console.log(this.time);
        if (this.time - this.last > 1 / this.pps) {
            let p;
            if (this.generator) {
                p = this.generator();
            } else {
                const p = new AnimationParticle(Math.random() * this.width, 0);
            }
            if (p.body) {
            }
            this.source.appendChild(p.body);
            this.particles.push(p);
            this.last = this.time;
            if (this.particles.length > this.maxParticles) {
                const kick = this.particles.shift();
                kick.body.parentNode.removeChild(kick.body);
            }
        }

        this.particles.forEach((particle, index) => {
            particle.update(delta, this.force);
            if (particle.progress > 1) {
                particle.remove();
                this.particles.splice(index, 1);
            }
        });
    }

    render() {
        this.particles.forEach((particle) => particle.render());
    }

    addForce(type, value) {
        this.forces[type] = value;
        this.force.x += value.x;
        this.force.y += value.y;
    }

    removeForce(type) {
        const value = this.forces[type];
        this.force.x -= value.x;
        this.force.y -= value.y;
    }

    initialize() {
        if (this.canvas) {
            const canvas = document.createElement("canvas");
            canvas.width = this.width * 8;
            canvas.height = this.height * 20;
        }
        this.pps = this.options.pps || 1000;
        if (this.options.generator) {
            this.generator = this.options.generator;
        }
    }
}

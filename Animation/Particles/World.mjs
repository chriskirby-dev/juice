/**
 * Particle world system with lifecycle states and property-based particle management.
 * Alternative particle system implementation with state-based transitions.
 * @module Animation/Particles/World
 */

import { sortedIndex } from "../../DataTypes/Index.mjs";
import PropertyArray from "../../DataTypes/PropertyArray.mjs";
import geom from "../../Util/Geometry.mjs";
import { random, randomBetween, randomInt, pow, cos, sin } from "../../Util/Math.mjs";

const { angle, distance, lerp, clamp, norm, pointDiff, diff } = geom;

const STATE_PROPS = ["state", "distance", "alpha"];
const POSITION_PROPS = ["x", "y", "z", "bx", "by", "bz", "vx", "vy", "vz"];

function anyLerp(a, b, t) {
    if (typeof a === "number") {
        return lerp(a, b, t);
    } else if (Array.isArray(a)) {
        return a.map((n, i) => lerp(n, b[i], t));
    } else if (typeof a === "object") {
        return Object.keys(a).reduce((r, k) => {
            r[k] = lerp(a[k], b[k], t);
            return r;
        }, {});
    }
    return lerp(a, b, t);
}
/*
const lifeState = new ParticleLifeState(Particle.States.SPAWNED, {
    duration: 1,
    size: 0,
    color: [255, 255, 255, 1],
    get position() {
        return { x: 0, y: 0, z: 0 };
    },
    get velocity() {
        return { x: 0, y: 0, z: 0 };
    },
});
*/
class ParticleLifeState {
    static chain(states) {
        const sorted = states.sort((a, b) => a.state - b.state);
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i + 1] !== undefined) {
                sorted[i].after(sorted[i + 1]);
            }
        }
    }

    prev;
    next;
    properties = ["duration", "size", "color", "position", "velocity"];

    constructor(state, options = {}) {
        this.state = state;
        this.time = 0;
        this.duration = options.duration || 2;
        this.size = options.size || 1;
        this.color = options.color || [255, 255, 255, 1];
        this.spawnPoint = options.spawnPoint || { x: 0, y: 0, z: 0 };
        this.position = options.position || { x: 0, y: 0, z: 0 };

        this.velocity = options.velocity || { x: 0, y: 0, z: 0 };
    }

    initialize() {
        const transitions = null;
        const { properties } = this;

        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            if (this[prop]) {
                transitions[prop] = [];
            }
        }
        if (this.next) {
            for (let property in transitions) {
                if (this.next[property] && this.next[property] !== this[property]) {
                    transitions[property].push(this[property]);
                    transitions[property].push(this.next[property]);
                }
                if (transitions[property].length === 0) {
                    delete transitions[property];
                }
            }
            this.transitions = transitions;
        }
    }

    update(time) {
        this.time += time.delta;
        this.percent = this.time / this.duration;
        for (let property in this.transitions) {
            this[property] = anyLerp(this[property], this.next[property], this.percent);
        }
    }

    after(lifeState) {
        if (this.next === lifeState) return;
        if (this.next) {
            lifeState.next = this.next;
            lifeState.next.prev = lifeState;
        }
        lifeState.prev = this;
        this.next = lifeState;
    }

    before(lifeState) {
        if (this.prev === lifeState) return;
        if (this.prev) {
            lifeState.prev = this.prev;
            lifeState.prev.next = lifeState;
        }
        lifeState.next = this;
        this.prev = lifeState;
    }

    toArray() {
        const { properties } = this;
    }
}

class Particle {
    static States = {
        DEFAULT: 0,
        SPAWNED: 1,
        ACTIVE: 2,
        DYING: 3,
        DEAD: 4,
    };

    static generateLifePath() {
        const spawn = {
            duration: 1,
            size: 0,
            color: [255, 255, 255, 0],
            get position() {
                return { x: 0, y: 0, z: 0 };
            },
            get velocity() {
                return { x: 0, y: 0, z: 0 };
            },
        };

        const active = {
            duration: 2,
            size: () => randomBetween(0.5, 1.5),
            color: [255, 255, 255, randomBetween(0.2, 1)],
            get position() {
                return { x: 0, y: 0, z: 0 };
            },
            get velocity() {
                return { x: 0, y: 0, z: 0 };
            },
        };
        return {
            spawn,
            active,
            dying,
            dead,
        };
    }

    position = { x: 0, y: 0, z: 0 };
    velocity = { x: 0, y: 0, z: 0 };
    state = 0;
    distance = 0;
    alpha = 1;
    birth() {
        this.state = 0;
        this.distance = 0;
        this.alpha = 1;
    }

    constructor(x, y, z = 0) {
        this.position = { x, y, z };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.birth();
    }

    update() {
        switch (this.state) {
            case Particle.States.SPAWNED:
                if (this.updateSpawned) return this.updateSpawned();
                break;
            case Particle.States.ACTIVE:
                if (this.updateActive) return this.updateActive();
                break;
            case Particle.States.DYING:
                if (this.updateDying) return this.updateDying();
                break;
            case Particle.States.DEAD:
                if (this.updateDead) return this.updateDead();
                break;
        }
    }

    stateComplete() {
        if (this.state < Particle.States.DEAD) this.state++;
    }

    updateSpawned() {}

    updateActive() {}

    updateDying() {}

    updateDead() {}
}

class ParticleWorld {
    config = {
        density: 1,
        randomness: 1,
        mask: null,
        env: {
            forces: [],
        },
    };

    constructor() {
        this.particles = [];
        this.emitters = [];
        this.forces = [];
        this.gravity = { x: 0, y: 0.1, z: 0 }; // Default gravity force
    }

    addEmitter(emitter) {
        this.emitters.push(emitter);
    }

    addParticle(x, y, z = 0) {
        this.particles.push(new Particle(x, y, z));
    }

    addForce(force) {
        this.forces.push(force);
    }

    applyForces(particle) {
        // Apply all global forces (e.g., gravity, wind)
        for (const force of this.forces) {
            particle.applyForce(force);
        }
        // Apply default gravity
        particle.applyForce(this.gravity);
    }

    createParticles() {
        this.particles = new PropertyArray(particles.length / POSITION_PROPS.length, POSITION_PROPS, "float");
        this.particles.set(particles, 0);
    }

    update() {
        for (const emitter of this.emitters) {
            emitter.update();
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            this.applyForces(particle);
            particle.update();
            if (particle.isDead()) {
                this.particles.splice(i, 1); // Remove dead particles
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const particle of this.particles) {
            particle.render(this.ctx);
        }
    }

    run() {
        const step = () => {
            this.update();
            this.render();
            requestAnimationFrame(step);
        };
        step();
    }
}

export default ParticleWorld;
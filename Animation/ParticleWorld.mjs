import geom from "../Util/Geometry.mjs";
import { random, randomInt } from "../Util/Math.mjs";
import Canvas from "../Graphics/Canvas.mjs";
import "../Components/Canvas.mjs";
import { sortedIndex } from "../DataTypes/Index.mjs";
import PropertyArray from "../DataTypes/PropertyArray.mjs";
import JuiceWorkers from "../Workers/JuiceWorkers.mjs";

const { pow, cos, sin } = Math;
const { angle, distance, lerp, clamp, norm, pointDiff, diff } = geom;

const PARTICLE_PROPS = ["state", "x", "y", "vx", "vy", "bx", "by", "td", "alpha", "random"];

function distanceWorker(particles) {
    return new Promise((resolve) => {
        const sourceData = [];
        for (let i = 0; i < particles.length; i++) {
            const particle = particles.get(i);
            sourceData[i] = [
                { x: particle[1], y: particle[2] },
                { x: particle[5], y: particle[6] },
            ];
        }
        console.log(sourceData);
        const distWorker = JuiceWorkers.job(function (event) {
            const { chunk } = event.data;
            const distances = [];
            for (let i = 0; i < chunk.length; i++) {
                const pair = chunk[i];
                const dx = pair[0].x - pair[1].x;
                const dy = pair[0].y - pair[1].y;
                distances[i] = Math.sqrt(dx * dx + dy * dy);
            }

            postMessage(distances);
            close(); // Terminate the worker
        }, sourceData).then((resp) => {
            console.log("WORKER RESP", resp);
            for (let i = 0; i < resp.length; i++) {
                particles.set([resp[i]], i, 7);
            }
            resolve(particles);
        });
    });
}

export default class ParticleWorld {
    configuration = {
        density: 1,
        color: [255, 255, 255, 255],
        lerpAmt: 0.001,
        velocityLerpAmt: 0.001,
        initialSpeed: 0.5,
    };

    indexes = {
        byDistance: [],
    };
    // The color of the particles
    // The amount to lerp the particles by

    // The array of particles
    particles = [];
    // The array of pixels
    pixels = [];

    // The repel point
    repel = { x: 0, y: 0, size: 200, source: "mouse" };
    // The image buffer
    imageBuffer;

    // The array of repel points
    repelPoints = [];
    // The current time
    time = 0;
    // Whether to animate the particles
    animate = true;

    // The rest of the class definition...
    createRepelPoint({ x, y, size = 200, source = "coords" }) {
        const point = { x, y, size, current: { x, y } };
        this.repelPoints.push(point);
        return {
            remove: () => {
                this.repelPoints = this.repelPoints.filter((p) => p !== point);
            },
            update: (x, y, size = point.size) => {
                point.x = x;
                point.y = y;
                point.size = size;
            },
        };
    }

    set maxParticles(count) {
        this.options.maxParticles = count;
    }

    get maxParticles() {
        return this.options.maxParticles;
    }

    fill() {}

    constructor(container, options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.container = container;

        this.initialize();
    }

    setRepelPoint(x, y) {
        if (y === undefined) {
            this.repel.source = x;
            return;
        }
        if (typeof this.repel.source == "string") {
            this.repel.source = {};
        }
        this.repel.source.x = x;
        this.repel.source.y = y;
    }

    clearRepelPoint() {
        this.repel.source = { x: 0, y: 0 };
    }

    alphaMaps = [];
    postProcess = [];
    /**
     * Loads an image from the provided source, calculates the position, and places the image on the canvas.
     *
     * @param {string} src - The image source to be loaded.
     * @return {Promise} A Promise that resolves once the image is loaded and placed on the canvas.
     */
    placeAlphaMap(src, position) {
        return new Promise((resolve, reject) => {
            return this.canvas.loadImage(src).then((image) => {
                const center = this.canvas.center;
                console.log("center", center);

                if (typeof position === "function" && position) {
                    position = position(image);
                } else if (!position) {
                    position = { x: center.x - image.height / 2, y: center.y - image.width / 2 };
                }
                console.log("POSITION", position, image.width, image.height);
                // const y = center.y - image.height / 2;
                /// const x = center.x - image.width / 2;
                this.canvas.placeImage(image, position.x, position.y, image.width, image.height);
                //this.postCanvas.placeImage(image, position.x, position.y, image.width, image.height);
                return resolve();
            });
        });
    }

    showAlphaMap(i) {
        const alphaMap = this.alphaMaps[i];
        this.postProcess.push({
            args: { time: 0 },
            fn: () => {
                this.postCanvas.placeImage(alphaMap, 0, 0, this.canvas.width, this.canvas.height);
            },
        });
    }

    createAlphaMap(src) {
        // this.canvas.createOffscreenContent();
        return this.canvas.loadImage(src).then((image) => {});
    }

    createParticles() {
        console.log("CREATE PARTICLES");
        const { initialSpeed, density } = this.configuration;
        const particles = [];
        console.time("CREATE PARTICLES");
        this.canvas.forEachPixel(
            density,
            (x, y, r, g, b, a, pixNum) => {
                //console.log(`Adding Particle at x:${x} y:${y} R:${r} G:${g} B:${b} ALPHA: ${a}`);
                let vx = 0,
                    vy = 0;
                //Random starting position for particle
                const rx = randomInt(this.canvas.width) | 0;
                const ry = randomInt(this.canvas.height) | 0;
                //Distance from particle to its repel point
                const dist = distance(x, y, rx, ry);
                //const dist = null;
                //Angle from particle to its repel point
                const degrees = angle(rx, ry, x, y);
                //The force applied to the particle
                const force = initialSpeed;
                //Difference in x and y between particle and its random starting point
                const dx = diff(x, rx);
                const dy = diff(y, ry);

                //vx = lerp(vx, dx + cos(degrees) * force, 0.01);
                //vy = lerp(vy, dy + sin(degrees) * force, 0.01);

                let particle = [0, rx, ry, vx, vy, x, y, dist, a, 0];

                if (this.onCreateParticle) particle = this.onCreateParticle(...particle);

                particles.push(...particle);
            },
            true
        );
        console.timeEnd("CREATE PARTICLES");
        console.log(`CREATING: ${particles.length / PARTICLE_PROPS.length} Particles`);
        this.particles = new PropertyArray(particles.length / PARTICLE_PROPS.length, PARTICLE_PROPS, "float");
        this.particles.set(particles, 0);
        console.log(`CREATED: ${this.particles.count} Particles`);

        this.speed = 0.0001;
        this.progress = 0;
        //this.canvas.clear();
        return this.particles;
    }

    updateCount = 0;
    flowAngle = 0;
    waveAmplitude = Math.random() * 100 + 100;
    /**
     * Updates a particle's position and velocity based on repel points and other factors.
     *
     * @param {number} x - The current x position of the particle.
     * @param {number} y - The current y position of the particle.
     * @param {number} vx - The current x velocity of the particle.
     * @param {number} vy - The current y velocity of the particle.
     * @param {number} bx - The base x position of the particle.(Where it should stop)
     * @param {number} by - The base y position of the particle. (Where it should stop)
     * @param {number} alpha - The alpha value of the particle.
     * @param {boolean} changed - Whether the particle's position has changed.
     * @return {array} An array containing the updated particle position, velocity, and other values.
     */

    /**
    Possible Update Methods 
    Progress -> 0 - 1
    Speed -> 0 - 1
    time -> 0 - 1
    
    */

    updateParticleOLD(state, x, y, vx, vy, bx, by, totalDistance, alpha, changed) {
        let { repel, options, particle } = this;
        let dx, dy, dist, degrees, force;
        let fullUpdate = false;

        /*dx = diff(bx, x);
        dy = diff(by, y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angleToTarget = Math.atan2(dy, dx);
*/
        //  const progress = distance / totalDistance;
        //  console.log(progress);

        x += vx;
        y += vy;

        // Apply repel force
        switch (state) {
            case 0:
        }

        // make particles travel in wave form paths
        /*
        if (dx + dy > 0) {
            fullUpdate = true;
            vx = lerp(vx, dx, particle.velocityLerpAmt);
            vy = lerp(vy, dy, particle.velocityLerpAmt);
        } else {
            vx = lerp(vx, 0, particle.velocityLerpAmt);
            vy = lerp(vy, 0, particle.velocityLerpAmt);
        }
            */

        // Increment progress based on speed
        this.progress += this.speed;
        if (x == 1 && y == 1) console.log(this.progress);
        // Calculate the S-curve offset (arc left and right)
        // const sOffset = Math.sin(this.progress / this.wavelength) * this.amplitude;
        // x += Math.cos(angleToTarget) * this.speed;
        //  y += Math.sin(angleToTarget) * this.speed;

        // Apply the S-curve offset perpendicular to the direction of movement
        //   x += Math.sin(angleToTarget) * sOffset;
        //   y -= Math.cos(angleToTarget) * sOffset;

        // Gradually slow down as it approaches the target
        this.speed = Math.max(this.speed * 0.99, 0.3);
        // Calculate the S-curve offset
        //const sOffsetX = Math.sin(this.offset + this.frequency * distance) * this.amplitude;
        // const sOffsetY = Math.cos(this.offset + this.frequency * distance) * this.amplitude;
        /*
        this.flowAngle += Math.sin(this.speed) * 0.001; // Gentle swirling
        const waveOffsetX = Math.cos(this.flowAngle) * this.waveAmplitude;
        const waveOffsetY = Math.sin(this.flowAngle) * this.waveAmplitude;

        x += Math.cos(angleToTarget) * this.speed + waveOffsetX;
        y += Math.sin(angleToTarget) * this.speed + waveOffsetY;
*/
        // Move towards the target with S-pattern drifting
        //  x += Math.cos(angleToTarget) * this.speed + sOffsetX;
        //   y += Math.sin(angleToTarget) * this.speed + sOffsetY;

        // Gradually slow down as it approaches the target
        //  this.speed = Math.max(this.speed * 0.99, 0.3); // Slow down gently
        // this.speed = Math.max(this.speed * 0.99, 0.3); // Slow down more gently
        /*
        this.repelPoints.forEach((point) => {
            dist = distance(x, y, point.x, point.y);
            if (dist < point.size || dx + dy > 0) {
                degrees = angle(point.x, point.y, x, y);

                force = (pow(point.size, 2) / dist) * (dist / point.size);
                //Update particle velocity
                vx = lerp(vx, dx + cos(degrees) * force, particle.velocityLerpAmt);
                vy = lerp(vy, dy + sin(degrees) * force, particle.velocityLerpAmt);
            }
        });
        // console.log(`updateParticle: RXP:${repelX} RYP:${repelY}`);
        if (this.beforeParticleUpdate) {
            ({ x, y, vx, vy } = this.beforeParticleUpdate({ x, y, vx, vy, dist, alpha, degrees }));
            fullUpdate = true;
        }
*/
        //update particle position
        // x = lerp(x, x + vx, particle.lerpAmt);
        //  y = lerp(y, y + vy, particle.lerpAmt);
        // console.log(`updateParticle: X:${x} Y:${y} VX:${vx} VY:${vy}`);

        return fullUpdate ? [state, x, y, vx, vy, bx, by, totalDistance, alpha, changed] : [state, x, y, vx, vy];
    }

    updateParticle(state, x, y, vx, vy, bx, by, totalDistance, alpha, changed) {
        let fullUpdate = false;
        // console.log(`STATE:${state} X:${x} Y:${y} VX:${vx} VY:${vy}`);
        x += vx;
        y += vy;
        return fullUpdate ? [state, x, y, vx, vy, bx, by, totalDistance, alpha, changed] : [state, x, y, vx, vy];
    }

    update(time) {
        this.time = time;
        //   console.log("World Update", time);
        let i, _x, _y;
        let { repel, options } = this;
        const { mouseX, mouseY, isMouseOver } = this.canvas;
        const { color } = this.configuration;
        //Reset Buffer to all 0's transparent
        this.canvas.buffer.reset();
        // console.log(`START OF UPDATE REPEL X:${repelX} Y:${repelY} MOUSE X:${mouseX} Y:${mouseY}`);

        this.repelPoints.forEach((point) => {
            if (point.source == "mouse") {
                if (isMouseOver) {
                    point.x = lerp(point.x, mouseX, options.lerpAmt);
                    point.y = lerp(point.y, mouseY, options.lerpAmt);
                    point.size = 150;
                } else {
                    point.x = 0;
                    point.y = 0;
                    point.size = 10;
                }
            }
        });

        this.particles.forEach(([state, x, y, vx, vy, bx, by, td, alpha, changed], index) => {
            _x = x | 0;
            _y = y | 0;
            // console.log(`X:${_x} Y:${_y} VX:${vx} VY:${vy} BX:${bx} BY:${by} ALPHA:${alpha}`);
            if (this.canvas.inBounds(x, y)) {
                //Get correct pixel index based on coords and write pixel data to buffer
                i = 4 * (_x + _y * this.canvas.width);
                this.canvas.buffer.set([color[0], color[1], color[2], alpha], i);
            }
            let update;
            if (state == 0 && !this.updateSpawnedParticle) {
                update = this.updateParticle(state, x, y, vx, vy, bx, by, td, alpha, changed, index);
            } else if (state == 0 && this.updateSpawnedParticle) {
                update = this.updateSpawnedParticle(state, x, y, vx, vy, bx, by, td, alpha, changed, index);
            } else if (state == 1 && this.updateActiveParticle) {
                update = this.updateActiveParticle(state, x, y, vx, vy, bx, by, td, alpha, changed, index);
            } else if (state == 2 && this.updateExpiredParticle) {
                update = this.updateExpiredParticle(state, x, y, vx, vy, bx, by, td, alpha, changed, index);
            }

            update = this.updateParticle(...update);
            // console.log(index, update);
            this.particles.set(update, index);
        });
        // console.log(`END OF UPDATE REPEL X:${repel.x} Y:${repel.y} MOUSE X:${mouseX} Y:${mouseY}`);
        this.updateCount++;
    }

    render() {
        if (!this.ready) return;

        this.canvas.buffer.apply();

        this.ctx.save();

        this.ctx.filter = "blur(8px) brightness(200%)";
        this.ctx.drawImage(this.canvas.offscreen, 0, 0);

        this.ctx.filter = "blur(2px)";
        this.ctx.globalCompositeOperation = "lighter";
        this.ctx.drawImage(this.canvas.offscreen, 0, 0);

        if (this.postProcess.length > 0) {
            this.postProcess.forEach((post) => post.fn(post.args));
        }

        this.ctx.restore();
        this.canvas.render();
    }

    initialize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas = document.createElement("juice-canvas");
        this.canvas.className = "particle-world";
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.canvas.setAttribute("prerender", "");

        this.postCanvas = document.createElement("juice-canvas");
        this.postCanvas.className = "particle-world-post";
        this.postCanvas.width = rect.width;
        this.postCanvas.height = rect.height;

        this.canvas.addEventListener("ready", () => {
            const ctx = this.canvas.getContext("2d");
            this.postCtx = this.postCanvas.getContext("2d");
            this.ctx = ctx;
            this.ready = true;
            //this.canvas.renderCanvas();
        });
        this.container.appendChild(this.postCanvas);
        this.container.appendChild(this.canvas);
    }
}

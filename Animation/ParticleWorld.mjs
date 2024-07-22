import geom from "../Util/Geometry.mjs";
import { random, randomInt } from "../Util/Math.mjs";
import Canvas from "../Graphics/Canvas.mjs";
import "../Components/Canvas.mjs";
import PropertyArray from "../DataTypes/PropertyArray.mjs";

const { pow, cos, sin } = Math;
const { angle, distance, lerp, clamp, norm, pointDiff, diff } = geom;

const PARTICLE_PROPS = ["x", "y", "vx", "vy", "bx", "by", "alpha", "random"];

export default class ParticleWorld {
    options = {
        color: [255, 255, 255, 255],
        //How fast reaction to mouse occurs
        lerpAmt: 0.25,
        //Amount of pixels to repel particles from
        particles: {
            //Lerp Speed
            lerpAmt: 0.005,
            //Velocity Lerp Amount
            vLerpAmt: 0.01,
        },
    };

    particles = [];
    pixels = [];

    repel = { x: 0, y: 0, size: 200, source: "mouse" };
    imageBuffer;

    repelPoints = [];
    time = 0;

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

                if (typeof position === "function" && position) {
                    position = position(image);
                } else if (!position) {
                    position = { x: center.y - image.height / 2, y: center.x - image.width / 2 };
                }
                console.log("POSITION", position);
                // const y = center.y - image.height / 2;
                /// const x = center.x - image.width / 2;
                this.canvas.placeImage(image, position.x, position.y, image.width, image.height);

                return resolve();
            });
        });
    }
    createParticles(density = 1) {
        console.log("CREATE PARTICLES");
        const particles = [];
        this.canvas.forEachPixel(
            this.options.density,
            (x, y, r, g, b, a, pixNum) => {
                //console.log(`Adding Particle at x:${x} y:${y} R:${r} G:${g} B:${b} ALPHA: ${a}`);
                let vx = 0,
                    vy = 0;
                const rx = randomInt(this.canvas.width) | 0;
                const ry = randomInt(this.canvas.height) | 0;
                const dist = distance(x, y, rx, ry);
                const degrees = angle(rx, ry, x, y);
                const force = 100;
                const dx = diff(x, rx);
                const dy = diff(y, ry);
                vx = lerp(vx, dx + cos(degrees) * force, 0.01);
                vy = lerp(vy, dy + sin(degrees) * force, 0.01);
                particles.push(rx, ry, vx, vy, x, y, a, random(1));
            },
            true
        );
        console.log(particles);
        console.log(`Finished creating ${particles.length / PARTICLE_PROPS.length} particles`);
        this.particles = new PropertyArray(particles.length / PARTICLE_PROPS.length, PARTICLE_PROPS, "float");
        this.particles.set(particles, 0);
        console.log(`Particle count: ${this.particles.count}`);
        console.log(`LAST PARTICLE: ${this.particles[this.particles.count - 1]}`);
        console.log(this.particles);
        //this.canvas.clear();
        return this.particles;
    }

    updateCount = 0;
    updateParticle(x, y, vx, vy, bx, by, alpha, changed) {
        let { repel, options } = this;
        const { particles } = options;
        let dx, dy, dist, degrees, force;
        let fullUpdate = false;

        dx = diff(bx, x);
        dy = diff(by, y);

        this.repelPoints.forEach((point) => {
            dist = distance(x, y, point.x, point.y);
            if (dist < point.size || dx + dy > 0) {
                degrees = angle(point.x, point.y, x, y);

                force = (pow(point.size, 2) / dist) * (dist / point.size);
                //Update particle velocity
                vx = lerp(vx, dx + cos(degrees) * force, particles.vLerpAmt);
                vy = lerp(vy, dy + sin(degrees) * force, particles.vLerpAmt);
            }
        });
        // console.log(`updateParticle: RXP:${repelX} RYP:${repelY}`);
        if (this.beforeParticleUpdate) {
            ({ x, y, vx, vy } = this.beforeParticleUpdate({ x, y, vx, vy, dist, alpha, degrees }));
            fullUpdate = true;
        }

        //update particle position
        x = lerp(x, x + vx, particles.lerpAmt);
        y = lerp(y, y + vy, particles.lerpAmt);
        // console.log(`updateParticle: X:${x} Y:${y} VX:${vx} VY:${vy}`);

        return fullUpdate ? [x, y, vx, vy, bx, by, alpha, changed] : [x, y, vx, vy];
    }

    update(time) {
        this.time += time.delta;
        //   console.log("World Update", time);
        let i, _x, _y;
        let { repel, options } = this;
        const { mouseX, mouseY, isMouseOver } = this.canvas;
        const { color } = options;
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

        this.particles.forEach(([x, y, vx, vy, bx, by, alpha, changed], index) => {
            _x = x | 0;
            _y = y | 0;
            // console.log(`X:${_x} Y:${_y} VX:${vx} VY:${vy} BX:${bx} BY:${by} ALPHA:${alpha}`);
            if (this.canvas.inBounds(x, y)) {
                //Get correct pixel index based on coords and write pixel data to buffer
                i = 4 * (_x + _y * this.canvas.width);
                this.canvas.buffer.set([color[0], color[1], color[2], alpha], i);
            }

            this.particles.set(this.updateParticle(x, y, vx, vy, bx, by, alpha, changed), index);
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

        this.canvas.addEventListener("ready", () => {
            const ctx = this.canvas.getContext("2d");
            this.ctx = ctx;
            this.ready = true;
            //this.canvas.renderCanvas();
        });

        this.container.appendChild(this.canvas);
    }
}

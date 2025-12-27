/**
 * Particle emitter for spawning particles at a specified rate.
 * Emits particles with configurable direction, speed, spread, and lifespan.
 * @module Animation/Particles/Emitter
 */

/**
 * Particle emitter that creates particles continuously at a specified rate.
 * @class ParticleEmitter
 * @example
 * const emitter = new ParticleEmitter({
 *   x: 100, y: 100,
 *   particlesPerSecond: 50,
 *   direction: Math.PI / 2,
 *   speed: 100
 * });
 */
class ParticleEmitter {
    constructor({
        x,
        y,
        particlesPerSecond = 10,
        direction = 0,
        speed = 100,
        spread = Math.PI / 8,
        size = 2,
        lifespan = 2,
        forces = [],
        useDOM = false,
    }) {
        this.x = x;
        this.y = y;
        this.particlesPerSecond = particlesPerSecond;
        this.direction = direction;
        this.speed = speed;
        this.spread = spread;
        this.size = size;
        this.lifespan = lifespan;
        this.forces = forces;
        this.particles = [];
        this.lastEmissionTime = 0;
        this.useDOM = useDOM;
    }

    emit(deltaTime) {
        this.lastEmissionTime += deltaTime;
        const emissionRate = 1 / this.particlesPerSecond;

        while (this.lastEmissionTime > emissionRate) {
            this.lastEmissionTime -= emissionRate;

            const randomDirection = this.direction + (Math.random() * this.spread - this.spread / 2);
            const randomSpeed = this.speed + Math.random() * this.speed * 0.2 - this.speed * 0.1;
            const randomSize = this.size + Math.random() * this.size * 0.5 - this.size * 0.25;
            const randomLifespan = this.lifespan + Math.random() * this.lifespan * 0.5 - this.lifespan * 0.25;

            const velocityX = Math.cos(randomDirection) * randomSpeed;
            const velocityY = Math.sin(randomDirection) * randomSpeed;

            const particle = new Particle(
                this.x,
                this.y,
                velocityX,
                velocityY,
                randomSize,
                randomLifespan,
                this.forces,
                this.useDOM
            );
            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        // Emit new particles
        this.emit(deltaTime);

        // Update existing particles
        this.particles = this.particles.filter((particle) => {
            particle.update(deltaTime);
            if (!particle.isAlive()) {
                particle.remove(); // Remove DOM element if necessary
                return false;
            }
            return true;
        });
    }

    draw(ctx) {
        if (!this.useDOM) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            this.particles.forEach((particle) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }
}

// Force Presets
const ForcePresets = {
    gravity: { x: 0, y: 200 },
    wind: { x: 50, y: 0 },
    upwardLift: { x: 0, y: -100 },
};

// Example usage:

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Combine forces from the presets
const forces = [ForcePresets.gravity, ForcePresets.wind];

// Example using Canvas
const emitterCanvas = new ParticleEmitter(250, 250, 20, Math.PI / 2, 100, Math.PI / 4, 5, 2, forces, false);

// Example using DOM
const emitterDOM = new ParticleEmitter(250, 250, 20, Math.PI / 2, 100, Math.PI / 4, 5, 2, forces, true);

function animate() {
    const deltaTime = 1 / 60;

    // Update and draw canvas particles
    emitterCanvas.update(deltaTime);
    emitterCanvas.draw(ctx);

    // Update DOM particles
    emitterDOM.update(deltaTime);

    requestAnimationFrame(animate);
}

animate();
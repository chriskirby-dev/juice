class Particle {
    constructor(x, y, velocityX, velocityY, size, lifespan, forces = [], useDOM = false) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size;
        this.lifespan = lifespan;
        this.age = 0;
        this.forces = forces;
        this.useDOM = useDOM;

        // Create a DOM element if useDOM is true
        if (this.useDOM) {
            this.element = document.createElement("div");
            this.element.style.position = "absolute";
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.backgroundColor = "black";
            this.element.style.borderRadius = "50%";
            document.body.appendChild(this.element);
            this.render = this.renderDom;
        } else {
            this.render = this.renderCanvas;
        }
    }

    applyForces(deltaTime) {
        this.forces.forEach((force) => {
            this.velocityX += force.x * deltaTime;
            this.velocityY += force.y * deltaTime;
        });
    }

    update(deltaTime) {
        // Apply forces to the particle
        this.applyForces(deltaTime);

        // Update particle position based on velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Update DOM element position if using DOM
        if (this.useDOM) {
            this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
        }

        // Age the particle
        this.age += deltaTime;
    }

    renderDom() {
        if (this.useDOM && this.element) {
            this.element.style.opacity = this.age / this.lifespan;
        }
    }

    renderCanvas(ctx) {
        if (!this.useDOM) {
            ctx.fillStyle = "black";
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    isAlive() {
        return this.age < this.lifespan;
    }

    remove() {
        if (this.useDOM && this.element) {
            document.body.removeChild(this.element);
        }
    }
}

export default Particle;

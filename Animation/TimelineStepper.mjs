/**
 * Timeline stepper for keyframe-based animations with easing.
 * Animates element properties through defined keyframes over time.
 * @module Animation/TimelineStepper
 */

/**
 * Manages keyframe-based animations for DOM elements.
 * @class TimelineStepper
 * @param {HTMLElement} element - The element to animate
 * @example
 * const stepper = new TimelineStepper(element);
 * stepper.addKeyframe({opacity: 1}, 1000, 'easeInQuad').start();
 */
class TimelineStepper {
    constructor(element) {
        this.element = element;
        this.keyframes = [];
        this.totalDuration = 0;
        this.currentTime = 0;
        this.running = false;
        this.startTime = null;
    }

    addKeyframe(properties, duration, easing = "linear") {
        this.keyframes.push({ properties, duration, easing });
        this.totalDuration += duration;
        return this;
    }

    easeFunction(easing, t) {
        // Simple linear easing as default
        if (easing === "linear") return t;

        // Add more easing functions as needed
        if (easing === "easeInQuad") return t * t;
        if (easing === "easeOutQuad") return t * (2 - t);
        if (easing === "easeInOutQuad") return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        // Default to linear
        return t;
    }

    animateFrame() {
        if (!this.running) return;

        const elapsedTime = performance.now() - this.startTime;
        this.currentTime = elapsedTime;

        let timePassed = 0;

        for (let i = 0; i < this.keyframes.length; i++) {
            const keyframe = this.keyframes[i];

            if (this.currentTime < timePassed + keyframe.duration) {
                const progress = (this.currentTime - timePassed) / keyframe.duration;
                const easedProgress = this.easeFunction(keyframe.easing, progress);

                for (const property in keyframe.properties) {
                    const startValue = parseFloat(window.getComputedStyle(this.element)[property]) || 0;
                    const endValue = parseFloat(keyframe.properties[property]);

                    const value = startValue + easedProgress * (endValue - startValue);
                    this.element.style[property] = value + (isNaN(endValue) ? "" : "px");
                }
                break;
            }

            timePassed += keyframe.duration;
        }

        if (this.currentTime < this.totalDuration) {
            requestAnimationFrame(() => this.animateFrame());
        } else {
            this.running = false;
        }
    }

    start() {
        if (this.running) return;

        this.running = true;
        this.startTime = performance.now();
        requestAnimationFrame(() => this.animateFrame());
    }

    reset() {
        this.running = false;
        this.currentTime = 0;
        this.startTime = null;
    }
}

// Example usage:

/*
// Create a TimelineStepper
const timeline = new TimelineStepper(box);

// Add keyframes
timeline
    .addKeyframe({ left: 200 }, 1000, "easeInQuad") // Move to the right
    .addKeyframe({ top: 200 }, 1000, "easeOutQuad") // Move down
    .addKeyframe({ left: 0 }, 1000, "easeInOutQuad") // Move back to the left
    .addKeyframe({ top: 0 }, 1000, "linear"); // Move back up

// Start the animation
timeline.start();
*/
/**
 * Preset animation effects for common motion patterns.
 * Provides ready-to-use animation patterns like wobble, bounce, shake, fade, scale, and rotate.
 * @module Animation/Presets
 */

/**
 * AnimationPresets class providing static preset animation methods.
 * Each method returns position, opacity, scale, or rotation values based on time progress.
 * @class AnimationPresets
 */
export class AnimationPresets {
    /**
     * Wobble animation with oscillating horizontal and vertical movement.
     * @param {number} time - Current time
     * @param {number} duration - Total duration
     * @param {number} amount - Wobble intensity
     * @returns {{x: number, y: number}} Wobble offset
     * @static
     */
    static wobble(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = Math.sin(timeFraction * Math.PI * 4); // 4 oscillations per duration
        return { x: progress * amount, y: (progress * amount) / 2 };
    }

    /**
     * Bounce animation with vertical bouncing motion.
     * @param {number} time - Current time
     * @param {number} duration - Total duration
     * @param {number} amount - Bounce height
     * @returns {{x: number, y: number}} Bounce offset
     * @static
     */
    static bounce(time, duration, amount) {
        const timeFraction = time / duration;
        const progress =
            timeFraction < 0.5 ? Math.sin(timeFraction * Math.PI) / 2 : 1 - Math.sin(timeFraction * Math.PI) / 2;
        return { x: 0, y: -progress * amount };
    }

    /**
     * Shake animation with horizontal shaking motion.
     * @param {number} time - Current time
     * @param {number} duration - Total duration
     * @param {number} amount - Shake intensity
     * @returns {{x: number, y: number}} Shake offset
     * @static
     */
    static shake(time, duration, amount) {
        const timeFraction = time / duration;
        const progress =
            timeFraction < 0.5
                ? Math.sin(timeFraction * Math.PI * 2) / 2
                : 1 - Math.sin(timeFraction * Math.PI * 2) / 2;
        return { x: progress * amount, y: 0 };
    }

    /**
     * Fade in animation.
     * @param {number} time - Current time
     * @param {number} duration - Total duration
     * @param {number} amount - Target opacity multiplier
     * @returns {{x: number, y: number, opacity: number}} Fade in values
     * @static
     */
    static fadeIn(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        return { x: 0, y: 0, opacity: progress * amount };
    }

    /**
     * Fade out animation.
     * @param {number} time - Current time
     * @param {number} duration - Total duration
     * @param {number} amount - Opacity reduction multiplier
     * @returns {{x: number, y: number, opacity: number}} Fade out values
     * @static
     */
    static fadeOut(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        return { x: 0, y: 0, opacity: (1 - progress) * amount };
    }

    /**
     * Scale up animation.
     * @param {number} time - Current time
     * @param {number} duration - Total duration
     * @param {number} amount - Scale increase amount
     * @returns {{x: number, y: number, scale: number}} Scale up values
     * @static
     */
    static scaleUp(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        const scale = 1 + progress * amount;
        return { x: 0, y: 0, scale };
    }

    /**
     * Scale down animation.
     * @param {number} time - Current time
     * @param {number} duration - Total duration
     * @param {number} amount - Scale reduction amount
     * @returns {{x: number, y: number, scale: number}} Scale down values
     * @static
     */
    static scaleDown(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        const scale = 1 - progress * amount;
        return { x: 0, y: 0, scale };
    }

    /**
     * Rotation animation.
     * @param {number} time - Current time
     * @param {number} duration - Total duration
     * @param {number} amount - Number of full rotations
     * @returns {{x: number, y: number, angle: number}} Rotation values
     * @static
     */
    static rotate(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        const angle = progress * 360 * amount;
        return { x: 0, y: 0, angle };
    }
}
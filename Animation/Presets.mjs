export class AnimationPresets {
    static wobble(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = Math.sin(timeFraction * Math.PI * 4); // 4 oscillations per duration
        return { x: progress * amount, y: (progress * amount) / 2 };
    }

    static bounce(time, duration, amount) {
        const timeFraction = time / duration;
        const progress =
            timeFraction < 0.5 ? Math.sin(timeFraction * Math.PI) / 2 : 1 - Math.sin(timeFraction * Math.PI) / 2;
        return { x: 0, y: -progress * amount };
    }

    static shake(time, duration, amount) {
        const timeFraction = time / duration;
        const progress =
            timeFraction < 0.5
                ? Math.sin(timeFraction * Math.PI * 2) / 2
                : 1 - Math.sin(timeFraction * Math.PI * 2) / 2;
        return { x: progress * amount, y: 0 };
    }

    static fadeIn(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        return { x: 0, y: 0, opacity: progress * amount };
    }

    static fadeOut(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        return { x: 0, y: 0, opacity: (1 - progress) * amount };
    }

    static scaleUp(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        const scale = 1 + progress * amount;
        return { x: 0, y: 0, scale };
    }

    static scaleDown(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        const scale = 1 - progress * amount;
        return { x: 0, y: 0, scale };
    }

    static rotate(time, duration, amount) {
        const timeFraction = time / duration;
        const progress = timeFraction;
        const angle = progress * 360 * amount;
        return { x: 0, y: 0, angle };
    }
}

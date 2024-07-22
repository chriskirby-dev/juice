import AniUtil from "./Util.mjs";
import AnimationTime from "./Time.mjs";

window.requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (f) {
        return setTimeout(f, 1000 / 60);
    }; // simulate calling code 60

window.cancelAnimationFrame =
    window.cancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    function (requestID) {
        clearTimeout(requestID);
    }; //fall back

class Ticker {
    active = false;
    timelines = [];
    ms = 0;

    time = new AnimationTime();

    constructor(...timelines) {
        this.timelines = timelines;
    }

    start() {
        const self = this;
        self.active = true;

        function tick(ms) {
            self.ms = ms;
            //app.log('Ticker tick', ms, self.timelines );
            for (let i = 0; i < self.timelines.length; i++) {
                self.timelines[i].tick(ms);
                if (!self.timelines[i].active) {
                    self.timelines.splice(i, 1);
                    i--;
                }
            }

            if (self.timelines.length == 0) self.stop(tick);

            if (self.active) window.requestAnimationFrame(tick);
            return false;
        }

        window.requestAnimationFrame(tick);
    }

    stop(fn) {
        this.active = false;
        if (fn) window.cancelAnimationFrame(fn);
    }

    add(...timelines) {
        for (let i = 0; i < timelines.length; i++) this.timelines.push(timelines[i]);
        if (!this.active) this.start();
    }

    remove(timeline) {
        for (let i = 0; i < this.timelines.length; i++) {
            if (this.timelimes[i] === timeline) {
                this.timelines.splice(i, 1);
                break;
            }
        }
        if (!this.timelines.length) {
            this.stop();
        }
    }
}

const ticker = new Ticker();

class Timeline {
    static instances = [];
    debugging = false;
    _active = false;
    _complete = false;
    _update = null;
    _render = null;
    fps = null;
    duration = null;
    time = null;
    props = {};
    paused = true;
    started = false;
    lastFrame = 0;
    animators = {
        updaters: [],
        renderers: [],
    };
    constructor(scope = this, options = {}) {
        if (scope) this.scope = scope;
        this.options = options;
        if (options.fps) this.fps = options.fps;
        this.time = new AnimationTime({ max: options.stop, fps: options.fps || Infinity });

        if (options.stats) {
            this.stats = document.createElement("animation-stats");
            document.body.appendChild(this.stats);
        }

        Timeline.instances.push(this);
        this.index = Timeline.instances.length - 1;
        if (!options.defer) {
            this.start();
        }
    }

    start() {
        this.active = true;
        this.paused = false;
        this.started = true;
    }

    reset() {
        this.time.reset();
    }

    get active() {
        return this._active;
    }

    set active(active) {
        if (active && !this._active) {
            this._active = active;
            ticker.add(this);
        } else {
            this._active = active;
        }
    }

    set render(fn) {
        this._render = fn.bind(this.scope);
    }

    set update(fn) {
        this._update = fn.bind(this.scope);
    }

    set complete(fn) {
        this._complete = fn.bind(this.scope);
    }

    afterUpdate(fn) {
        this._afterUpdate = fn.bind(this.scope);
    }

    debug(parent = document.body) {
        if (!this._stats) {
            this._stats = document.createElement("animation-stats");
            parent.appendChild(this._stats);
        }
    }

    cancel() {
        this._complete = true;
        this.active = false;
    }

    addUpdate(fn) {
        this.animators.updaters.push(fn);
    }

    addRender(fn) {
        this.animators.renderers.push(fn);
    }

    addAnimator(animator) {
        console.log("Add Animator", animator);
        animator._timeline = this;
        const scope = animator;
        if (animator.animation) {
            animator = animator.animation;
        }
        if (typeof animator.update == "function") {
            this.animators.updaters.push(animator.update.bind(scope));
        }

        if (typeof animator.render == "function") {
            this.animators.renderers.push(animator.render.bind(scope));
        }
    }

    tick(ms) {
        if (this.paused) return;

        if (this.fps && this.fps !== Infinity) {
            const currentFPS = 1000 / (ms - this.lastFrame);
            ///console.log("FPS", currentFPS);
            if (currentFPS > this.fps) {
                //   console.groupEnd();
                return;
            }
        }
        if (this.time.update(ms)) {
            //if (this.stats) this.stats.update(this.time);
            if (this._update) this._update(this.time);
            if (this.animators.updaters.length) {
                this.animators.updaters.forEach((updater) => updater(this.time));
            }
            //After Update Hook
            if (this._afterUpdate) this._afterUpdate(this.time);

            if (this._render) this._render(this.time);
            if (this.animators.renderers.length) {
                this.animators.renderers.forEach((renderer) => renderer(this.time));
            }

            this.lastFrame = ms;
        } else {
            if (this._complete && typeof this._complete == "function") {
                this.active = false;
                this._complete();
            }
        }

        //console.log("Time:", this.time.seconds);
        //console.groupEnd();
    }

    pause() {
        this.paused = true;
    }

    play(duration) {
        if (!this.started) this.start();
        this.paused = false;
        if (duration) setTimeout(() => this.pause(), duration);
    }
}

export default Timeline;

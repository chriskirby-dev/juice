import Emitter from "../../Event/Emitter.mjs";
import { cancel } from "../../Event/Event.mjs";

class Draggable {
    static make(el) {
        return new Draggable(el);
    }

    image;
    element;
    #defined = {};

    start = {};
    current = {};
    last = {};
    delta = {};

    constructor(el) {
        this.element = el;
        this.state = "idle";
        this.initialize();
    }

    get state() {
        return this.#defined.state;
    }

    set state(state) {
        this.#defined.state = state;
        if (this.element)
            this.element.dispatchEvent(
                new CustomEvent("state", { detail: { state, lastEvent: this.#defined.lastEvent } })
            );
    }

    get distance() {
        const dx = this.current.x - this.start.x;
        const dy = this.current.y - this.start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return { x: dx, y: dy, length: distance };
    }

    diff(a, b) {
        return { x: a.x - b.x, y: a.y - b.y };
    }

    grab(e) {
        debug("down");
        const self = this;
        e.preventDefault();
        e.stopPropagation();
        this.state = "grabbed";
        this.element.setPointerCapture(e.pointerId);
        this.element.removeEventListener("pointerdown", this.grab);

        const rect = this.element.getBoundingClientRect();

        window.addEventListener("pointermove", this.drag);
        window.addEventListener("pointerup", this.drop);

        this.dragging = true;

        this.start = { x: e.clientX, y: e.clientY, rect: rect };
        this.current = { x: e.clientX, y: e.clientY };
        this.last = { ...this.current };

        self.element.dispatchEvent(
            new CustomEvent("dragstart", {
                detail: {
                    ...this.start,
                    event: e,
                },
            })
        );

        function monitor(time) {
            //Update current position time
            self.current.time = time;
            self.delta = self.diff(self.last, self.current);
            self.delta.time = self.last.time ? time - self.last.time : 0;

            self.last = { ...self.current };
            self.last.time = time;
            // debug(self.delta);

            self.element.dispatchEvent(
                new CustomEvent("drag", {
                    detail: {
                        start: self.start,
                        current: self.current,
                        delta: self.delta,
                        distance: self.distance,
                        last: self.last,
                    },
                })
            );
            // debug('DRAG STATE', self.state);
            if (self.state !== "dropped") {
                window.requestAnimationFrame(monitor);
            } else {
                self.reset();
            }
        }

        monitor();
    }

    drag(e) {
        e.preventDefault();
        this.state = "dragging";
        this.current = { x: e.clientX, y: e.clientY };
    }

    drop(e) {
        this.state = "dropped";
        this.element.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", this.drag);
        window.removeEventListener("pointerup", this.drop);

        this.element.dispatchEvent(
            new CustomEvent("dragstop", {
                detail: {
                    current: this.current,
                    delta: this.delta,
                    distance: this.distance,
                    last: this.last,
                },
            })
        );

        this.dragging = false;
    }

    reset() {
        this.state = "idle";
        this.start = { x: 0, y: 0 };
        this.current = { x: 0, y: 0 };
        this.last = {};
        this.delta = {};

        this.element.addEventListener("pointerdown", this.grab, false);
    }

    initialize() {
        /*
        Object.defineProperty( this.element, 'drag', {
            get: () => {
                return {
                    start: this.start,
                    current: this.current,
                    get distance(){
                        return this.distance;
                    }
                }
            }   
            
        });
*/
        this.grab = this.grab.bind(this);
        this.drag = this.drag.bind(this);
        this.drop = this.drop.bind(this);

        this.element.addEventListener("pointerdown", this.grab, false);
    }
}

export default Draggable;
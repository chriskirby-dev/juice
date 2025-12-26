/**
 * Keyboard input management with event handling.
 * @module Control/Keyboard
 */

import KeyCodes from "./KeyCodes.mjs";
import EventEmitter from "../Event/Emitter.mjs";

/**
 * Keyboard class manages keyboard input and emits events for key presses.
 * @class Keyboard
 * @extends EventEmitter
 */
class Keyboard extends EventEmitter {
    pressed = [];
    only = [];
    global = false;
    /**
     * Creates a new Keyboard instance and sets up event listeners.
     */
    constructor() {
        super();
        this.keys = {};
        this.keyDown = this.keyDown.bind(this);
        this.keyUp = this.keyUp.bind(this);
        window.addEventListener("keydown", this.keyDown);
        window.addEventListener("keyup", this.keyUp);
        this.on("listener", (name) => {
            if (this.global) return;
            if (["keyup", "keydown"].includes(name)) {
                this.global = true;
                this.only = [];
            }

            this.only.push(name);
        });
    }

    listenOnly(...keys) {
        this.only = keys;
    }

    keyDown(event) {
        if (!event.repeat) this.pressed.push(event.key);
        if (this.only.length && this.only.includes(event.key)) {
            this.emit(event.key, "down", event.repeat);
            this.emit("keydown", event.key, event.repeat);
        } else {
            this.emit(event.key, "down", event.repeat);
            this.emit("keydown", event.key, event.repeat);
        }
    }

    keyUp(event) {
        this.pressed.splice(this.pressed.indexOf(event.key), 1);
        if (this.only && this.only.includes(event.key)) {
            this.emit(event.key, "up");
            this.emit("up", event.key);
        } else {
            this.emit(event.key, "dowuupp");
            this.emit("up", event.key);
        }
    }

    isKeyDown(key) {
        return this.pressed.indexOf(key) !== -1;
    }
}

export default Keyboard;
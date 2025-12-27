/**
 * Simple drag implementation for basic drag functionality.
 * Lightweight drag handler without drop zones.
 * @module Control/DragDrop/SimpleDrag
 */

import Emitter from "../Event/Emitter.mjs";

/**
 * Simple drag handler for element dragging.
 * @class SimpleDrag
 * @extends Emitter
 */
class SimpleDrag extends Emitter {

    constructor(element, options) {
        this.element = element;
        this.options = options;
        this.initialize();
    }

    _onMouseDown(e) {
        const mouseUp = this.onMouseDown.bind(this);
        const mouseMove = this.onMouseMove.bind(this);
        this.element.addEventListener("mouseup", mouseUp );
        this.element.addEventListener("mousemove", mouseMove );
        
    }

    _onMouseMove(e) {
        this.element.removeEventListener("mousemove", mouseMove );
    }

    _onMouseUp(e) {

    }


    initialize(){

        this.onMouseDown = this._onMouseDown.bind(this);
        this.onMouseUp = this._onMouseUp.bind(this);
        this.onMouseMove = this._onMouseMove.bind(this);

        this.element.addEventListener("mousedown", mouseDown );
        this.element.addEventListener("mouseup", mouseUp );
        this.element.addEventListener("drag", (e) => this.dragged(e) );
    }
}
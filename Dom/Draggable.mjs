import EventEmitter from "../Event/Emitter.mjs";

class Draggable extends EventEmitter {

    element;
    change = {};
    start = {};

    constructor(element) {
        this.element = element;

        this.initialize();
    }

    dragStop(e){
        this.change = { clientX: e.clientX - this.start.x, clientY: e.clientY - this.start.y };
    }

    drag(e){
        this.change = { clientX: e.clientX - this.start.x, clientY: e.clientY - this.start.y };
    }

    onMouseDown(e){
        const rect = this.element.getBoundingClientRect();
        const clone = this.element.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.zIndex = '999';
        clone.style.opacity = '0.5';

        this.start = { clientX: e.clientX, clientY: e.clientY };

        window.addEventListener('mousemove', this.drag.bind(this))
        window.addEventListener('mouseup', this.dragStop.bind(this));
    }

    initialize(){
        this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
    }
}

export default Draggable;
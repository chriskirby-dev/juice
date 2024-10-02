import Emitter from '../Event/Emitter.mjs';
import { cancel } from '../Event/Event.mjs';
import Draggable from './Draggable.mjs';
import Droppable from './Droppable.mjs';
import DragDropEvent from './DragDropEvent.mjs';




class DragDrop extends Emitter{

    #defined = {};
    firstEvent;
    lastEvent;
    position = { x: null, y: null }
    dragging = false;

    constructor( ){
        super();
        this.initialize();
    }

    addDroppable( element ){
        return new Droppable( element );
    }

    initialize(){

        window.addEventListener('drop', cancel, false );
        window.addEventListener('dragexit', cancel, false );
        window.addEventListener('dragover', cancel, false );
        window.addEventListener('dragenter', cancel, false );
        window.addEventListener('dragleave', cancel, false );
/*
        window.addEventListener('dragstart', (e) => {
            this.firstEvent = new DragDropEvent(e);
            this.dragging = e.target;
            this.emit('dragstart', e.target );
        }, false);

        window.addEventListener('drag', (e) => {
            this.lastEvent = new DragDropEvent(e);
            this.dragging = e.target;
            this.emit('drag', e.target );
        }, false);

        window.addEventListener('dragend', (e) => {
            this.lastEvent = new DragDropEvent(e);
            this.dragging = false;
            this.emit('dragstop', e.target );
        }, false);

        document.addEventListener('dragexit', (e) => {
            this.dragging = false;
            this.position = { x: null, y: null };v
        }, false);

/*
        document.addEventListener('dragover', (e) => {
            //this.dragging = e.target;
            cancel(e);
        }, false);

        document.addEventListener('dragenter', (e) => {
            //this.dragging = e.target;
        }, false);

        document.addEventListener('dragleave', (e) => {
            //this.dragging = e.target;
        }, false);

        document.addEventListener('drop', (e) => {
            cancel(e);
            //this.dragging = e.target;
        }, false);
       */
    }

}

export default new DragDrop;
/**
 * Drag and drop event wrapper with metadata extraction.
 * Provides convenient access to drag/drop event properties.
 * @module Control/DragDrop/DragDropEvent
 */

import { cancel } from '../Event/Event.mjs';

/**
 * Mouse button names for drag operations.
 * @private
 */
const BUTTONS = ['left', 'middle', 'right'];

/**
 * Drag and drop event wrapper.
 * @class DragDropEvent
 */
class DragDropEvent {
    
    event;

    constructor( event ){
        this.event = event;
       //app.log( this.eventType, this.dropTarget );
    }

    get eventType(){
        return this.event.type;
    }

    get dragged(){
        return this.event.currentTarget;
    }

    cancel(){
        cancel(this.event);
    }

    get dropTarget(){
        return this.event.target;
    }

    get items(){
        return this.data.items;
    }

    hasType( type ){
        return [...this.event.dataTransfer.types].includes(type);
    }

    get types(){
        return this.event.dataTransfer.types;
    }
   
    get x(){
        return this.event.clientX;
    }

    get y(){
        return this.event.clientY;
    }

    get pressed(){
        const e = this.event;
        return ['ctrl', 'shift', 'alt', 'meta'].filter( key => e[key+'Key'] === true );
    }

    get button(){
        return BUTTONS[this.event.button];
    }

    get data(){
        const e = this.event;
        return e.dataTransfer;
    }

    get files(){
        const e = this.event;
        return e.dataTransfer.files;
    }

}


export default DragDropEvent;
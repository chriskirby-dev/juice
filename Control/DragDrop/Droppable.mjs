import Emitter from '../Event/Emitter.mjs';
import { cancel } from '../Event/Event.mjs';
import DragDropEvent from './DragDropEvent.mjs';


class Droppable extends Emitter {

    wrapper;
    cover;
    #defined = {};

    constructor( wrapper ){
        super();
        this.wrapper = wrapper;
        this.initialize();
    }

    get isTarget(){
        return this.#defined.isDragTarget;
    }

    setMessage( message ){
        this.#defined.message = message;
        this.coverMessage.innerHTML = message;
    }

    setState(state){
        this.state = state;
    }

    dragEnter(event){
        app.log(event.eventType, event.x, event.y, event );
        this.state = 'active';
        this.#defined.isDragTarget = true;
        this.#defined.lastEvent = event;
        this.wrapper.classList.add('drag-over');

        this.emit('dragenter', event );
        return true;
    }

    dragLeave(event){
        app.log(event.eventType, event.x, event.y, event );
        this.state = 'idle';
        this.#defined.isDragTarget = false;
        this.#defined.lastEvent = event;
        this.wrapper.classList.remove('drag-over');
        this.emit('dragleave', event);
    }

    dragging(event){
        this.#defined.lastEvent = event;
        this.emit('drag', event );
    }

    drop( items ){
        const self = this;
        app.log('Dropped', items );
        this.wrapper.classList.remove('drag-over');
        function traverseItems( item, path=""){
            app.log('traverseItems',item, path);

            if (item.isFile) {
                item.file( (file) => {
                    file.path = path + file.name;
                    self.emit('file', file );
                    app.log("File:", path + file.name);
                    self.emit('dropfile', file );
                });
            } else if (item.isDirectory) {
                item.createReader().readEntries(function(entries) {
                    for (var i=0; i<entries.length; i++) {
                        traverseItems( entries[i], path + item.name + "/" );
                    }
                });
            }
        }

        for (let i = 0; i < items.length; i++) {
            if( items[i].webkitGetAsEntry){
                var item = items[i].webkitGetAsEntry();
                traverseItems(item);
            }else{
            this.emit('file', item);
            }
        }
    }

    canceled(){

    }

    initialize(){
        const self = this;

        function dragDropped(e){
            this.state = 'dropped';
            if ( e.dataTransfer.items.length > 0) {
                self.drop(e.dataTransfer.items);
            }
            dragLeave(e);
        }

        function dragLeave(e){
            const event = new DragDropEvent(e);
            if(event.dropTarget !== self.wrapper) return event.cancel();
            self.wrapper.removeEventListener('dragleave', dragLeave);
            self.wrapper.removeEventListener('dragover', dropDragging);
            self.wrapper.removeEventListener('drop', dragDropped);
            self.wrapper.addEventListener('dragenter', dragEnter, false);
            self.dragLeave(event);
        }

        function dropDragging(e){
            const event = new DragDropEvent(e);
            if(event.dropTarget !== self.wrapper) return cancel(e);
            self.dragging(event);
        }

        function dragEnter(e){
            const event = new DragDropEvent(e);
            //if(event.dropTarget !== self.wrapper) return cancel(e);
            self.wrapper.removeEventListener('dragenter', dragEnter);
            self.wrapper.addEventListener('dragleave', dragLeave, false);
            self.wrapper.addEventListener('dragover', dropDragging, false);
            self.wrapper.addEventListener('drop', dragDropped, false );
            self.dragEnter(event);
        }

        this.wrapper.addEventListener('dragenter', dragEnter, false);
       
        this.wrapper.classList.add('droppable');

        const dragCover = document.createElement('div');
        dragCover.className = 'drag-cover';
        const dragMessage = document.createElement('div');
        dragMessage.className = 'drop-message';
        dragMessage.innerHTML = 'Drop Now';
        this.coverMessage = dragMessage;
        dragCover.appendChild(dragMessage);
        
        this.wrapper.appendChild(dragCover);
        
        this.cover = dragCover;
    }

}

export default Droppable;
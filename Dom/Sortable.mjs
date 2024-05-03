import Draggable from './Draggable.mjs';

class Sortable {
    element;
    
    constructor(element){
        this.element = element;

    }

    initialize(){
        this.draggable = new Draggable(this.element);
    }
}

class SortableList {

    container;
    items;

    constructor(container){
        this.container = container;
    }

    addSortable(element){
        const sortable = new Sortable(element);
    }

    initialize(){
        for(let i=0;i<this.container.children.length;i++){
            this.addSortable(this.container.children[i]);
        }
    }
}
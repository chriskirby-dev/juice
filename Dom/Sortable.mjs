/**
 * Sortable module for enabling drag-and-drop sorting functionality on elements.
 * @module Sortable
 */

import Draggable from './Draggable.mjs';

/**
 * Represents a sortable element that can be dragged and reordered.
 * @class Sortable
 */
class Sortable {
    element;
    
    /**
     * Creates a new Sortable instance.
     * @param {HTMLElement} element - The element to make sortable
     */
    constructor(element){
        this.element = element;

    }

    /**
     * Initializes the sortable element by setting up draggable functionality.
     */
    initialize(){
        this.draggable = new Draggable(this.element);
    }
}

/**
 * Manages a list of sortable elements within a container.
 * @class SortableList
 */
class SortableList {

    container;
    items;

    /**
     * Creates a new SortableList instance.
     * @param {HTMLElement} container - The container element holding sortable items
     */
    constructor(container){
        this.container = container;
    }

    /**
     * Adds a sortable element to the list.
     * @param {HTMLElement} element - The element to add as sortable
     */
    addSortable(element){
        const sortable = new Sortable(element);
    }

    /**
     * Initializes all child elements as sortable items.
     */
    initialize(){
        for(let i=0;i<this.container.children.length;i++){
            this.addSortable(this.container.children[i]);
        }
    }
}
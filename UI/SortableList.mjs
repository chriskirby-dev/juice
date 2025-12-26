/**
 * Sortable list implementation with drag and drop support.
 * @module UI/SortableList
 */
import { deepClone } from "../Dom/Clone.mjs";

/**
 * Clone element for drag operations with position tracking.
 * @class SortableClone
 */
class SortableClone {

    box;

    constructor(element){

        this.element = element;
        this.clone = document.createElement('div'); 

        const box = element.getBoundingClientRect()

        this.box = { left: box.left, top: box.top, width: box.width, height: box.height  }

        this.initialize();
    }

    get left(){ return this.box.left }
    get top(){ return this.box.top }

    get center(){
        return { x: this.box.left + this.box.width/2, y: this.box.top + this.box.height/2 }
    }

    set left(val){ 
        this.box.left = val;
        this.clone.style.left = `${val}px`;
    };
    set top(val){ 
        this.box.top = val;
        this.clone.style.top = `${val}px`;
    };

    remove(){
        if(!this.placeholder || !this.placeholder.parentNode) return;
        this.placeholder.parentNode.insertBefore(this.element, this.placeholder);
        this.placeholder.parentNode.removeChild(this.placeholder);
        this.clone.parentNode.removeChild(this.clone);
    }

    initialize(){
        this.clone.style.position = 'absolute';
        this.clone.style.backgroundColor = '#FFF';
        this.clone.style.border = '1px solid #000';
        this.clone.style.top = `${this.box.top}px`;
        this.clone.style.left = `${this.box.left}px`;
        this.clone.style.width = `${this.box.width}px`;
        this.clone.style.height = `${this.box.height}px`;
        this.clone.style.opacity = 0.8;
        this.clone.style.zIndex = 999;
        document.body.appendChild(this.clone);

        this.placeholder = document.createElement('div');
        this.placeholder.style.width = `${this.box.width}px`;
        this.placeholder.style.height = `${this.box.height}px`;
        this.placeholder.style.backgroundImage = `linear-gradient(45deg, #adadad 23.81%, #c2c2c2 23.81%, #c2c2c2 47.62%, #fff 47.62%, #fff 50%, #adadad 50%, #adadad 73.81%, #c2c2c2 73.81%, #c2c2c2 97.62%, #fff 97.62%, #fff 100%)`;
        this.placeholder.style.backgroundSize = '29.70px 29.70px';
        this.element.parentNode.insertBefore(this.placeholder, this.element);
        this.clone.appendChild(this.element);
    }
}

export class SortableListItem {

    index = 0;
    list;
    lock;

    constructor(element){
        this.element = element;
        this.initialize();
    }

    onMouseDown(e){

        if(e.button !== 0 ) return;

        this.grabbed = true;
        this.dragging = false;
        this.element.removeEventListener('pointerdown', this.onMouseDown);
        window.addEventListener('pointerup', this.onMouseUp);
        window.addEventListener('pointermove', this.onDrag);

        const siblings = Array.prototype.slice.call(this.element.parentNode.children);
        this.siblings = siblings;   
        this.index = siblings.indexOf(this);

        this.boxes = siblings.map( sibling => sibling.getBoundingClientRect() );
        const lefts = this.boxes.map( box => box.left );

        const allEqual = arr => arr.every( v => v === arr[0] );
        if(allEqual(lefts)){
            this.lock = 'vertical';
        }else{
            this.lock = 'horizontal';
        }

        siblings.map( el => el.style.userSelect = 'none' )

        var rect = this.element.getBoundingClientRect();
        this.mouse = {
            offset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            down: { x: e.clientX, y: e.clientY }
        }

        

        

    }

    onMouseUp(){
        console.log('mouseup');
        if(!this.grabbed) return;
        this.grabbed = false;
        window.removeEventListener('pointerup', this.onMouseUp);
        window.removeEventListener('pointermove', this.onDrag);
        if(this.clone) this.clone.remove();

        const siblings = Array.prototype.slice.call(this.element.parentNode.children);
        this.siblings = siblings;   
        const startIndex = this.index;
        this.index = siblings.indexOf(this);
        if(startIndex > this.index ){
            let i = this.index;
            while(i < startIndex){
                siblings[i].dispatchEvent(new CustomEvent('sorted'));
            }
        }else if(startIndex < this.index){
            let i = startIndex;
            while(i < this.index){
                siblings[i].dispatchEvent(new CustomEvent('sorted'));
            }
        }
        this.element.dispatchEvent(new CustomEvent('sorted'));
        this.element.addEventListener('pointerdown', this.onMouseDown);    

    }

    onDrag(e){
        if(!this.grabbed) return false;
        if(!this.dragging){
            this.clone = new SortableClone(this.element); 
            const siblings = Array.prototype.slice.call(this.clone.placeholder.parentNode.children);
            this.siblings = siblings; 
            this.dragging = true;
        }
        this.mouse.current = { x: e.clientX, y: e.clientY };
        this.mouse.movement = { x: this.mouse.current.x - this.mouse.down.x, y: this.mouse.current.y - this.mouse.down.y };
      //  console.log(this.mouse);
        const top = this.mouse.down.y - this.mouse.offset.y + this.mouse.movement.y;
        const left = this.mouse.down.x - this.mouse.offset.x + this.mouse.movement.x;
        if(this.lock === 'vertical'){
            this.clone.top = top;
        }else if(this.lock === 'horizontal'){
            this.clone.left = left;
        }else{
            this.clone.top = top;
            this.clone.left = left;
        }


        const [over] = this.siblings.filter( el => {
            const rect = el.getBoundingClientRect();
            return rect.top < this.clone.center.y && rect.top + rect.height > this.clone.center.y && rect.left < this.clone.center.x && rect.left + rect.width > this.clone.center.x
        });

       // console.log(over);
        if(over && over !== this.placeholder){
            over.parentNode.insertBefore(this.clone.placeholder, over);
        }

        
    }

    initialize(){
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.element.addEventListener('pointerdown', this.onMouseDown);    
    }


}

export class SortableList {

    wrapper;
    sortableTag='li';
    items = [];

    constructor(listWrapper) {
        this.wrapper = listWrapper;
        this.items = Array.prototype.slice.call(this.wrapper.querySelectorAll(this.sortableTag));
    }

    insert( item, index ){
        this.items.splice(index, 0, item );
        this.wrapper.insertBefore(item, this.items[index-1]);
    }

    shift( index, newIndex ){
        if (newIndex >= this.items.length) {
            var k = newIndex - this.items.length + 1;
            while (k--) {
                this.items.push(undefined);
            }
        }
        this.items.splice(newIndex, 0, this.items.splice(index, 1)[0] );
        this.wrapper.insertBefore(this.items[newIndex], this.items[index-1]);
    }

    initialize(){
        if(this.wrapper.children.length){

        }
    }
}
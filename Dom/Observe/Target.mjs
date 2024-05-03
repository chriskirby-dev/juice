import PositionObserver from "./Position.mjs";
import ResizeObserver  from "./Resize.mjs";


class ObserverTarget {

    target;
    options;
    callbacks = {};
    observers = [];

    constructor( target, options={} ){
        this.target = target;
        this.options = options;
    }

    observe(...types){
        types.forEach( ( type ) => {

        });
    }

    destroy(){
        this.observers.forEach( ( observer ) => observer.destroy() );
        if(this.dcallback) this.dcallback();
    }

    removed( callback ){
        this.dcallback = callback;
        return this;
    }

    position( callback, options={} ){
        const positionObserver = PositionObserver.observe( this.target, options ).change( ( position ) => {
            if(callback) callback(position);
            if(this.callbacks.change){
                this.callbacks.change(position);
            }
        });
        this.observers.push(positionObserver);
        
        return this;
    }

    size( callback, options={} ){
        ResizeObserver.observe( this.target, options={} ).change( ({ width, height }) => {
            if(callback) callback({ width, height });
            if(this.callbacks.change){
                this.callbacks.change({
                    width, height
                });
            }
        });
        return this;
    }

    change( callback ){
        this.callbacks.change = callback;
    }

}

export default ObserverTarget;
import Emitter from '../Event/Emitter.mjs';

class Stream extends Emitter {

    #cache = [];
    chunkSize = 1;
    #head = 0;
    complete;
    hooks = [];

    constructor( data=[], chunkSize=1 ){
        this.#cache = data;
        this.chunkSize = chunkSize;
    }

    get length(){
        return this.#cache.length;
    }

    injest( data=[] ){
        this.#cache = this.#cache.concat( data );
        if(this.writable){
            this.read();
        }
    }

    read(){
        if(this.length == 0){
            this.writable = true;
            this.emit('empty'); 
            return false;
        }
        const chunk = this.#cache.slice( this.#cache, Math.min( this.chunkSize, this.length ) );
        this.head += chunk.length;
        this.emit('data', chunk || null );
        //Process Pipes
        if(this.hooks.length){
            this.hooks.reduce(( value, stream ) => {
                stream.injest(value);
                return value;
            }, chunk );
        }
        this.writable = false;
        return chunk.length;
    }

    pipe( stream ){
        this.hooks.push(stream);
    }

    end(){
        this.complete = true;
    }
}

export default Stream;
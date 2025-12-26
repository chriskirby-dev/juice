/**
 * Stream provides a data streaming interface with event-based processing.
 * Extends EventEmitter to provide readable/writable streaming capabilities.
 * @module Stream/Stream
 */

import Emitter from '../Event/Emitter.mjs';

/**
 * Stream class for handling data streams with chunking and piping.
 * @class Stream
 * @extends Emitter
 * @example
 * const stream = new Stream([], 10); // chunk size of 10
 * stream.on('data', (chunk) => console.log(chunk));
 * stream.injest([1, 2, 3, 4, 5]);
 */
class Stream extends Emitter {

    /**
     * Internal cache for stream data.
     * @type {Array}
     * @private
     */
    #cache = [];
    
    /**
     * Size of chunks to read at a time.
     * @type {number}
     */
    chunkSize = 1;
    
    /**
     * Current read position in the stream.
     * @type {number}
     * @private
     */
    #head = 0;
    
    /**
     * Whether the stream has completed.
     * @type {boolean}
     */
    complete;
    
    /**
     * Array of piped streams.
     * @type {Array<Stream>}
     */
    hooks = [];

    /**
     * Creates a new Stream.
     * @param {Array} [data=[]] - Initial data for the stream
     * @param {number} [chunkSize=1] - Size of chunks to read
     */
    constructor( data=[], chunkSize=1 ){
        this.#cache = data;
        this.chunkSize = chunkSize;
    }

    /**
     * Gets the current length of cached data.
     * @returns {number} The length of cached data
     */
    get length(){
        return this.#cache.length;
    }

    /**
     * Ingests new data into the stream.
     * @param {Array} [data=[]] - Data to add to the stream
     */
    injest( data=[] ){
        this.#cache = this.#cache.concat( data );
        if(this.writable){
            this.read();
        }
    }

    /**
     * Reads a chunk of data from the stream and emits it.
     * @returns {number|boolean} Number of items read, or false if empty
     * @fires Stream#data
     * @fires Stream#empty
     */
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

    /**
     * Pipes this stream to another stream.
     * @param {Stream} stream - The target stream
     */
    pipe( stream ){
        this.hooks.push(stream);
    }

    end(){
        this.complete = true;
    }
}

export default Stream;
/**
 * Event emitter module providing pub/sub event functionality.
 * @module Emitter
 */

import Util from '../Util/Core.mjs';

/**
 * EmitterEvent class extends Array to store event listeners with options.
 * Represents a single named event with its associated listeners.
 * @class EmitterEvent
 * @extends Array
 */
class EmitterEvent extends Array {

    /**
     * Creates a new EmitterEvent for a specific event name.
     * @param {string} name - The event name
     * @param {EventEmitter} emitter - The parent emitter instance
     */
    constructor( name, emitter ){
        super();
        this.name = name;
        Object.defineProperty( this, 'emitter', {
            get: () => emitter,
            set: () => false
        });
    }


    /**
     * Adds a listener function to this event.
     * @param {Function} fn - The listener function to add
     * @param {Object} [options={}] - Options for the listener (e.g., {once: true})
     */
    add( fn, options={} ){
        this.push({ fn: fn, options: options });
    }
    
    /**
     * Removes a listener function from this event.
     * @param {Function|string} fn - The listener function or function name to remove
     * @returns {boolean} True if the listener was removed, false otherwise
     */
    remove( fn ){
        for( var i=0;i<this.length;i++ ){
            if(typeof fn == 'string'){
                if( this[i].fn.name === fn ){
                    this.splice( i, 1 );
                    return true;
                }
            }else{
                if( this[i].fn === fn ){
                    this.splice( i, 1 );
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Emits the event, calling all listener functions with the provided arguments.
     * Listeners marked with {once: true} are automatically removed after execution.
     * @param {...*} args - Arguments to pass to listener functions
     * @returns {*} The return value of the last listener function called
     */
    emit( ...args ){
        let resp;
        for( var i=0;i<this.length;i++ ){
            resp = this[i].fn.apply( this.emitter, args );
            if(this[i].options.once){
                this.splice( i, 1 );
                i--;
            }
        }
        return resp;
    }
}

/**
 * EventListeners class manages all event listeners for an emitter.
 * Maintains a collection of EmitterEvent instances indexed by event name.
 * @class EventListeners
 */
class EventListeners {

    instances = {};

    /**
     * Creates a new EventListeners manager for an emitter.
     * @param {EventEmitter} emitter - The parent emitter instance
     */
    constructor( emitter ){
        Object.defineProperty( this, 'emitter', {
            get: () => emitter,
            set: () => false
        });
    }

    /**
     * Checks if an event has any listeners.
     * @param {string} event - The event name to check
     * @returns {boolean} True if the event has listeners
     */
    has( event ){
        return this.instances[event] ? true : false;
    }

    /**
     * Gets the EmitterEvent instance for a specific event.
     * @param {string} event - The event name
     * @returns {EmitterEvent|undefined} The EmitterEvent instance or undefined
     */
    get( event ){
        return this.instances[event];
    }

    /**
     * Adds a listener function to an event.
     * Creates the EmitterEvent instance if it doesn't exist.
     * @param {string} event - The event name
     * @param {Function} fn - The listener function
     * @param {Object} [options={}] - Options for the listener
     */
    add( event, fn, options={} ){

        if( !this.has( event ) )
            this.instances[event] = new EmitterEvent( event, this.emitter );

        this.instances[event].add( fn, options );

    }
    
    /**
     * Removes a listener function from an event, or removes all listeners if fn is not provided.
     * @param {string} event - The event name
     * @param {Function} [fn] - The listener function to remove (removes all if not provided)
     * @returns {boolean} True if successful
     */
    remove( event, fn ){
        if(!this.instances[event]) return false;
        if( !fn ) delete this.instances[event];
        else this.instances[event].remove( fn );
        return true;
    }

    /**
     * Removes all event listeners from all events.
     */
    removeAll(){
        this.instances = {};
    }

    /**
     * Gets an array of all event names that have listeners.
     * @returns {Array<string>} Array of event names
     */
    get events(){
        return Object.keys( this.instances );
    }
}

/**
 * EventEmitter class provides pub/sub event functionality.
 * Allows objects to emit events and register listeners for those events.
 * @class EventEmitter
 * @example
 * const emitter = new EventEmitter();
 * emitter.on('data', (data) => console.log(data));
 * emitter.emit('data', {value: 42});
 */
class EventEmitter {

    event = {
       
    };

    /**
     * Creates a new EventEmitter instance.
     * @param {Object} [target] - Optional target object to bind emitter methods to
     */
    constructor( target ){

        const self = this;
        this.event.unfulfilled = {};
        Util.Object.unEnumerize( this, ['event'] );

        this.event.listeners = new EventListeners( this );

        if(target){
            target.event = this.event;
            target.on = this.on;
            target.once = this.once;
            target.emit = this.emit;
        }

    }

    /**
     * Binds emitter functionality to an existing instance.
     * @param {Object} inst - The instance to bind emitter methods to
     * @static
     */
    static bind( inst ){
        const emitter = new EventEmitter();

        inst.event = emitter.event;
        inst.on = emitter.on;
        inst.once = emitter.once;
        inst.emit = emitter.emit;
    }

    /**
     * Registers an event listener.
     * @param {string} event - The event name to listen for
     * @param {Function} fn - The listener function
     * @param {Object} [options] - Options for the listener
     * @returns {EventEmitter} This emitter instance for chaining
     */
    on( event, fn, options ){
        this.event.listeners.add( event, fn, options );
        this.emit('listener', event, fn, this.event.listeners.get(event).length );
        if(this.event.unfulfilled[event]){
            this.emitNext( event, ...this.event.unfulfilled[event] );
            delete this.event.unfulfilled[event];
        }
        return this;
    }

    /**
     * Registers a one-time event listener that will be removed after first execution.
     * @param {string} event - The event name to listen for
     * @param {Function} fn - The listener function
     * @returns {EventEmitter} This emitter instance for chaining
     */
    once( event, fn ){
        this.event.listeners.add( event, fn, { once: true } );
        this.emit('listener', event, fn, this.event.listeners.get(event).length );
        if(this.event.unfulfilled[event]){
            this.emitNext( event, ...this.event.unfulfilled[event] );
            delete this.event.unfulfilled[event];
        }
        return this;
    }

    /**
     * Emits an event, calling all registered listeners with the provided arguments.
     * If no listeners exist, stores the event data for when listeners are added.
     * @param {string} event - The event name to emit
     * @param {...*} args - Arguments to pass to listener functions
     * @returns {EventEmitter} This emitter instance for chaining
     */
    emit( event, ...args ){
        let resp;
        if( this.event.listeners.has( event ) ){
          //  console.log( this.event.listeners.get( event ));
            resp = this.event.listeners.get( event ).emit( ...args );
        }else{
            this.event.unfulfilled[event] = args;
        }

        return this;

    }

    /**
     * Emits an event on the next tick (after current execution stack).
     * @param {string} event - The event name to emit
     * @param {...*} args - Arguments to pass to listener functions
     * @returns {*} Result of emitDelay
     */
    emitNext( event, ...args ){
        return this.emitDelay( event, 0, ...args );
    }

    /**
     * Emits an event after a specified delay.
     * @param {string} event - The event name to emit
     * @param {number} [delay=0] - Delay in milliseconds
     * @param {...*} args - Arguments to pass to listener functions
     */
    emitDelay(event, delay=0, ...args){
        setTimeout(() => this.emit( event, ...args ), delay );
    }

    /**
     * Removes a specific listener or all listeners for an event.
     * @param {string} event - The event name
     * @param {Function} [fn] - The listener function to remove (removes all if not provided)
     * @returns {EventEmitter} This emitter instance for chaining
     */
    removeListener( event, fn ){
        this.event.listeners.remove( event, fn );
        this.emit('removeListener', event, fn );
        return this;
    }

    /**
     * Removes all listeners from all events.
     */
    removeAllListeners( ){
        this.event.listeners.removeAll();
    }

    /**
     * Transfers event listeners to another emitter.
     * @param {EventEmitter} emitter - The target emitter to receive the event listeners
     */
    transferEvents( emitter ){
        emitter.event = this.event;
    }

    /**
     * Checks if an event has any listeners.
     * @param {string} event - The event name to check
     * @returns {boolean} True if the event has listeners
     */
    hasListener( event ){
        return this.event.listeners.has( event );
    }

    /**
     * Gets all event names that start with a specific prefix.
     * @param {string} prefix - The prefix to match
     * @returns {Array<string>} Array of matching event names
     */
    listenersOf( prefix ){
        const events = this.event.listeners.events;
        const result = [];
        for(let i=0;i<events.length;i++){
            if( events[i].startsWith( prefix ) )
                result.push( events[i] );
        }
        return result;
    
    }

}

/**
 * EmitterGroup class allows multiple emitters to be managed as a single unit.
 * Events can be registered and emitted to all emitters in the group simultaneously.
 * @class EmitterGroup
 * @example
 * const group = new EmitterGroup(emitter1, emitter2);
 * group.on('update', handleUpdate); // Registers listener on both emitters
 * group.emit('update', data); // Emits to both emitters
 */
class EmitterGroup {

    emitters;

    /**
     * Creates a new EmitterGroup with the provided emitters.
     * @param {...EventEmitter} emitters - One or more emitter instances to manage
     */
    constructor( ...emitters ){
        this.emitters = emitters;
    }

    /**
     * Registers an event listener on all emitters in the group.
     * @param {string} event - The event name to listen for
     * @param {Function} fn - The listener function
     * @param {Object} [options={}] - Options for the listener
     * @returns {EmitterGroup} This group instance for chaining
     */
    on( event, fn, options={} ){
       
        for(let i=0;i<this.emitters.length;i++){
            this.emitters[i].on( event, fn, options )
        }
        return this;
    }

    /**
     * Registers a one-time event listener on all emitters in the group.
     * @param {string} event - The event name to listen for
     * @param {Function} fn - The listener function
     * @param {Object} [options={}] - Options for the listener
     * @returns {EmitterGroup} This group instance for chaining
     */
    once( event, fn, options={} ){
        options.once = true;
        for(let i=0;i<this.emitters.length;i++){
            this.emitters[i].on( event, fn, options )
        }
        return this;
    }

    /**
     * Emits an event on all emitters in the group.
     * @param {string} event - The event name to emit
     * @param {...*} args - Arguments to pass to listener functions
     * @returns {EmitterGroup} This group instance for chaining
     */
    emit( event, ...args ){
        for(let i=0;i<this.emitters.length;i++){
            this.emitters[i].emit( event, ...args )
        }
        return this;
    }

    /**
     * Emits an event on the next tick on all emitters in the group.
     * @param {string} event - The event name to emit
     * @param {...*} args - Arguments to pass to listener functions
     */
    emitTick(event, ...args){
        setTimeout(() => this.emit( event, ...args ), 0 );
    }
    
    /**
     * Emits an event after a delay on all emitters in the group.
     * @param {string} event - The event name to emit
     * @param {number} [delay=0] - Delay in milliseconds
     * @param {...*} args - Arguments to pass to listener functions
     */
    emitDelay(event, delay=0, ...args){
        setTimeout(() => this.emit( event, ...args ), delay );
    }

}

export { EventEmitter as default, EmitterGroup }
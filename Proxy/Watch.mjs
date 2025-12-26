/**
 * Watch provides reactive proxy utilities for deep object observation.
 * Enables watching nested objects and arrays for changes with event emission.
 * @module Proxy/Watch
 */

import { default as Util, type, empty} from '../Util/Core.mjs';
import EventEmitter from '../Event/Emitter.mjs';
import { unproxy } from './Helper.mjs';
import { deepWatch as deepWatchHandler } from './Handler.mjs';

/**
 * DeepEmitter combines deep proxy watching with event emission.
 * Automatically emits events when any nested property changes.
 * @class DeepEmitter
 * @extends EventEmitter
 * @private
 */
class DeepEmitter extends EventEmitter {

    /**
     * Creates a new DeepEmitter instance.
     * Returns a Proxy that deeply watches for property changes.
     * @param {Object} [options={}] - Configuration options
     * @param {Array<string>} [options.ignore] - Properties to ignore (default: ['event', 'on', 'emit'])
     */
    constructor( options={} ){
        super();
        const self = this;
        options.ignore = ['event', 'on', 'emit'];
        return new Proxy( this, deepWatchHandler( (path, value) => {
            if(value._isProxy) value = value[Symbol.for('UNPROXY')];
            if(self.hasListener(path)) self.emit(path, value);
            self.emit('change', path, value);
            self.onChange(path, value);
        }, [], options ));
    }

    /**
     * Called when a property changes at any depth.
     * Emits events to all listeners of the property path.
     * @param {string} path - The property path that changed
     * @param {*} value - The new value
     */
    onChange(path, value){
        debug('onChange', path, value);
        const listeners = this.listenersOf( path );
        if( !empty( listeners ) ){
            listeners.forEach( listener => {
                this.emit(listener, path, value);
            });
        }
    }

    /**
     * Checks if a property exists.
     * @param {string} property - The property name
     * @returns {boolean} True if property exists
     */
    has(property){
        return this[property] !== undefined;
    }
}

/**
 * Watch provides static methods for creating reactive proxies.
 * @class Watch
 * @example
 * const watched = Watch.deep(obj, (path, value) => console.log(path, value));
 * watched.nested.prop = 'new value'; // triggers callback
 */
class Watch {

    /**
     * Creates a deeply watched proxy of an object.
     * Changes to any nested property will trigger the callback.
     * @param {Object|Array} obj - The object or array to watch
     * @param {Function} callback - Callback function (path, value) => {}
     * @param {Object} [options={}] - Watch options
     * @returns {Proxy} A proxy that watches the object deeply
     * @static
     */
    static deep( obj, callback, options={} ){
        return new Proxy( obj, deepWatchHandler( callback, [], options ) );
    }

    /**
     * Creates a DeepEmitter instance for event-driven reactive objects.
     * @param {Object} [options={}] - Configuration options
     * @returns {DeepEmitter} A deeply reactive event emitter
     * @static
     */
    static deepEmitter(options={}){
        return new DeepEmitter(options);
    }
}

export default Watch;
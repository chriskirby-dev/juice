/**
 * ProxyEmitter combines Proxy functionality with EventEmitter to provide reactive objects.
 * Automatically emits events when object properties change.
 * @module Proxy/ProxyEmitter
 */

import EventEmitter from '../Event/Emitter.mjs';
import { type, empty } from '../Util/Core.mjs';

/**
 * ProxyEmitter extends EventEmitter to create reactive proxy objects.
 * Property changes automatically trigger events that can be listened to.
 * @class ProxyEmitter
 * @extends EventEmitter
 * @example
 * const emitter = new ProxyEmitter();
 * emitter.on('propertyChange', (path, value) => console.log(path, value));
 * emitter.myProp = 'value'; // triggers event
 */
class ProxyEmitter extends EventEmitter {

    /**
     * Creates a new ProxyEmitter instance.
     * Returns a Proxy that intercepts property changes and emits events.
     * @param {Object} handeler - Handler configuration
     * @param {Object} [options={}] - Options for the proxy emitter
     * @param {Array<string>} [options.ignore] - Property names to ignore (default: ['event', 'on', 'emit'])
     */
    constructor( handeler, options={} ){
        super();
        const self = this;
        options.ignore = ['event', 'on', 'emit'];
        return new Proxy( this, {
            get: ( target, property, receiver ) => {
                return Reflect.get(target, property, receiver);
            },
            set: ( target, property, value, receiver ) => {
                self.onChange( property, value );
                return Reflect.set(target, property, receiver);
            }
        });
    }

    /**
     * Called when a property changes.
     * Emits events to registered listeners for the property path.
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
     * Checks if a property exists on this object.
     * @param {string} property - The property name to check
     * @returns {boolean} True if the property exists
     */
    has(property){
        return this[property] !== undefined;
    }
}
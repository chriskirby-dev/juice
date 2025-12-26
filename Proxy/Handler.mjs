/**
 * Deep watch handler for creating deeply nested reactive proxies.
 * Provides proxy handlers that recursively watch nested objects and arrays for changes.
 * @module Proxy/Handler
 */

import { type, empty } from '../Util/Core.mjs';
import { unproxy } from './Helper.mjs';

/**
 * Creates a deep watch handler for proxy objects.
 * Recursively wraps nested objects/arrays in proxies to track all changes in the object tree.
 * @param {Function} callback - Callback function called when properties change (path, value) => {}
 * @param {Array<string>} [paths=[]] - Current property path array
 * @param {Object} [options={}] - Handler options
 * @param {Array<string>} [options.ignore=[]] - Property names to ignore
 * @param {Object} [options.invoke={}] - Custom invoke handlers for properties
 * @returns {Object} Proxy handler object with get, set, and deleteProperty traps
 * @example
 * const handler = deepWatch((path, value) => console.log(path, value), [], {});
 * const proxy = new Proxy(obj, handler);
 */
export function deepWatch( callback, paths=[], options={} ){

    const { ignore=[], invoke={} } = options;

    /**
     * Gets the full property path as a dot-separated string.
     * @param {string} property - The property name to append
     * @returns {string} The full property path
     * @private
     */
    function getPropertyPath(property){
        const path = paths.slice(0);
        path.push(property);
        return path.join('.');
    }

    return {
        get( target, property, receiver ) {
            //Report back is proxy
            if( property === '_isProxy' ) return true;
            //If ignore property ignore...
            if( ignore.includes(property) ) return Reflect.get(target, property, receiver);
            //Requested UNPROXIED return base variable
            if( property === Symbol.for('UNPROXY') ) return unproxy(target);
            //Get type of property
            const propertyType = type(target[property]);
            
            //if prop is existing object or array but not a proxy
            if ( ['object', 'array'].includes(propertyType) && !target[property]._isProxy ){
                //if prop is existing object but not a proxy
                if(propertyType == 'object')
                target[property] = new Proxy( target[property], deepWatch( callback, paths ));
                else if(propertyType == 'array')
                target[property] = new Proxy( target[property], deepWatch( callback, paths ));
            }
            //Get property from target
            return Reflect.get(target, property, receiver);
        },
        set( target, property, value, receiver ){
            //Values Match Already
            //if property is ignored set as normal
            if(ignore.includes(property)) return Reflect.set(target, property, value);
            if(typeof target[property] === undefined ) exists = false;
            //If value is already report back true and stop request
            if (target[property] === value) return true;
            //Get type of property
            const propertyType = type(value);

            const path = getPropertyPath(property);
            if ( ['object', 'array'].includes(propertyType) ){
                console.log('CREATING PROXY', path, property, value, receiver );
                if(propertyType == 'object')
                value = new Proxy( value, deepWatch( callback, [path] ));
                else if(propertyType == 'array')
                value = new Proxy( value, deepWatch( callback, [path] ));
            }
            console.log('SET', paths, property, value, receiver );
            //Apply changes to target
            const set = Reflect.set(target, property, value);
            if(invoke.change) invoke.change(property, value);
            if(invoke[property]) invoke[property](value);
            callback( path, value );

			return set;
        },
        deleteProperty( target, property) {
			delete target[property];
			//render(instance);
            if(invoke.delete) invoke.delete(property);
			return Reflect.deleteProperty(target, property);
		}
    }
}


import { type, empty } from '../Util/Core.mjs';
import { unproxy } from './Helper.mjs';

export function deepWatch( callback, paths=[], options={} ){

    const { ignore=[], invoke={} } = options;

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


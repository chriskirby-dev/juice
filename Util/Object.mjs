import ArrayUtil from './Array.mjs';

export function diff(a, b) {
    const diff = {};
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])]; // Merge and remove duplicates

    for (let prop of keys) {
        if (a[prop] !== b[prop]) {
            diff[prop] = b[prop];
        }
    }

    return Object.keys(diff).length === 0 ? null : diff;
}

export function setEnumerability(target, props = [], enumerable = true, enumRest = false) {
    const descriptors = Object.getOwnPropertyDescriptors(target);

    if (enumRest) {
        for (const [property, descriptor] of Object.entries(descriptors)) {
            const isEnumerable = !(!props.length || props.includes(property));
            descriptor.enumerable = isEnumerable;
            Object.defineProperty(target, property, descriptor);
        }
    } else {
        props.forEach(property => {
            if (descriptors[property]) {
                descriptors[property].enumerable = enumerable;
            }
        });
        Object.defineProperties(target, descriptors);
    }
}


class ObjectUtil {

    static arrPluck( arr, path ){
        return arr.map( item => ObjectUtil.pluck( item, path ) );
    }

    static pluck( obj, path ){
        let scope = obj;
        const paths = path.split('.');
        while( paths.length ){
            scope = scope[paths.shift()];
            if( scope === undefined ) return null;
        }
        return scope;
    }

    static merge(...objects) {
        // Base case: if there's only one object, return it
        if (objects.length === 1) {
            return objects[0];
        }
    
        // Merge two objects
        function mergeTwoObjects(obj1, obj2) {
            for (let key in obj2) {
                if (obj2.hasOwnProperty(key)) {
                    // If both properties are objects, merge them recursively
                    if (obj1[key] !== undefined && typeof obj1[key] === 'object' && typeof obj2[key] === 'object' && !Array.isArray(obj1[key]) && !Array.isArray(obj2[key])) {
                        obj1[key] = mergeTwoObjects(obj1[key], obj2[key]);
                    } else {
                        // Otherwise, overwrite obj1's property with obj2's property
                        obj1[key] = obj2[key];
                    }
                }
            }
            return obj1;
        }
    
        // Start with the first two objects and merge them
        let mergedObject = mergeTwoObjects(objects[0], objects[1]);
    
        // Merge the rest of the objects recursively
        for (let i = 2; i < objects.length; i++) {
            mergedObject = mergeTwoObjects(mergedObject, objects[i]);
        }
    
        return mergedObject;
    }


    static diff = diff;

 
    static enumerize( target, props=[], unenumRest=false ){
        const prototype = Object.getPrototypeOf(target);
        if(unenumRest){
            const prototype_property_descriptors = Object.getOwnPropertyDescriptors(target);
            for(const [property, descriptor] of Object.entries(prototype_property_descriptors)) {
                const is_enumerable = ( !props.length || props.includes(property) );
                descriptor.enumerable = is_enumerable;
                Object.defineProperty(target, property, descriptor);
            }
        }else{
            for(let i=0;i<props.length;i++){
                const property = props[i];
                const descriptor = Object.getOwnPropertyDescriptor(target, property);
                descriptor.enumerable = true;
                Object.defineProperty(target, property, descriptor);
            }
        }
    }
    static unEnumerize( target, props=[], enumRest=false ){

        const prototype = Object.getPrototypeOf(target);
        if(enumRest) {
            const prototype_property_descriptors = Object.getOwnPropertyDescriptors(target);
            for(const [property, descriptor] of Object.entries(prototype_property_descriptors)) {
                const is_enumerable = !( !props.length || props.includes(property) );
                descriptor.enumerable = is_enumerable;
                Object.defineProperty(target, property, descriptor);
            }
        }else{
            for(let i=0;i<props.length;i++){
                const property = props[i];
                const descriptor = Object.getOwnPropertyDescriptor(target, property);
                descriptor.enumerable = false;
                Object.defineProperty(target, property, descriptor)
            }
        }
    }

}

export default ObjectUtil;

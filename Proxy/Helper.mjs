import { default as Util, type, empty } from '../Util/Core.mjs';

export function unproxy( proxy ){
    const unproxied = type(proxy, 'array') ? [] : {};
    if(proxy._isProxy) return proxy[Symbol.for('UNPROXY')];
    for( let prop in proxy ){
        unproxied[prop] = (  type(proxy[prop], 'object') && proxy[prop]._isProxy ) ? unproxy(proxy[prop]) : proxy[prop];
    }
    return unproxied;
}
 

export default { unproxy };
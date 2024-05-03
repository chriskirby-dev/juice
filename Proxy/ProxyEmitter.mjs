import EventEmitter from '../Event/Emitter.mjs';
import { type, empty } from '../Util/Core.mjs';


class ProxyEmitter extends EventEmitter {


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

    onChange(path, value){
        debug('onChange', path, value);
        const listeners = this.listenersOf( path );
        if( !empty( listeners ) ){
            listeners.forEach( listener => {
                this.emit(listener, path, value);
            });
        }
    }

    has(property){
        return this[property] !== undefined;
    }
}
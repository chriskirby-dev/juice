import { default as Util, type, empty} from '../Util/Core.mjs';
import EventEmitter from '../Event/Emitter.mjs';
import { unproxy } from './Helper.mjs';
import { deepWatch as deepWatchHandler } from './Handler.mjs';


class DeepEmitter extends EventEmitter {


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
class Watch {

    static deep( obj, callback, options={} ){
        return new Proxy( obj, deepWatchHandler( callback, [], options ) );
    }

    static deepEmitter(options={}){
        return new DeepEmitter(options);
    }
}

export default Watch;
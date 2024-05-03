import Util from '../Util/Core.mjs';

class EmitterEvent extends Array {

    /**
     * @param  {String} name
     * @param  {Emitter Object} emitter
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
     * @param  {Function} fn
     * @param  {Object} options={}
     */

    add( fn, options={} ){
        this.push({ fn: fn, options: options });
    }
    /**
     * @param  {Function} fn
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
     * @param  {Mixed} ...args
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

class EventListeners {

    instances = {};

    /**
     * @param  {Emitter Object} emitter
     */

    constructor( emitter ){
        Object.defineProperty( this, 'emitter', {
            get: () => emitter,
            set: () => false
        });
    }

    /**
     * @param  {String} event
     */

    has( event ){
        return this.instances[event] ? true : false;
    }

    /**
     * @param  {String} event
     */

    get( event ){
        return this.instances[event];
    }

    /**
     * @param  {String} event
     * @param  {Function} fn
     * @param  {Object} options={}
     */

    add( event, fn, options={} ){

        if( !this.has( event ) )
            this.instances[event] = new EmitterEvent( event, this.emitter );

        this.instances[event].add( fn, options );

    }
    /**
     * @param  {String} event
     * @param  {Function} fn
     * @return { Boolean }
     */

    remove( event, fn ){
        if(!this.instances[event]) return false;
        if( !fn ) delete this.instances[event];
        else this.instances[event].remove( fn );
        return true;
    }

    removeAll(){
        this.instances = {};
    }

    get events(){
        return Object.keys( this.instances );
    }
}

class EventEmitter {

    event = {
       
    };

    

    /**
     * @param {...string} ...accessableEvents
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
     * @param  { Emitter Object } inst
     */

    static bind( inst ){
        const emitter = new EventEmitter();

        inst.event = emitter.event;
        inst.on = emitter.on;
        inst.once = emitter.once;
        inst.emit = emitter.emit;
    }

    /**
     * @param  {String} event
     * @param  {Function} fn
     * @param  {Object} options
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
     * @param  {String} event
     * @param  {Function} fn
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
     * @param  {String} event
     * @param  {Mixed Multi} ...args
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

    emitNext( event, ...args ){
        return this.emitDelay( event, 0, ...args );
    }

    emitDelay(event, delay=0, ...args){
        setTimeout(() => this.emit( event, ...args ), delay );
    }

    removeListener( event, fn ){
        this.event.listeners.remove( event, fn );
        this.emit('removeListener', event, fn );
        return this;
    }

    removeAllListeners( ){
        this.event.listeners.removeAll();
    }

    transferEvents( emitter ){
        emitter.event = this.event;
    }

    hasListener( event ){
        return this.event.listeners.has( event );
    }

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

class EmitterGroup {

    emitters;

    constructor( ...emitters ){
        this.emitters = emitters;
    }

    on( event, fn, options={} ){
       
        for(let i=0;i<this.emitters.length;i++){
            this.emitters[i].on( event, fn, options )
        }
        return this;
    }

    once( event, fn, options={} ){
        options.once = true;
        for(let i=0;i<this.emitters.length;i++){
            this.emitters[i].on( event, fn, options )
        }
        return this;
    }

    emit( event, ...args ){
        for(let i=0;i<this.emitters.length;i++){
            this.emitters[i].emit( event, ...args )
        }
        return this;
    }

    emitTick(event, ...args){
        setTimeout(() => this.emit( event, ...args ), 0 );
    }
    
    emitDelay(event, delay=0, ...args){
        setTimeout(() => this.emit( event, ...args ), delay );
    }

}

export { EventEmitter as default, EmitterGroup }

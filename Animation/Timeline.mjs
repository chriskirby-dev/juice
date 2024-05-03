import AniUtil from './Util.mjs';
import AnimationTime from './Time.mjs';
import AnimationDebug from './Debug.mjs';

window.requestAnimationFrame = window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(f){return setTimeout(f, 1000/60)} // simulate calling code 60 
 
window.cancelAnimationFrame = window.cancelAnimationFrame
    || window.mozCancelAnimationFrame
    || function(requestID){clearTimeout(requestID)} //fall back

class Ticker {

    active = false;
    timelines = [];
    ms = 0;

    time = new AnimationTime();

    constructor( ...timelines ){
        this.timelines = timelines;
    }

    start(){
        const self = this;
        self.active = true;

        function tick( ms ){
            self.ms = ms;
            //app.log('Ticker tick', ms, self.timelines );
            for(let i=0;i<self.timelines.length;i++){
                if( self.timelines[i].fps ){
                    
                } 
                self.timelines[i].tick( ms );
                if( !self.timelines[i].active ){
                    self.timelines.splice(i, 1); 
                    i--; 
                }
            }

            if( self.timelines.length == 0 ) self.stop( tick );

            if( self.active )
            window.requestAnimationFrame( tick ); 
            return false;
        }

        window.requestAnimationFrame( tick );

    }

    stop( fn ){
        this.active = false;
        if( fn ) window.cancelAnimationFrame( fn );
    }

    add( ...timelines ){
        for(let i=0;i<timelines.length;i++) 
            this.timelines.push( timelines[i] );
        if( !this.active ) this.start();
    }

    remove(timeline){
        for(let i=0;i<this.timelines.length;i++){
            if( this.timelimes[i] === timeline ){
                this.timelines.splice( i, 1 );
                break;
            }
        }
        if(!this.timelines.length){
            this.stop();
        }
    }

}

const ticker = new Ticker();

class Timeline {

    debugging = false;
    _active = true;
    _complete = false;
    _update = null;
    _render = null;
    fps = null;
    duration = null;
    time = null;
    props={};
    paused = true;
    started = false;

    constructor( scope=this, options={} ){
        if( scope ) this.scope = scope;
        this.options = options;
        this.time = new AnimationTime({ max: options.stop });
        if(!options.defer){
            this.start();
        }
    }

    start(){
        ticker.add( this );
        this.paused = false;
        this.started = true;
    }

    reset(){
        this.time.reset();
    }

    get active(){
        return this._active;
    }

    set active( active ){
        if( active && !this._active ){
            this._active = active;
            ticker.add( this );
        }else{
            this._active = active;
        }
    }

    set render( fn ){
        this._render = fn.bind(this.scope);
    }

    set update( fn ){
        this._update = fn.bind(this.scope);
    }

    set complete( fn ){
        this._complete = fn.bind(this.scope);
    }

    debug( parent=document.body ){
        if( !this.debugger ){
            this.debugger = new AnimationDebug();
            this.debugger.appendTo(parent);
        }
    }

    cancel(){
        this._complete = true;
        this.active = false;
    }

    tick( ms ){
        if(this.paused) return;
        if( this.time.update( ms ) ){
            if( this._update ) this._update(this.time);
            if( this._render ) this._render(this.time);
        }else{
            if(this._complete && typeof this._complete == 'function'){
                this.active = false;
                this._complete();
            }
        }
    }

    pause(){
        this.paused = true;
    }

    play(duration){
        if(!this.started) this.start();
        this.paused = false;
        if(duration) setTimeout( () => this.pause(), duration );
    }

}


export default Timeline;
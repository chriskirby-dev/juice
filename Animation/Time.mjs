import AniUtil from './Util.mjs';

const TIME_UNITS = {
    ms: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000
};

class AnimationTime {

    start = null;
	last = 0;
	ms = 0;
	delta = 0;
	frame = 0;
    max;
    options = {};
    stopped = false;
    units = 'ms';

    constructor( options={} ){
        this.options = options;
        if(options.units) this.units = options.units;
        if(options.max) this.max = options.max;
    }
    

    set max(time){
        this.options.max = time*TIME_UNITS[this.units];
    }

    get max(){
        return this.options.max/TIME_UNITS[this.units];
    }

    reset(){
        this.start = null;
        this.last = 0;
        this.ms = 0;
        this.delta = 0;
        this.frame = 0;
    }

    update( _ms ){

        if(this.stopped) return false;
        if(!this.start) this.start = _ms;

        this.last = this.ms;
        this.ms = _ms - this.start;

        if( this.options.max && this.options.max < this.ms ){
            this.ms = this.options.max;
            this.stopped = true;
        }

		this.frame++; 
        this.deltaMS = AniUtil.deltaMS( this.last, this.ms );
		this.delta = AniUtil.delta( this.last, this.ms );
        this.fps = AniUtil.FPS( this.delta );

        return true;
    }

    get seconds(){
        return this.ms/1000;
    }

    add( value, unitSample ){
        const ms = value * unitSample;
        this.update( this.ms + ms );
    }

    static toSeconds( ms ){
        return (ms||this.ms)/1000;
    }
}

export default AnimationTime;
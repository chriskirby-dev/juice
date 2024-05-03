import Vector3d from './Vector3d.mjs';

class HistoryProperty extends Array {

    HISTORY_LENGTH = 10;
    MIN = null;
    MAX = null;
    SPAN = null;
    REPEAT = false;

    constructor(v, options){
        super([v]);
        if(options.history) this.HISTORY_LENGTH = options.history;
        if(options.min) this.MIN = options.min;
        if(options.max) this.MAX = options.max;
        if(this.MIN && this.MAX) this.SPAN = this.MAX - this.MIN;
        if(options.repeat) this.REPEAT = options.repeat;
    }

    get value(){
        return this[0];
    }

    set value(v){

        if(this.value === v) return;  

        if(this.MIN && v < this.MIN){
            if(this.REPEAT) v = this.MAX - (v % this.SPAN);
            else v = this.MIN;
        }else if(this.MAX && v > this.MAX){
            if(this.REPEAT) v = this.MIN + (v % this.SPAN);
            else v = this.MAX;
        }

        this.unshift(v);
        this.changed = true;
        if(this.length > this.HISTORY_LENGTH) this.pop();
        return true;
    }

    clamp(min,max){
        this.MIN = min;
        this.MAX = max;
    }
}


export class Rotation {

    value = 0;

    constructor(value) {

        this.value = new HistoryProperty(0, {
            min: 0,
            max: 360,
            repeat: true,
        });

    }

    toRadians(){
        return this.value * Math.PI / 180;
    }
    
}

export class Rotation3d {
   
    constructor(x,y,z){
        this._x = new Rotation(x);
        this._y = new Rotation(y);
        this._z = new Rotation(z);
    }

    get x(){
        return this._x.value;
    }

    get y(){
        return this._y.value;
    }

    get z(){
        return this._z.value;
    }

    set x(v){
        return this._x.value = v;
    }

    set y(v){   
        return this._y.value = v;
    }

    set z(v){
        return this._z.value = v;
    }

    set(x,y,z){
        this._x.value = x;
        this._y.value = y;
        this._z.value = z;
    }

    add(x,y,z){
        this._x.value += x;
        this._y.value += y;
        this._z.value += z;
    }
}



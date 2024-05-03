class Vector3d {

    _vector = [0,0,0];

    constructor( x=0, y=0, z=0 ){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set x(v){
        this._vector[0] = v;
    }

    get x(){
        return this._vector[0];
    }

    set y(v){
        this._vector[1] = v;
    }

    get y(){
        return this._vector[1];
    }

    set z(v){
        this._vector[2] = v;
    }

    get z(){
        return this._vector[2];
    }

}

export default Vector3d;
const ArrayProxyHandeler = {
    get: function(){

    }
}

class ArrayProxy {


    constructor( array ){
        return new Proxy( array );
    }
}
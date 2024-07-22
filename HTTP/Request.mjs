import Emitter from '../Event/Emitter.mjs';
import Util from '../Util/Core.mjs';
import ObjUtil from '../Util/Object.mjs';

class HttpResponce {

    type = 'text';
    source = "";
    code;
    constructor( source, contentType ) {
        this.source = source;
        if(contentType) this.setType( contentType );
    }

    setCode( code ){
        this.code = code;
    }

    setType( contentType ){
        let type = "text";
        if( contentType.indexOf('json') !== -1 ){
            type = 'json';
        }
        this.type = type;
    }

    content(){
        switch(this.type){
            case 'json':
                return JSON.parse(this.source);
            break;
            default:
                return this.source;
        }
    }

}

class Request extends Emitter {


    request=null;
    url=null;
    _data = null;
    method = 'GET';
    callbacks = {};
    _options = {};
    state = 'initial';
    debug = false;

    static common = {};

    static setCommon( ){

    }


    constructor( url ) {
        super();
        this.url = url;
        this.request = this.createRequest();
    }

    createRequest(){
        var isIE8 = window.XDomainRequest ? true : false;
        if (window.XMLHttpRequest){
            return isIE8 ? new window.XDomainRequest() : new XMLHttpRequest();
        }else{
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
    }

    options( options={} ){
        if( !options.headers ) options.headers = {};
        options.headers['X-Requested-With'] = 'XMLHttpRequest';

        if( options.accept ){
            if( !options.headers ) options.headers = {};
            options.headers['Accept'] = options.accept == 'json' ? 'application/json' : options.accept;
            delete options.accept;
        }
        
      

        ObjUtil.merge( options, this._options, true );
        if(this.debug) app.log( this._options );
        return this;
    }

    data( data ){
        if(data){
            if(data.toJson)
                this._data = data.toJson();
            else
                this._data = data;
        }
    }

    get( data, options ) {
        this.method = 'GET';
        this.data( data );
        this.options( options );
        return this.send('GET', data );
    }

    post( data, options ) {
        this.method = 'POST';
        this.data( data );
        this.options( options );
        return this.send('POST', data );
    }
    head( data, options ) {
        this.method = 'HEAD';
        this.data( data );
        this.options( options );
        return this.send('HEAD', data );
    }
    put( data, options ) {
        this.method = 'PUT';
        this.data( data );
        this.options( options );
        return this.send('PUT', data );
    }

    patch( data, options){
        this.method = 'PATCH';
        this.data( data );
        this.options( options );
        return this.send('PATCH', data );
    }

    delete( data, options ) {
        this.method = 'DELETE';
        this.data( data );
        this.options( options );
        return this.send('DELETE', data );
    }

    cancel(){
        this.request.abort();
    }

    progress( fn ){
        this.callbacks.progress = fn;
    }

    send( method, data, options=this._options ){

        const self = this;
        if( method ) this.method = method;
    
        if( data ) this.data( data );
        let reqData;

        if( this._data ){

            if( this._options.requestType == 'json' ){
                options.headers['Content-Type'] = 'application/json';
                reqData = JSON.stringify( this._data );
            }else if(method == 'GET'){
                let query = [];
                for (var prop in this._data ) {
                    query.push( prop+'='+this._data[prop] );
                } 
                this.url += '?'+query.join('&');
            }else if( Util.type( this._data, 'object') ) {
                reqData = new FormData();
                for (var prop in data) {
                    reqData.append(prop, data[prop]);
                }
            }else{
                reqData = this._data;
            }
        }

        const request = this.request;
        request.open( this.method, this.url, true );

        if( options.headers ){
            for( let prop in options.headers ){
                this.request.setRequestHeader( prop, options.headers[prop] );
            }
        }

        const promise = new Promise((resolve, reject) => {

            request.onreadystatechange = function () {
                const state = request.readyState;
                const responseType = request.responseType || request.getResponseHeader('Content-Type') || 'text';
                
                let resp = responseType == 'text' ? request.responseText : request.response;

                if (state == 4) {
                    const httpResp = new HttpResponce( resp );
                    httpResp.setType( responseType );
                    httpResp.setCode( request.status );
                    self.code = request.status;

                    if (request.status >= 400 ) {
                        //Catch Error
                        return reject( httpResp.content() );
                    }

                    //Successful Req
                    return resolve( httpResp.content() );
                }
            }

        });

        request.upload.addEventListener('progress', ( e ) => {
            if(!this.callbacks.progress) return;
            const percent = e.loaded/e.total;
            return this.callbacks.progress({
                total: e.total,
                loaded: e.loaded,
                percent: percent
            });
        });

        request.send( reqData );

        return promise;

    }

}

export default Request;

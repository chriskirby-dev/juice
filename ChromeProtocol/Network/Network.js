import DomainWrapper from '../DomainWrapper.js';
import NetworkRequest from './Request.js';

const IGNORED_URLS = ['https://www.google-analytics.com'];

class Network extends DomainWrapper {

    static uses = ['DOM', 'Page', 'Network'];
    viewer;
    requests = {};

    _ignore = {
        url: ['https://www.google-analytics.com'],
        type: ['image', 'Stylesheet', 'Font']
    };

    _only = {
        method: []
    };
    

    ignore( type, values=[] ){
        const properties = ['url', 'type', 'method', 'mime'];
        if(this._ignore[type]) this._ignore[type] = this._ignore[type].concat(values);
        else 
        this._ignore[type] = values;
    }

    only( type, values ){
        const properties = ['url', 'type', 'method', 'mime'];
        if(this._only[type]) this._only[type] = this._only[type].concat(values);
        else 
        this._only[type] = values;
    }

    excluded( request ){
        const { url, type, method  } = request;
        const properties = ['url', 'type', 'method'];
        const onlyTypes = Object.keys(this._only).filter(t => this._only[t].length );
        const ignoreTypes = Object.keys(this._ignore).filter(t => this._ignore[t].length );
        let isOnly = false;
        let isIgnored = false;
        //debug(url, request.data.type, method);
        if(onlyTypes.length){
            isOnly = onlyTypes.some( type => 
                this._only[type]?.some( snip => 
                    typeof request[type] == 'string' && request[type].toLowerCase().includes(snip.toLowerCase())
                )
            );
            //debug(  isOnly ? 'IS_ONLY' : 'NOT_ONLY')
        }

        if(ignoreTypes.length){
            isIgnored = ignoreTypes.some( type => 
                this._ignore[type].some( snip => 
                    typeof request[type] == 'string' && request[type].toLowerCase().includes(snip.toLowerCase())
                )
            );
           //debug(isIgnored ? 'IS_IGNORED' : 'NOT_IGNORED')
        }

        if( isIgnored || onlyTypes.length && isOnly === false ){
            request.ignored = true;
            return true;
        }
        return false;
    }   

    getPostData(requestId){
        const { Network } = this.domains;
        return Network.getRequestPostData({ requestId });
    }

    getResponseBody(requestId){
        const { Network } = this.domains;
        return Network.getResponseBody({ requestId });
    }

    overrideUserAgent( ua ){
        const { Network } = this.domains;
        Network.setUserAgentOverride({ userAgent: ua });
    }

    setExtraHeaders( headers ){
        const { Network } = this.domains;
        Network.setExtraHTTPHeaders({ headers });
    }

    cookie( url, name, value ){
        const { Network } = this.domains;
        if(data){
            //Set Cookie 
            Network.setCookie({ url, name, value });
        }else{
            //Get Cookie
            this.cookies[url] = Network.getCookies({ url });
            return this.cookies[url][name]
        }
    }

    cookies( url, data ){
        const { Network } = this.domains;
        if(data){
            //Set Cookies
            Network.setCookies({ cookies: data });
        }else{
            //Get Cookies
            this.cookies[url] = Network.getCookies({ url });
        }
    }

    request(data=null){
        const { requestId } = data || {};
        
        
        if(this.requests[requestId]) return this.requests[requestId];
       // //debug('REQUEST', data, requestId);
        const { Network } = this.domains;
        this.requests[requestId] = new NetworkRequest(data||requestId);
        if(!data.request) {
            this.requests[requestId].ignored = true;
            return this.requests[requestId];
        }
        this.excluded(this.requests[requestId])
        
        return this.requests[requestId];
    }

    close(){
        this.cdp.disconnect();
    }


    async initialize(){

        const self = this;

        NetworkRequest.Network = this;

        const { Network } = this.domains;

        // Enable the DOM and Debugger domains
       // Network.clearBrowserCookies();

       Network.requestWillBeSent((params) => {
            const request = this.request(params);
            
            if(request.ignored) return;
            //debug('requestWillBeSent', request );
            if(request.isLogin){
                this.emit('request:login', request );
            }
            return this.emit('request', request);
       });

       Network.requestWillBeSentExtraInfo((params) => {
            ////debug('requestWillBeSentExtraInfo', params); 
            const { requestId } = params;
            const request = this.request(requestId);
            if(request.ignored) return;
            request.setData(params, 'extra');
       });
      

       Network.loadingFinished((params) => {
        
        //Response Finished 
            const request = this.request(params);
            if(request.ignored) return;

            //request.complete();
       });

       Network.loadingFailed((params) => {
        const { requestId, dataLength } = params;
        const request = this.request(params);
        if(request.ignored) return;

        request.failed();
       })

       Network.dataReceived((params) => {
            ////debug('dataReceived', params);
            //Chunk Recieved
            const { requestId, dataLength } = params;
            const request = this.request(params);
            if(request.ignored) return;

            request.addChunkSize(dataLength);
       });

       Network.responseReceived(( params ) => {
            const request = this.request(params);
            if(request.ignored) return;
            request.setResponse( params.response );
       });

       Network.webSocketCreated((params) => {
        //debug('webSocketCreated', params);
       });

       Network.webSocketWillSendHandshakeRequest((params) => {
        //debug('webSocketWillSendHandshakeRequest', params);
       });

       Network.webSocketHandshakeResponseReceived((params) => {
        //debug('webSocketHandshakeResponseReceived', params);
       });

       Network.webSocketFrameReceived((params) => {
        //debug('webSocketFrameReceived', params);
       });

       Network.webSocketFrameSent((params) => {
        //debug('webSocketFrameSent', params);
       });

       Network.webSocketClosed((params) => {
        //debug('webSocketClosed', params);
       });



    }
}

export default Network;
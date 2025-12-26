/**
 * Network wrapper for Chrome DevTools Protocol Network domain.
 * Provides network monitoring, filtering, and request tracking capabilities.
 * @module ChromeProtocol/Network/Network
 */

import DomainWrapper from '../DomainWrapper.js';
import NetworkRequest from './Request.js';

/**
 * URLs to ignore by default.
 * @constant {string[]}
 */
const IGNORED_URLS = ['https://www.google-analytics.com'];

/**
 * Manages network traffic monitoring and filtering for Chrome DevTools Protocol.
 * @class Network
 * @extends DomainWrapper
 * @fires Network#request - Emitted when a network request is made
 * @fires Network#request:login - Emitted when a login request is detected
 */
class Network extends DomainWrapper {

    /**
     * CDP domains used by this wrapper.
     * @static
     * @type {string[]}
     */
    static uses = ['DOM', 'Page', 'Network'];
    
    viewer;
    /**
     * Map of tracked requests by request ID.
     * @type {Object.<string, NetworkRequest>}
     */
    requests = {};

    /**
     * Filters for ignoring requests.
     * @type {Object}
     * @private
     */
    _ignore = {
        url: ['https://www.google-analytics.com'],
        type: ['image', 'Stylesheet', 'Font']
    };

    /**
     * Filters for only including specific requests.
     * @type {Object}
     * @private
     */
    _only = {
        method: []
    };
    

    /**
     * Adds patterns to ignore in network requests.
     * @param {string} type - Filter type ('url', 'type', 'method', or 'mime')
     * @param {string[]} [values=[]] - Values to ignore
     */
    ignore( type, values=[] ){
        const properties = ['url', 'type', 'method', 'mime'];
        if(this._ignore[type]) this._ignore[type] = this._ignore[type].concat(values);
        else 
        this._ignore[type] = values;
    }

    /**
     * Sets patterns to only include in network requests.
     * @param {string} type - Filter type ('url', 'type', 'method', or 'mime')
     * @param {string[]} values - Values to include
     */
    only( type, values ){
        const properties = ['url', 'type', 'method', 'mime'];
        if(this._only[type]) this._only[type] = this._only[type].concat(values);
        else 
        this._only[type] = values;
    }

    /**
     * Checks if a request should be excluded based on filters.
     * @param {NetworkRequest} request - The request to check
     * @returns {boolean} True if request should be excluded
     */
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

    /**
     * Gets POST data for a specific request.
     * @param {string} requestId - The request ID
     * @returns {Promise<string>} The POST data
     */
    getPostData(requestId){
        const { Network } = this.domains;
        return Network.getRequestPostData({ requestId });
    }

    /**
     * Gets response body for a specific request.
     * @param {string} requestId - The request ID
     * @returns {Promise<Object>} Object with base64Encoded flag and body content
     */
    getResponseBody(requestId){
        const { Network } = this.domains;
        return Network.getResponseBody({ requestId });
    }

    /**
     * Overrides the user agent string for network requests.
     * @param {string} ua - The user agent string to use
     */
    overrideUserAgent( ua ){
        const { Network } = this.domains;
        Network.setUserAgentOverride({ userAgent: ua });
    }

    /**
     * Sets extra HTTP headers for all requests.
     * @param {Object} headers - Header key-value pairs
     */
    setExtraHeaders( headers ){
        const { Network } = this.domains;
        Network.setExtraHTTPHeaders({ headers });
    }

    /**
     * Gets or sets a cookie for a specific URL.
     * @param {string} url - The URL to get/set cookie for
     * @param {string} name - Cookie name
     * @param {string} [value] - Cookie value (if setting)
     * @returns {string|undefined} The cookie value if getting
     */
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

    /**
     * Gets or sets all cookies for a specific URL.
     * @param {string} url - The URL to get/set cookies for
     * @param {Object} [data] - Cookie data (if setting)
     * @returns {Object|undefined} The cookies if getting
     */
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

    /**
     * Gets or creates a NetworkRequest for the given request ID.
     * @param {Object|string} [data=null] - Request data or request ID
     * @returns {NetworkRequest} The network request object
     */
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

    /**
     * Closes the CDP connection.
     */
    close(){
        this.cdp.disconnect();
    }

    /**
     * Initializes the Network domain and sets up event listeners.
     * @returns {Promise<void>}
     */
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
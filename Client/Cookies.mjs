/**
 * Browser cookie management utilities.
 * Provides methods for reading, writing, and parsing browser cookies.
 * @module Client/Cookies
 */

/**
 * Cookie manager for browser cookie operations.
 * @class Cookies
 * @example
 * const cookies = new Cookies();
 * cookies.set('name', 'value');
 * const value = cookies.get('name');
 */
class Cookies {

    data = {};

    constructor(){
        this.update();
    }

    static parseString(str, opt) {
        opt = opt || {};
        var obj = {};
        var pairs = str.split(/[;,] */);
        var dec = opt.decode || decodeURIComponent;
    
        pairs.forEach(function(pair) {
            var eq_idx = pair.indexOf('=');
            // skip things that don't look like key=value
            if (eq_idx < 0) return;
            var key = pair.substr(0, eq_idx).trim();
            var val = pair.substr(++eq_idx, pair.length).trim();
            // quoted values
            if ('"' == val[0]) {
                val = val.slice(1, -1);
            }
            // only assign once
            if (undefined == obj[key]) {
                try {
                    obj[key] = dec(val);
                } catch (e) {
                    obj[key] = val;
                }
            }
        });
    
        return obj;
    };

    static serialize(name, val, opt){
        opt = opt || {};
        var enc = opt.encode || encodeURIComponent;
        var pairs = [name + '=' + enc(val)];
    
        if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
        if (opt.domain) pairs.push('Domain=' + opt.domain);
        if (opt.path) pairs.push('Path=' + opt.path);
        if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
        if (opt.httpOnly) pairs.push('HttpOnly');
        if (opt.secure) pairs.push('Secure');
    
        return pairs.join('; ');
    }

    update(){
        this.data = Cookies.parseString( document.cookie );
    }

    

    get( key ){
        if(this.data[key]){
            return this.data[key];
        }else{
            return false;
        }
    }

    set( key, val, params = {} ){
        if(!params.path) params.path = '/';
        document.cookie = Cookies.serialize(key, val, params);
        this.data = Cookies.parseString(document.cookie);
    }


    clear( key, params = {} ){
        if(!params.path) params.path = '/';
        params.expires = new Date(new Date().getTime()-86409000);
        document.cookie = Cookies.serialize(key, 'expired', params );
        this.data = Cookies.parseString(document.cookie);
    }

    hasValue(key){
        if(typeof this.data[key] != 'undefined' && this.data[key] != ''){
            return true;
        }else{
            return false;
        }
    }

}

export default Cookies;
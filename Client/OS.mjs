/**
 * Operating system detection module.
 * Detects OS platform from navigator properties.
 * @module Client/OS
 */

/**
 * Platform detection configuration mapping platform names to detection terms.
 * @type {Object<string, {str: string, terms: Array<string>}>}
 * @private
 */
const PLATFORMS = {
    mac: { str: navigator.platform.toLowerCase(), terms: ['mac'] },
    win: { str: navigator.platform.toLowerCase(), terms: ['win'] },
    ios: { str: navigator.platform.toLowerCase(), terms: ['ipad','iphone','ipod'] },
    andriod: { str: navigator.userAgent.toLowerCase(), terms: ['android'] },
    iemoble: { str: navigator.userAgent.toLowerCase(), terms: ['iemobile'] }
};

/**
 * Detects the current platform from navigator properties.
 * @returns {string} Platform name (mac, win, ios, andriod, iemoble)
 * @private
 */
var getPlatform = function(){
    let platform;
    for(let p in PLATFORMS){
        for(var i=0;i<PLATFORMS[p].terms.length;i++){
            if(PLATFORMS[p].str.indexOf(PLATFORMS[p].terms[i]) != -1) platform = p;
        }
    }
    return platform;
};

/**
 * Operating system detection utility.
 * Provides static access to OS platform information.
 * @class OS
 * @example
 * import OS from './Client/OS.mjs';
 * console.log(OS.name); // 'mac', 'win', 'ios', etc.
 */
class OS {
    /** @type {Object} Internal storage for detected values */
    static defined = {};
    
    /**
     * Gets the detected OS platform name.
     * Result is cached after first access.
     * @type {string}
     * @static
     */
    static get name(){
        return this.defined.name || ( this.defined.name = getPlatform() );
    }
}

export default OS;
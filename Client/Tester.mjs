/**
 * Browser/User Agent testing utility.
 * Provides methods to detect browser type and version from user agent strings.
 * @module Client/Tester
 */

/**
 * Utility class for testing and detecting browser information.
 * @class Tester
 * @example
 * const browserName = Tester.testData(browserData);
 * const version = Tester.searchVersion(userAgent);
 */
class Tester {
    /** @type {Object} Internal storage for detected values */
    static defined = {};

    /**
     * Gets the version search string for browser detection.
     * @type {string}
     * @static
     */
    static get versionSearchString(){
        return this.defined.versionSearchString;
    };

    /**
     * Searches for version number in data string.
     * @param {string} dataString - String to search for version
     * @returns {string|undefined} Version string if found
     * @static
     */
    static searchVersion(dataString){
        var index = dataString.indexOf(Tester.versionSearchString);
        if (index == -1) return;
        return dataString.substring(index+Tester.versionSearchString.length+1).split(' ').shift();
    };

    /**
     * Tests array of browser detection data against navigator properties.
     * @param {Array<Object>} data - Array of browser detection configs
     * @param {string} [data[].string] - String to test
     * @param {*} [data[].prop] - Property to test
     * @param {string} data[].subString - Substring to search for
     * @param {string} data[].identity - Browser identity name
     * @param {string} [data[].versionSearch] - Version search string
     * @returns {string|undefined} Browser identity if matched
     * @static
     */
    static testData( data ){
        for (var i=0;i<data.length;i++)	{
            var testType = null;
            var tester = ( data[i].string && data[i].string.toLowerCase() || data[i].prop || null );			
            if(tester){
                this.defined.versionSearchString = data[i].versionSearch || data[i].identity;
                if(typeof tester == 'string'){
                    if (tester.indexOf(data[i].subString) != -1) return data[i].identity;
                }else if (typeof tester == 'object' ){
                    return data[i].identity;
                }
            }
        }
    };
    
}

export default Tester;
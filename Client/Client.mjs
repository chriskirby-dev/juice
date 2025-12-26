/**
 * Client utilities aggregator providing access to browser, OS, window, cookies, and clipboard.
 * Centralizes client-side environment detection and manipulation.
 * @module Client/Client
 */

import Browser from './Browser.mjs';
import Cookies from './Cookies.mjs';
import Window from './Window.mjs';
import OS from './OS.mjs';
import Clipboard from './Clipboard.mjs';

/**
 * Client utility class aggregating browser environment utilities.
 * Provides lazy-loaded access to browser, OS, cookies, window, and clipboard.
 * @class Client
 * @example
 * import Client from './Client/Client.mjs';
 * console.log(Client.browser.name);
 * console.log(Client.os.name);
 * Client.clipboard.copy('text');
 */
class Client {
    /** @type {Object} Internal storage for lazy-loaded utilities */
    static defined = {};

    /**
     * Gets Clipboard utility.
     * @type {Clipboard}
     * @static
     */
    static get clipboard(){
        return this.defined.clipboard || ( this.defined.clipboard = Clipboard );
    }

    /**
     * Gets Browser utility.
     * @type {ClientBrowser}
     * @static
     */
    static get browser(){
        return this.defined.browser || ( this.defined.browser = Browser );
    }

    /**
     * Gets Cookies instance.
     * @type {Cookies}
     * @static
     */
    static get cookies(){
        return this.defined.cookies || ( this.defined.cookies = new Cookies() );
    }

    /**
     * Gets Window utility.
     * @type {Window}
     * @static
     */
    static get window(){
        return this.defined.window || ( this.defined.window = Window );
    }

    /**
     * Gets OS utility.
     * @type {OS}
     * @static
     */
    static get os(){
        return this.defined.OS || ( this.defined.OS = OS );
    }

}

export default Client;
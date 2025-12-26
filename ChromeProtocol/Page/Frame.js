/**
 * Frame class for managing Chrome DevTools Protocol frame objects.
 * Represents an iframe or main frame in a page.
 * @module ChromeProtocol/Page/Frame
 */

import EventEmitter from 'events';
import ChromeProtocol from '../ChromeProtocol.js';

/**
 * Represents a page frame (main frame or iframe) in Chrome DevTools Protocol.
 * @class Frame
 * @extends EventEmitter
 */
class Frame extends EventEmitter {


    data;
    page;

    /**
     * Creates a new Frame instance.
     * @param {Object} data - Frame data from Chrome DevTools Protocol
     * @param {Object} page - The parent page object
     */
    constructor(data, page){
        super();
        this.page = page;
        this.map = data;
        this.cdp = new ChromeProtocol();

        this.frame = this.mainFrame.frames.filter( frame => frame.routingId == this.id );
     
    }

    /**
     * Gets the main frame reference.
     * @returns {Object} The main frame object
     */
    get mainFrame(){
        return this.page.cdp.viewport.webContents.mainFrame;
    }

    /**
     * Gets the frame ID.
     * @returns {string} The frame ID
     */
    get id(){
        return this.map.frame.id;
    }

    /**
     * Gets the MIME type of the frame content.
     * @returns {string} The MIME type
     */
    get mimeType(){
        return this.map.frame.mimeType;
    }

    /**
     * Gets the frame URL.
     * @returns {string} The frame URL
     */
    get url(){
        return this.map.frame.url;
    }

    /**
     * Injects and executes JavaScript in this frame.
     * @param {string} script - The JavaScript code to execute
     */
    inject( script ){
        this.frame.executeJavaScript( script );
    }

    /**
     * Gets child frames.
     * @returns {Array} Array of child frame data
     */
    get children(){
        return this.map.children;
    }

    /**
     * Gets a specific child frame by index.
     * @param {number} i - The child frame index
     * @returns {Frame|null} The child frame or null if not found
     */
    child(i){
        return this.children[i] ? new Frame(this.children[i]) : null;
    }
}

export default Frame;

/**
 * Manages a collection of page frames.
 * @class PageFrames
 */
class PageFrames {

}
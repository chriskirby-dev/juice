/**
 * Debugger wrapper for Chrome DevTools Protocol debugger functionality.
 * Provides methods for setting breakpoints and handling debugging events.
 * @module ChromeProtocol/Debugger
 */

import DomainWrapper from "./DomainWrapper.js";

/**
 * Wrapper for Chrome DevTools Protocol Debugger domain.
 * Manages breakpoints, DOM debugging, and pause events.
 * @class Debugger
 * @extends DomainWrapper
 */
class Debugger extends DomainWrapper {

    /**
     * List of CDP domains this wrapper uses.
     * @type {string[]}
     * @static
     */
    static uses = ['Page', 'DOMDebugger', 'Debugger', 'Runtime'];

    /**
     * Storage for registered breakpoints.
     * @type {Object}
     */
    breakpoints = {};

    /**
     * Injects a click event listener into the viewport for debugging.
     * Captures click events with target information and coordinates.
     * @returns {Promise<void>}
     */
    async clickListener(){

        await this.isReady();

        const { Runtime } = this.domains;

        this.setBreakpoint('click');

        this.cdp.viewport.webContents.executeJavaScript(`
            window.addEventListener('click', function clickListener(e){
                const target = e.target;
                const id = target.id;
                const className = target.className;
                const name = target.name;
                const point = { x: e.clientX, y: e.clientY };
                const rect = target.getBoundingClientRect();
                console.log('click', id, name, point, rect );
                cdp.send({ id, className, name, point });
            });
            console.log('Click Listener Injected');
        `);

        debug('executeJavaScript');
    }

    /**
     * Sets an event listener breakpoint.
     * @param {string} eventName - The name of the event (e.g., 'click', 'keydown')
     * @param {string} [targetName='*'] - Target selector (default: all targets)
     * @returns {Promise<void>}
     */
    async setBreakpoint( eventName, targetName='*' ){
        //debug('setBreakpoint', eventName, targetName);
        await this.isReady();
        const { DOMDebugger } = this.domains;
        // Set a breakpoint on a DOM node with given id.
        await DOMDebugger.setEventListenerBreakpoint({
            eventName, 
            targetName
        });
    }

    /**
     * Sets a DOM breakpoint on a specific node.
     * @param {string} eventName - The event name
     * @param {string} [targetName='*'] - Target selector (default: all targets)
     * @returns {Promise<void>}
     */
    async setDomBreakpoint( eventName, targetName='*' ){
        //debug('setBreakpoint', eventName, targetName);
        await this.isReady();
        const { DOMDebugger } = this.domains;
        // Set a breakpoint on a DOM node with given id.
        await DOMDebugger.setDOMBreakpoint({
            eventName, 
            targetName
        });
    }

    /**
     * Initializes the debugger by setting up event listeners.
     * Listens for pause and breakpoint resolution events.
     * @returns {boolean}
     */
    initialize(){
        //debug('Debug init');
        const { Debugger } = this.domains;

        Debugger.paused((params) => {
            // breakpoint hit
            debug('BREAKPOINT', params);
            this.emit('breakpoint', params);
        })

        Debugger.breakpointResolved((params) => {
            //debug('BREAKPOINT ADDED', params);
        });

        this.client.on('event', (message) => {
            debug(message);
        })

        return;
    }
}
export default Debugger;
/**
 * DOM management for Chrome DevTools Protocol.
 * Provides high-level DOM manipulation and querying capabilities.
 * @module ChromeProtocol/Dom/Dom
 */

import NodeRegistry from './Registry.js';
import DomainWrapper from '../DomainWrapper.js';
import VirtualDoc from './VirtualDoc.js';   

/**
 * Main DOM management class for Chrome DevTools Protocol.
 * Handles document navigation, element querying, and DOM tree management.
 * @class Dom
 * @extends DomainWrapper
 */
class Dom extends DomainWrapper {

    state = 'idle';

    /**
     * Specifies which Chrome DevTools Protocol domains this class uses.
     * @static
     * @type {Array<string>}
     */
    static uses = ['DOM', 'Page', 'Network', 'Runtime'];

    /**
     * Navigates to a URL and waits for content to be ready.
     * @param {string} url - The URL to navigate to
     * @returns {Promise<boolean>} Resolves when content is ready
     */
    navigate(url){

        return new Promise((resolve, reject) => {

            this.once('content-ready', ({ href }) => {
                //debug('DOM-READY', href);
                return resolve(true);
            });

            this.view.webContents.loadURL( url );

        });
    }

    /**
     * Retrieves and registers a full element by node ID.
     * @param {number} nodeId - The node ID to pull
     * @returns {Promise<Object>} The registered element
     */
    async pullElement( nodeId ){
        const { DOM } = this.domains;
        const { node } = await DOM.describeNode({
            nodeId: nodeId,
            depth: -1,
            pierce: true
        });
        //debug('node', node);
        return await this.registry.register(node);

    }

    /**
     * Queries for a single element using a CSS selector.
     * @param {string} selector - CSS selector string
     * @param {number} [scope] - Optional scope node ID to query within
     * @param {boolean} [asElement=false] - Whether to return element object or node ID
     * @returns {Promise<Object|number>} The element or node ID
     */
    async querySelector( selector, scope, asElement = false ){
        const { DOM } = this.domains;
        const { nodeId } = await DOM.querySelector({
            nodeId: scope ? scope : this.root.nodeId,
            selector: selector,
        });
        //debug('nodeId', nodeId );
        //debug('queryResult', this.registry.byNodeId( nodeId ) );

        let element = this.registry.byNodeId( nodeId );
        if( !element ){
            element = await this.pullElement( nodeId );
        }

        return asElement ? element : nodeId;
    }

    /**
     * Queries for all elements matching a CSS selector.
     * @param {string} selector - CSS selector string
     * @param {number} [scope] - Optional scope node ID to query within
     * @param {boolean} [asElement=false] - Whether to return element objects or node IDs
     * @returns {Promise<Array<number>>} Array of node IDs
     */
    async querySelectorAll( selector, scope, asElement = false ){
        const { DOM } = this.domains;
        const {nodeIds} = await DOM.querySelectorAll({
            nodeId: scope ? scope : this.root.nodeId,
            selector: selector,
        });
        return nodeIds;
    }

    /**
     * Resets the content ready event timer.
     * Used to detect when DOM mutations have settled.
     * @private
     */
    resetContentReadyEvent(){
        clearTimeout(this.contentEvent);
        this.contentEvent = setTimeout(() => {
           this.state = 'ready';
           this.emit('content-ready', { href: this.root.documentURL });
           //debug('content-ready');
        }, 1000 );
    }

    /**
     * Initializes the DOM manager and sets up event listeners.
     * @returns {Promise<void>}
     */
    async initialize(){

        const self = this;
        this.registry = new NodeRegistry(this);
        this.view = this.cdp.viewport;
        
        const { DOM, Page, Network, Runtime } = this.domains;
        /*
        // Get the root Document node
        const { root } = await DOM.getDocument({
            depth: -1,
            pierce: true
        });

        this.root = root;

        const vdoc = new VirtualDoc(root);
       // debug('vdoc', vdoc);
       debug('VDoc Ready');
        
        this.registry.reset();
        this.registry.register(root);
        //this.compileNodeIndex(root);
        */
        const { cssVisualViewport } = await Page.getLayoutMetrics();
        this.viewport = cssVisualViewport;
        //debug('viewport', this.viewport);

        Network.on('requestWillBeSent', ( data ) => {
            //console.log('requestWillBeSent', data);
        });

        Network.on('loadingFinished', ( data ) => {
            //console.log('loadingFinished', data);
        });

        DOM.on('childNodeCountUpdated', ( data ) => {

        });

        DOM.on('attributeModified', ( data ) => {

        });

        DOM.on('attributeRemoved', ( data ) => {

        });
/*
        DOM.on('documentUpdated', ( data ) => {
            this.state = 'loading';
            this.registry.reset();
        });

        DOM.on('characterDataModified', ( data ) => {
            ////debug('characterDataModified', data);
        });

        DOM.on('childNodeInserted', async ( data ) => {
            //debug('childNodeInserted', data);
            //debug(this.registry.allNodeIds());
            
            const element = await this.registry.register(data.node);
            const parent = this.registry.byNodeId(data.parentNodeId);
            parent.addChild( element.backendNodeId, data.previousNodeId );

            if(this.state == 'loading') this.resetContentReadyEvent();
        });

        DOM.on('childNodeRemoved', async ( data ) => {
            //debug('childNodeRemoved', data);
            const parent = this.registry.byNodeId(data.parentNodeId);
            const child = this.registry.byNodeId(data.nodeId);
            parent.removeChild(child.backendNodeId);
            if(this.state == 'loading') this.resetContentReadyEvent();
        });

        DOM.on('setChildNodes', ( data ) => {
            if(this.state == 'loading') this.resetContentReadyEvent();
        });

        Page.on('domContentEventFired', async ( data ) => {
            this.registry.reset();
            //debug('emitting content-ready');
            this.state = 'loading';

            //debug('domContentEventFired', data );
            const { root } = await DOM.getDocument({
                depth: -1,
                pierce: true
            });

            this.root = root;
           // //debug('root', root);
            this.registry.register(root);

            const { cssVisualViewport } = await Page.getLayoutMetrics();
            this.viewport = cssVisualViewport;
            //debug('viewport', this.viewport);


        });

*/
        this.emit('ready');
    }
}

export default Dom;
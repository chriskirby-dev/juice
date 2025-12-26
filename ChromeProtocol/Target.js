/**
 * Target wrapper for Chrome DevTools Protocol Target domain.
 * Provides methods for managing and discovering browser targets (pages, iframes, workers, etc.).
 * @module ChromeProtocol/Target
 */

import DomainWrapper from "./DomainWrapper.js";

/**
 * Wrapper for Chrome DevTools Protocol Target domain.
 * Manages target lifecycle, discovery, and attachment.
 * @class Target
 * @extends DomainWrapper
 */
class Target extends DomainWrapper {

    /**
     * List of CDP domains this wrapper uses.
     * @type {string[]}
     * @static
     */
    static uses = ['Target'];

    /**
     * Attaches to a specific target by its ID.
     * @param {string} targetId - The ID of the target to attach to
     */
    attach( targetId ){
        this.cdp.connect(targetId)
    }

    /**
     * Detaches from the current target.
     */
    detach(){

    }

    /**
     * Attaches to related targets.
     */
    attachRelated(){
        
    }

    /**
     * Exposes the DevTools protocol for the current target.
     * Allows external tools to connect to this target.
     */
    exposeDevtools(){
        const { Target } = this.domains;
        Target.exposeDevToolsProtocol({ targetId: this.cdp.targetId });
        debug('exposeDevToolsProtocol',{ targetId: this.cdp.targetId });
        this.exposed = true;
    }

    /**
     * Enables target discovery and listens for target lifecycle events.
     * Emits events when targets are created or destroyed.
     */
    discover(){
        const { Target } = this.domains;

        Target.on('targetCreated', ({ targetInfo }) => {
            debug(targetInfo);
        });

        Target.on('targetDestroyed', ( targetId ) => {
            debug(targetId);
        });

        Target.setDiscoverTargets();
    }

    /**
     * Gets all available targets.
     * @returns {Promise<Array>} Array of target information objects
     */
    async all(){
        const { Target } = this.domains;
        const { targetInfos } = await Target.getTargets();
        return targetInfos;
    }

    /**
     * Finds a target matching the given conditions.
     * @param {Object} [conditions={}] - Key-value pairs to match against target properties
     * @returns {Promise<Object|undefined>} The matching target info or undefined
     * @example
     * const target = await targetWrapper.find({ type: 'page', url: 'https://example.com' });
     */
    async find( conditions={} ){
        const keys = Object.keys(conditions);
        const all = await this.all();
        return all.find((t) => keys.every( (k) => t.hasOwnProperty(k) && t[k] == conditions[k] ) )
    }

    /**
     * Initializes the Target domain wrapper.
     * @returns {boolean} True when initialized
     */
    initialize(){
        const {Target} = this.domains;

        return true;
    }
}

export default Target;
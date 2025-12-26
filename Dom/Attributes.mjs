/**
 * DomAttributes manages HTML element attributes.
 * Provides a structured interface for getting, setting, and manipulating DOM attributes.
 * @module Dom/Attributes
 */

/**
 * DomAttributes manages attributes for DOM elements.
 * Stores attributes internally and can sync with a bound DOM element.
 * @class DomAttributes
 * @example
 * const attrs = new DomAttributes({ id: 'myId', class: 'myClass' });
 * attrs.set('data-value', '123');
 */
class DomAttributes {

    /**
     * The bound DOM element.
     * @type {Element|null}
     */
    dom;
    
    /**
     * Internal storage for attributes.
     * @type {Object}
     * @private
     */
    #attributes = {};
    
    /**
     * Creates a new DomAttributes instance.
     * @param {Object} [data={}] - Initial attributes as key-value pairs
     * @param {Element} [dom] - Optional DOM element to bind to
     */
    constructor( data={}, dom ){
        if(data) this.assign( data );
        if(dom) this.dom = dom;
        this.initialize();
    }

    /**
     * Binds this attributes manager to a DOM element.
     * @param {Element} dom - The DOM element to bind to
     */
    bind( dom ){
        this.dom = dom;
    }

    /**
     * Converts attributes to an HTML attribute string.
     * @returns {string} HTML attribute string (e.g., 'id="myId" class="myClass"')
     */
    toString(){
        const list = [];
        for( let prop in this.#attributes ){
            const value = this.#attributes[prop];
            if( value == null ){
                list.push( `${prop}`) ;
            }else{
                list.push( `${prop}="${this.#attributes[prop]}"`) ;
            }
        }
        return list.join(' ');
    }

    /**
     * Assigns multiple attributes at once.
     * @param {Object} data - Key-value pairs of attributes
     */
    assign( data ){
        for( let prop in data ){
            this.set(prop, data[prop]);
        }
    }

    /**
     * Applies all stored attributes to a DOM element.
     * @param {Element} el - The element to apply attributes to
     */
    apply( el ){
        for( let prop in this.#attributes ){
            el.setAttribute( prop, this.#attributes[prop] );
        }
    }

    /**
     * Checks if an attribute exists.
     * @param {string} name - The attribute name
     * @returns {boolean} True if the attribute exists
     */
    has( name ){
        return this.#attributes[name] ? true : false;
    }

    /**
     * Gets an attribute value.
     * @param {string} name - The attribute name
     * @returns {*} The attribute value
     */
    get( name ){
        return this.#attributes[name];
    }

    /**
     * Sets an attribute value.
     * If a DOM element is bound, also sets the attribute on the element.
     * @param {string} name - The attribute name
     * @param {*} [value=null] - The attribute value
     */
    set( name, value=null ){
        this.#attributes[name] = value;
        if(this.dom) this.dom.setAttribute( name, value );
    }

    /**
     * Sets multiple attributes at once.
     * @param {Object} attrs - Key-value pairs of attributes
     */
    setMany(attrs){
        for(let prop in attrs){
            this.set(prop, attrs[prop]);
        }
    }

    /**
     * Extracts attributes from a DOM element into a plain object.
     * @param {Element} source - The source element
     * @returns {Object} Key-value pairs of attributes
     * @static
     */
    static extract(source){
        const attrs = {};
        if( !source?.attributes ) return attrs;
        for (const attr of source.attributes) {
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }

    /**
     * Copies all attributes from source element to target element.
     * @param {Element} source - The source element
     * @param {Element} target - The target element
     * @static
     */
    static copy( source, target ){
        for (const attr of source.attributes) {
            target.setAttribute(attr.name, attr.value);
        }
    }

    /**
     * Converts attributes to HTML (stub for future implementation).
     * @static
     */
    static toHTML(){
        
    }

    /**
     * Initializes attributes from the bound DOM element.
     * @private
     */
    initialize(){
        if( this.dom && this.dom.attributes.length ){
            for( let i=0;i<this.dom.attributes.length;i++ ){
                this.set( this.dom.attributes[i].name, this.dom.attributes[i].value );
            }
        }
    }
}

export default DomAttributes;
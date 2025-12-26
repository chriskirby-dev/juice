/**
 * Represents a DOM element in the Chrome DevTools Protocol.
 * Wrapper class for DOM element nodes.
 * @class Element
 */
class Element {

    node;

    /**
     * Creates a new Element instance.
     * @param {Object} node - The node object representing the element
     */
    constructor( node ){
        this.node = node;
    }


}

export default Element;
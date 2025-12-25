/**
 * DOM utility module providing helper functions for DOM manipulation and querying.
 * Simplifies common DOM operations like querying, event handling, and element inspection.
 * @module Dom
 */

/**
 * DomUtil class provides static utility methods for DOM operations.
 * Includes methods for element selection, sibling traversal, class checking, and visibility detection.
 * @class DomUtil
 * @example
 * DomUtil.first('.my-class') // returns first matching element
 * DomUtil.hasClass(element, 'active') // checks if element has class
 */
class DomUtil {

    /**
     * Gets the first element matching a selector.
     * @param {string} selector - CSS selector string
     * @param {Document|Element} [scope] - Optional scope to search within (defaults to document)
     * @returns {Element|null} The first matching element or null
     * @static
     * @example
     * DomUtil.first('.container') // returns first .container element
     */
    static first( selector, scope ){
        return ( document || scope ).querySelector(selector);
    }

    /**
     * Gets all elements matching a selector.
     * @param {string} selector - CSS selector string
     * @param {Document|Element} [scope] - Optional scope to search within (defaults to document)
     * @returns {NodeList} NodeList of matching elements
     * @static
     * @example
     * DomUtil.all('.item') // returns all .item elements
     */
    static all( selector, scope ){
        return ( document || scope ).querySelectorAll(selector);
    }

    /**
     * Checks if an element matching the selector exists.
     * @param {string} selector - CSS selector string
     * @param {Document|Element} [scope] - Optional scope to search within (defaults to document)
     * @returns {boolean} True if element exists
     * @static
     * @example
     * DomUtil.exists('.modal') // returns true if .modal element exists
     */
    static exists( selector, scope ){
        return ( document || scope ).querySelector(selector) ? true : false;
    }

    /**
     * Gets all sibling elements of a given element.
     * @param {Element} element - The element to get siblings for
     * @returns {Array<Element>} Array of sibling elements (excludes the element itself)
     * @static
     * @example
     * DomUtil.siblings(myElement) // returns array of sibling elements
     */
    static siblings( element ){
        // for collecting siblings
        let siblings = []; 
        // if no parent, return no sibling
        if(!element.parentNode) {
            return siblings;
        }
        // first child of the parent node
        let sibling  = element.parentNode.firstChild;
    
        // collecting siblings
        while (sibling) {
            if (sibling.nodeType === 1 && sibling !== element) {
                siblings.push(sibling);
            }
            sibling = sibling.nextSibling;
        }
        return siblings;
    }

    /**
     * Iterates over elements, calling a function for each one.
     * The function is called with 'this' bound to the element.
     * @param {NodeList|Array<Element>} elements - Elements to iterate over
     * @param {Function} fn - Function to call for each element (receives element and index)
     * @static
     * @example
     * DomUtil.each(document.querySelectorAll('.item'), (el, i) => {
     *   console.log(el, i);
     * });
     */
    static each( elements, fn ){
        for( let i=0;i<elements.length;i++ ){
            fn.apply(elements[i], [elements[i], i]);
        }
    }

    /**
     * Checks if an element has a specific CSS class.
     * @param {Element} element - The element to check
     * @param {string} className - The class name to check for
     * @returns {boolean} True if element has the class
     * @static
     * @example
     * DomUtil.hasClass(myElement, 'active') // returns true if element has 'active' class
     */
    static hasClass( element, className ){
        return new RegExp('(\\s|^)' + className + '(\\s|$)').test(element.className);
    }

    /**
     * Adds an event listener to an element.
     * @param {Element} element - The element to attach listener to
     * @param {string} event - The event name (e.g., 'click', 'mouseover')
     * @param {Function} fn - The event handler function
     * @param {boolean} [bubble=false] - Whether to use event bubbling
     * @static
     * @example
     * DomUtil.on(myElement, 'click', handleClick);
     */
    static on( element, event, fn, bubble=false ){
        element.addEventListener( event, fn, bubble );
    }

    /**
     * Gets the bounding client rect of an element.
     * @param {Element} element - The element to get rect for
     * @returns {DOMRect} The bounding rectangle of the element
     * @static
     * @example
     * const rect = DomUtil.rect(myElement);
     * console.log(rect.top, rect.left, rect.width, rect.height);
     */
    static rect( element ){
        return element.getBoundingClientRect();
    }

    /**
     * Checks if an element's rect is visible in the viewport.
     * Element is considered visible if bottom is above viewport bottom and top is below viewport top.
     * @param {DOMRect} rect - The bounding rectangle to check
     * @returns {boolean} True if rect is visible in viewport
     * @static
     */
    static rectIsVisible( rect ){
        return rect.bottom < window.innerHeight && rect.top > 0;
    }

    /**
     * Checks if an element's rect is fully visible (any part) in the viewport.
     * @param {DOMRect} rect - The bounding rectangle to check
     * @returns {boolean} True if any part of rect is in viewport
     * @static
     */
    static rectIsFullyVisible( rect ){
        return rect.top < window.innerHeight && rect.bottom > 0;
    }
    
    /**
     * Checks if the pointer is over a specific element.
     * @param {Element} element - The element to check
     * @param {MouseEvent} e - The mouse event with clientX and clientY
     * @returns {boolean} True if pointer is over the element
     * @static
     */
    static pointerOverElement( element, e ){
        debug(document.elementsFromPoint(e.clientX, e.clientY));
        return document.elementsFromPoint(e.clientX, e.clientY).indexOf(element) !== -1;
    }

    /**
     * Checks if the pointer coordinates are within a bounding rectangle.
     * @param {DOMRect} rect - The bounding rectangle
     * @param {Object} param1 - Object with clientX and clientY properties
     * @param {number} param1.clientX - X coordinate of pointer
     * @param {number} param1.clientY - Y coordinate of pointer
     * @returns {boolean} True if pointer is within rect bounds
     * @static
     * @example
     * DomUtil.pointerOverRect(rect, {clientX: 100, clientY: 200})
     */
    static pointerOverRect( rect, { clientX: x, clientY: y } ){
        return rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y;
    }
}

export default DomUtil;
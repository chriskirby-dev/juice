/**
 * DomHelper provides utility methods for working with Chrome DevTools Protocol DOM data.
 * @module ChromeProtocol/Dom/Helper
 */

/**
 * Helper class for DOM-related operations in Chrome DevTools Protocol.
 * @class DomHelper
 */
class DomHelper {
    /**
     * Parses a flat attribute array into a key-value object.
     * Chrome DevTools Protocol returns attributes as [key1, value1, key2, value2, ...].
     * @param {Array} attributeArray - Flat array of alternating keys and values
     * @returns {Object} Object with attribute key-value pairs
     * @static
     * @example
     * DomHelper.parseAttributeArray(['id', 'myId', 'class', 'myClass'])
     * // Returns: { id: 'myId', class: 'myClass' }
     */
    static parseAttributeArray(attributeArray){
        return attributeArray.reduce((result, value, index, array) => {
            if (index % 2 === 0) {
                const property = value;
                const nextValue = array[index + 1];
                if (nextValue !== undefined) {
                    result[property] = nextValue;
                }
            }
            return result;
        }, {});
    }
}

export default DomHelper;
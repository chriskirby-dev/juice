/**
 * Clipboard utilities for copying text to system clipboard.
 * Provides methods to copy text and element content.
 * @module Client/Clipboard
 */

/**
 * Clipboard operations utility class.
 * @class Clipboard
 * @example
 * Clipboard.copy('Hello World');
 * Clipboard.copyElementText('#myElement');
 */
class Clipboard {

    /**
     * Copies text content from an element to clipboard.
     * Flashes element with color feedback on success.
     * @param {string|HTMLElement} element - Element or selector
     * @returns {Promise<void>} Resolves on success, rejects on failure
     * @static
     */
    static copyElementText( element ){
        if( typeof element == 'string' ){
            element = document.querySelector(element);
        }
        const text = element.textContent.trim();
        return new Promise(( resolve, reject ) => {
            if(this.copy(text)){
                app.fx.colorFlash( element, app.color.green );
                resolve();
            }else{
                reject();
            }
        });
        
    }

    /**
     * Copies text to clipboard using execCommand.
     * Creates temporary textarea to perform copy operation.
     * @param {string} text - Text to copy
     * @returns {boolean} True if copy succeeded
     * @static
     */
    static copy( text ){

        var textArea = document.createElement("textarea");
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = 0;
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            var msg = successful ? 'successful' : 'unsuccessful';
            app.log('Copying text command was ' + msg);
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            app.log('Oops, unable to copy');
            return false;
        }

    }
}

export default Clipboard;
class Selector {

    query = {
        make( element ){

            if (!(element instanceof Element)) {
                console.error('Invalid element provided.');
                return null;
            }
        
            // Check if the element has an ID
            if (element.id) {
                return `#${element.id}`;
            }
        
            // Check if the element has a unique class
            const uniqueClass = Array.from(element.classList).find((cls) => document.getElementsByClassName(cls).length === 1);
            if (uniqueClass) {
                return `.${uniqueClass}`;
            }
        
            // Check for a common parent with similar siblings
            const siblings = Array.from(element.parentNode.children);
            const similarSiblings = siblings.filter((sibling) => sibling.tagName === element.tagName);
            
            if (similarSiblings.length > 1) {
                const index = similarSiblings.indexOf(element) + 1;
                return `${element.tagName}:nth-child(${index})`;
            }
        
            // Use :is() pseudo-class with tag name and attributes
            const tagName = element.tagName.toLowerCase();
            const attributes = Array.from(element.attributes).map(attr => `[${attr.name}="${attr.value}"]`).join('');
            return `${tagName}${attributes}`;
        }
    };

    xpath = {

        make( element ){

            if (!element) {
                return '';
            }
        
            if (element.id !== '') {
                // If the element has an ID, use it for the XPath
                return 'id("' + element.id + '")';
            }
        
            // Build the XPath by traversing the DOM hierarchy
            const parts = [];
            while (element.parentNode) {
                let index = 1;
                let sibling = element;
                while (sibling.previousElementSibling) {
                    sibling = sibling.previousElementSibling;
                    index++;
                }
                const tagName = element.tagName.toLowerCase();
                const part = `${tagName}[${index}]`;
                parts.push(part);
                element = element.parentNode;

            }
        
            // Reverse the parts array to get the full XPath
            return '/' + parts.reverse().join('/');
        },

        get( xpath ){
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                
            if (result && result.singleNodeValue) {
                return result.singleNodeValue;
            } else {
                console.error('Element not found for the given XPath:', xpath);
                return null;
            }
        }
    };

}


class DomUtil {

    static first( selector, scope ){
        return ( document || scope ).querySelector(selector);
    }

    static all( selector, scope ){
        return ( document || scope ).querySelectorAll(selector);
    }

    static exists( selector, scope ){
        return ( document || scope ).querySelector(selector) ? true : false;
    }

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

    static each( elements, fn ){
        for( let i=0;i<elements.length;i++ ){
            fn.apply(elements[i], [elements[i], i]);
        }
    }

    static hasClass( element, className ){
        return new RegExp('(\\s|^)' + className + '(\\s|$)').test(element.className);
    }

    static on( element, event, fn, bubble=false ){
        element.addEventListener( event, fn, bubble );
    }

    static rect( element ){
        return element.getBoundingClientRect();
    }

    static rectIsVisible( rect ){
        return rect.bottom < window.innerHeight && rect.top > 0;
    }

    static rectIsFullyVisible( rect ){
        return rect.top < window.innerHeight && rect.bottom > 0;
    }
    
    static pointerOverElement( element, e ){
        debug(document.elementsFromPoint(e.clientX, e.clientY));
        return document.elementsFromPoint(e.clientX, e.clientY).indexOf(element) !== -1;
    }

    static pointerOverRect( rect, { clientX: x, clientY: y } ){
        return rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y;
    }
}

export default DomUtil;
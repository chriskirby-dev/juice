class DomEvent {

    bind( elements, event, eventFn, useCapture=false ){
        if(typeof elements !== 'array') elements = [elements];
        for(let i=0;i<elements.length;i++){
            elements[i].addEventListener( event, eventFn, useCapture );
        }
    }

    unbind( elements, event, eventFn ){
        if(typeof elements !== 'array') elements = [elements];
        for(let i=0;i<elements.length;i++){
            elements[i].removeEventListener( event, eventFn );
        }
    }

}

export default DomEvent;
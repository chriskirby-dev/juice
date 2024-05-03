class Clipboard {

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
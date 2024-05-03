import Browser from './Browser.mjs';
import Cookies from './Cookies.mjs';
import Window from './Window.mjs';
import OS from './OS.mjs';
import Clipboard from './Clipboard.mjs';

class Client {

    static defined = {};

    static get clipboard(){
        return this.defined.clipboard || ( this.defined.clipboard = Clipboard );
    }

    static get browser(){
        return this.defined.browser || ( this.defined.browser = Browser );
    }

    static get cookies(){
        return this.defined.cookies || ( this.defined.cookies = new Cookies() );
    }

    static get window(){
        return this.defined.window || ( this.defined.window = Window );
    }

    static get os(){
        return this.defined.OS || ( this.defined.OS = OS );
    }

}

export default Client;
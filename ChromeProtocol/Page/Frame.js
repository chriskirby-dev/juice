import EventEmitter from 'events';
import ChromeProtocol from '../ChromeProtocol.js';

class Frame extends EventEmitter {


    data;
    page;

    constructor(data, page){
        super();
        this.page = page;
        this.map = data;
        this.cdp = new ChromeProtocol();

        this.frame = this.mainFrame.frames.filter( frame => frame.routingId == this.id );
     
    }

    get mainFrame(){
        return this.page.cdp.viewport.webContents.mainFrame;
    }

    get id(){
        return this.map.frame.id;
    }

    get mimeType(){
        return this.map.frame.mimeType;
    }

    get url(){
        return this.map.frame.url;
    }

    inject( script ){
        this.frame.executeJavaScript( script );
    }

    get children(){
        return this.map.children;
    }

    child(i){
        return this.children[i] ? new Frame(this.children[i]) : null;
    }
}

export default Frame;

class PageFrames {

}
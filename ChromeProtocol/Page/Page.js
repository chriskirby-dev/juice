
import DomainWrapper from '../DomainWrapper.js';
import Frame from './Frame.js';

class Page extends DomainWrapper {

    static uses = ['Page', 'Runtime', 'Dom' ];
    map = { frames: {} };

    document;

    injectGlobally( javascript ){
        const top = this.page.cdp.viewport.webContents.mainFrame;
        top.executeJavaScript(javascript);
        top.frames.forEach( frame => {
            frame.executeJavaScript(javascript);
        });
    }

    focus(){
        const { Page } = this.domains;
        Page.bringToFront();
    }

    screenshot( format, quality, clip ){
        const { Page } = this.domains;
        return Page.captureScreenshot({ format, quality, clip });
    }

    close(){
        const { Page } = this.domains;
        Page.close();
    }

    navigate( url, referrer, frameId ){
        const { Page } = this.domains;
        Page.navigate({ url });
    }

    getFrame(frameId){
        if(!frameId){
            return new PageFrame( this.frames.frame, this );
        }else{
            return this.map.frames[frameId] ? new PageFrame( this.map.frames[frameId], this ) : null;
        }
    }

    async getFrames(){
        const self = this;
        this.map.frames = {};
        function composeFrames( frame, children=[] ){
            self.map.frames[frame.id] = frame;
            return {
                frame,
                children: children.map( child =>  composeFrames( child.frame, child.childFrames ) )
            }
        }
        const { Page } = this.domains;
        const { frameTree } = await Page.getFrameTree();
        return composeFrames( frameTree.frame, frameTree.childFrames );
    }

    async getLayout(){
        const { Page } = this.domains;
        const { cssLayoutViewport, cssVisualViewport, cssContentSize } = await Page.getLayoutMetrics();
        return { 
            viewport: {
                visual: cssVisualViewport,
                layout: cssLayoutViewport
            },
            content: cssContentSize
        }
    }

    async details(){
        const layout = await this.getLayout();
        this.layout = layout;
        const frames = await this.getFrames();
        this.frames = frames;

        debug('layout', layout);
        debug('frames', frames);
    }

    eachFrame( fn ){
        fn(this.frames.top);
        this.frames.children.forEach( fn );
    }

    async initialize(){

        const { Page, Runtime, Dom } = this.domains;

        const frameNameToFrameId = {};
        const frameIdToContextId = {};
        let frameWaitPromiseResolve = null;

        await this.details();

        Page.frameNavigated((params) => {
            const { name, id } = params.frame;
            if(name) frameNameToFrameId[name] = id;

            this.details();

            // were we waiting for this frame to be loaded?
            if (frameWaitPromiseResolve && frameWaitName === name) {
                frameWaitPromiseResolve();
                frameWaitPromiseResolve = null;
            }
        });

        Runtime.executionContextCreated(info => {
            frameIdToContextId[info.context.auxData.frameId] = info.context.id;
        });
        
        Runtime.executionContextDestroyed(info => {
            for (let frameId in frameIdToContextId) {
                if (frameIdToContextId[frameId] == info.executionContextId) {
                    delete frameIdToContextId[frameId];
                    break;
                }
            }
        });

        Page.domContentEventFired(() => {
            
        });

        Page.frameAttached(info => {
            const {frameId, parentFrameId, stack } = info;
        });

        Page.frameDetached(info => {
            const { frameId, reason } = info;
        });

        
        
    }
}

export default Page;
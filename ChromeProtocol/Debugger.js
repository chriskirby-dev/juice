import DomainWrapper from "./DomainWrapper.js";

class Debugger extends DomainWrapper {

    static uses = ['Page', 'DOMDebugger', 'Debugger', 'Runtime'];

    breakpoints = {};

    async clickListener(){

        await this.isReady();

        const { Runtime } = this.domains;

        this.setBreakpoint('click');

        this.cdp.viewport.webContents.executeJavaScript(`
            window.addEventListener('click', function clickListener(e){
                const target = e.target;
                const id = target.id;
                const className = target.className;
                const name = target.name;
                const point = { x: e.clientX, y: e.clientY };
                const rect = target.getBoundingClientRect();
                console.log('click', id, name, point, rect );
                cdp.send({ id, className, name, point });
            });
            console.log('Click Listener Injected');
        `);

        debug('executeJavaScript');
    }

    async setBreakpoint( eventName, targetName='*' ){
        //debug('setBreakpoint', eventName, targetName);
        await this.isReady();
        const { DOMDebugger } = this.domains;
        // Set a breakpoint on a DOM node with given id.
        await DOMDebugger.setEventListenerBreakpoint({
            eventName, 
            targetName
        });
    }

    async setDomBreakpoint( eventName, targetName='*' ){
        //debug('setBreakpoint', eventName, targetName);
        await this.isReady();
        const { DOMDebugger } = this.domains;
        // Set a breakpoint on a DOM node with given id.
        await DOMDebugger.setDOMBreakpoint({
            eventName, 
            targetName
        });
    }

    initialize(){
        //debug('Debug init');
        const { Debugger } = this.domains;

        Debugger.paused((params) => {
            // breakpoint hit
            debug('BREAKPOINT', params);
            this.emit('breakpoint', params);
        })

        Debugger.breakpointResolved((params) => {
            //debug('BREAKPOINT ADDED', params);
        });

        this.client.on('event', (message) => {
            debug(message);
        })

        return;
    }
}
export default Debugger;
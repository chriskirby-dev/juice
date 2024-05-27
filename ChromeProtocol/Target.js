import DomainWrapper from "./DomainWrapper.js";

class Target extends DomainWrapper {

    static uses = ['Target'];

    attach( targetId ){
        this.cdp.connect(targetId)
    }

    detach(){

    }

    attachRelated(){
        
    }

    exposeDevtools(){
        const { Target } = this.domains;
        Target.exposeDevToolsProtocol({ targetId: this.cdp.targetId });
        debug('exposeDevToolsProtocol',{ targetId: this.cdp.targetId });
        this.exposed = true;
    }

    discover(){
        const { Target } = this.domains;

        Target.on('targetCreated', ({ targetInfo }) => {
            debug(targetInfo);
        });

        Target.on('targetDestroyed', ( targetId ) => {
            debug(targetId);
        });

        Target.setDiscoverTargets();
    }

    async all(){
        const { Target } = this.domains;
        const { targetInfos } = await Target.getTargets();
        return targetInfos;
    }

    async find( conditions={} ){
        const keys = Object.keys(conditions);
        const all = await this.all();
        return all.find((t) => keys.every( (k) => t.hasOwnProperty(k) && t[k] == conditions[k] ) )
    }

    initialize(){
        const {Target} = this.domains;

        return true;
    }
}

export default Target;
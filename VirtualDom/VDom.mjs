import { type, empty } from '../Util/Core.mjs';
import VirtualDom from './VirtualDom.mjs';
import VDomParser from './Parser.mjs';


/**
 * VDom 
 * @constructor
 * @param {*} content - HTML or VirtualDom object.
 * @param {*} options - Options object.
 */

class VDom{

    #references = {};
    html = '';
    tpl;
    vdom;
    dom;
    virtual;
    #staged = null;
    #rendered = null;

    constructor( content, options={}){

        this.options = options;

        if(options.container){
            this.container =  type(options.container, 'string') ? document.querySelector(options.container) : options.container;
            
        }

        if(options.scope){
            this.scope= options.scope;
        
        }

        this.tpl = document.createElement('template');
        this.rendered = document.createDocumentFragment();

        this.initialize();

        if(content) this.stage(content);

    }

    stage( content ){

        let vdom;

        if(empty(content)){
            this.#staged = { tag: 'div', attributes: {class: "vdom--container"}, children: []};
            return this.#staged;
        }

        switch( VDomParser.type( content ) ){
            case 'html':
            vdom = VDomParser.fromHTML(content);
            break;
            case 'text':
            vdom = VDomParser.fromText(content);
            break;
            case 'dom':
            vdom = VDomParser.fromDom(content);
            break;
            case 'vdom':
            vdom = content;
            break;

        };


       this.#staged = { tag: 'div', attributes: {class: "vdom--container"}, children: type(vdom, 'array') ? [...vdom] : [vdom] };

       return this.#staged;
    }

    //Add element to one or more references.

    addReference( element, ref=null ){
        if(!ref) return;
        const refs = ref.includes(',') ? ref.split(',').map(r => r.trim()) : [ref];
        refs.map( ref => {
            if( !this.#references[ref] ) this.#references[ref] = [];
            this.#references[ref].push(element);
        } );
    }

    hasRef(ref){
        return this.#references[ref] ? this.#references[ref].length : false;
    }

    refs(ref){
        return this.#references[ref] || [];
    }

    ref(ref){
        return this.#references[ref] && this.#references[ref][0] || null;
    }

    applyEventHandel( el, eventHandle ){
        const handles = [eventHandle];
        if(eventHandle.includes('||')) handles = eventHandle.split('||');

        handles.forEach((handler) => {
        
            const [event, call] = handler.split('::');
            debug(event, call);
            let args = [];
            if(handler.includes('(')){
                args = handler.split('(').pop().split(')').shift().split(',').map( arg => arg.replace(/['"]/g, '').trim() );
              //  debug(args);
                handler = handler.split('(').shift();
            }
            let handlerFn = this.scope[handler] ? this.scope[handler].bind(this.scope) : function(){};

            el.addEventListener(event, (e) => {
                const respArgs = args.map( arg => {
                    if( arg === 'this') return element;
                    if(typeof arg == 'string' && arg.indexOf('this.') === 0) return element[arg.replace('this.', '')];
                    return arg;
                });
                handlerFn = handlerFn.bind(self);
                return handlerFn( e, ...respArgs );
            });

            el.classList.add('events-set');
            
        });

        el.removeAttribute('event');
    
    }

    render( content ){
        if(content) this.stage(content);
        //Build new VDom from html
        if(!this.#staged) return false;

        //Create Patch for Current VDom with Staged VDom
        const patch = VirtualDom.diff( this.virtual, this.#staged );

        //Apply Patch
        patch( this.root );

        //Pull References from new dom
        const refs = this.rendered.querySelectorAll('[ref]');
        for(let i=0;i<refs.length;i++){
            const ref = refs[i].getAttribute('ref');
            this.addReference(refs[i], ref);
            refs[i].removeAttribute('ref');
        }

        const eventsEls = this.rendered.querySelectorAll('[event]');

        for(let i=0;i<eventsEls.length;i++){
            const el = eventsEls[i];
            const eventHandle = el.getAttribute('event');
            this.applyEventHandel(eventHandle);
            
        }


        this.virtual = this.#staged;
        this.#staged = null;

        //If container is set but not currently parent
        if(this.container && this.rendered.parentNode !== this.container){
            this.container.appendChild(this.rendered);
        }

        return this.rendered;
    }

    initialize(){

        this.stage('');
        this.virtual = this.#staged;

        const initDiv = document.createElement('div');
        initDiv.classList.add('vdom--container');
        this.container.appendChild(initDiv);
        this.root = initDiv;
    }
}

export default VDom;
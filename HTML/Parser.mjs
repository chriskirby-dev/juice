import {type} from '../Util/Core.mjs';
//const OPEN_TAG_REGEX = /<(.*)="(.*)\$\{(.*)\}(.*)\"(.*)/g;
const OPEN_TAG_REGEX = /<(.*)="(.*)\"(.*)>/g;

const ATTR_REGEX = /([^=\s]+)=["'](.*)\$\{([^}]+)\}(.*)["']/g;
const JS_LITERAL_TOKEN_REGEX = /\$\{(?:[^\}\{]+|\{(?:[^\}\{]+|\{[^\}\{]*\})*\})*\}/g;

export class ElementParser {

    static parse(el){
        if(type(el, 'string')){
            const tmp = document.createElement('template');
            tmp.innerHTML = el;
            el = tmp.content.cloneNode(true);
            tmp = null;
        }
        const parsed = {
            tag: el.tagName.toLowerCase(),
            attrs: this.attrs(el),
            children: this.children(el)
        }
        if( el.namespaceURI !== 'http://www.w3.org/1999/xhtml'){
            parsed.ns = el.namespaceURI;
        }
        return parsed;
    }

    static attrs(el){
        const attrs = {};
        for (var i = 0, atts = el.attributes, n = atts.length, arr = []; i < n; i++){
            attrs[atts[i].nodeName] = el.getAttribute(atts[i].nodeName);
        }
        return attrs;
    }

    static children( el ){
        const children = [];
        for (let i = 0; i < el.childNodes.length; i++) {
            children.push( this.parse( el.childNodes[i] ) );
        }
        return children;
    }
}

class HTMLParser {

    source;
    tags=[];

    constructor( source ){
        this.source = source;
        
    }

    attrs(el){
        const attrs = {};
        for (var i = 0, atts = el.attributes, n = atts.length, arr = []; i < n; i++){
            attrs[atts[i].nodeName] = el.getAttribute(atts[i].nodeName);
        }
        return attrs;
    }

    static parse( el ){
        return ElementParser.parse(el);
    }

}
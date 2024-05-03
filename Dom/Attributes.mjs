class DomAttributes {

    dom;
    #attributes = {};
    
    constructor( data={}, dom ){
        if(data) this.assign( data );
        if(dom) this.dom = dom;
        this.initialize();
    }

    bind( dom ){
        this.dom = dom;
    }

    toString(){
        const list = [];
        for( let prop in this.#attributes ){
            const value = this.#attributes[prop];
            if( value == null ){
                list.push( `${prop}`) ;
            }else{
                list.push( `${prop}="${this.#attributes[prop]}"`) ;
            }
        }
        return list.join(' ');
    }

    assign( data ){
        for( let prop in data ){
            this.set(prop, data[prop]);
        }
    }

    apply( el ){
        for( let prop in this.#attributes ){
            el.setAttribute( prop, this.#attributes[prop] );
        }
    }

    has( name ){
        return this.#attributes[name] ? true : false;
    }

    get( name ){
        return this.#attributes[name];
    }

    set( name, value=null ){
        this.#attributes[name] = value;
        if(this.dom) this.dom.setAttribute( name, value );
    }

    setMany(attrs){
        for(let prop in attrs){
            this.set(prop, attrs[prop]);
        }
    }


    static extract(source){
        const attrs = {};
        if( !source?.attributes ) return attrs;
        for (const attr of source.attributes) {
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }

    static copy( source, target ){
        for (const attr of source.attributes) {
            target.setAttribute(attr.name, attr.value);
        }
    }

    static toHTML(){
        
    }

    initialize(){
        if( this.dom && this.dom.attributes.length ){
            for( let i=0;i<this.dom.attributes.length;i++ ){
                this.set( this.dom.attributes[i].name, this.dom.attributes[i].value );
            }
        }
    }
}

export default DomAttributes;
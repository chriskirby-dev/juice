import { type } from '../Util/Core.mjs';
const TAB = '    ';

class ExpandableList {

    fromObject(object){
        return this.processObject(object);
    }

    constructor(list) {
        this.processList(list)
    }

    processValue(value){
        switch(type(value)){
            case 'object':
                const properties = [];
                for(let [key, value] of Object.entries(value)){
                    properties.push(this.processProperty(key, value));
                }
            break;
            case 'array':
                return this.processList(value);
            break;
            default:
                return value;
        }
    }

    processProperty( name, value, expanded = false ){
        value = this.processValue(value);
        return {
            tag: 'tr',
            children: [
                { tag: 'td', attributes: { class: 'collapsed' }, children: [name] },
                { tag: 'td', attributes: { class: 'collapsed' }, children: [value] }
            ]
        }
    }

    processList( node, parent ){
        if(!parent) parent = { tag: 'table', children: [] };
        if(type(node, 'object')){
            const properties = [];
            for(let [key, value] of Object.entries(value)){
                properties.push(this.processProperty(key, value));
            }
            parent.children.push(...properties);
        } 
        if(type(node, 'array')){
            return node.map( n => this.processList(n, parent))
        }
    }
}
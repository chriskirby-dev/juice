import { vElement, render } from "../VirtualDom/VirtualDom.mjs";
import { ucwords } from '../Util/String.mjs';
import { type } from '../Util/Core.mjs'

const InputTypes = {
    'text': ['string', 'varchar', 'txt'],
    'select': ['array', 'set', 'options'],
    'number': ['int', 'integer', 'num', 'decimal', 'float', 'real'],
    'date': ['date', 'datetime'],
    'textarea': ['json', 'longtext', 'content'],
    'hidden': ['password', 'hash', 'salt', 'token', 'key']
}

class FormBuilder {

    static parseName(name){
        return {
            name: name,
            id: `input--${name.replace(/\_/g, '-')}`,
            label: ucwords(name.replace(/[\_\[]/g, ' ').replace(']', ''))
        }
    }


    static typeFromSchema(schema={}){
        let type = 'text';
        console.log('SChema', schema);

        if( schema.readOnly ){
            type = 'hidden';
        }else
        if(Object.keys(InputTypes).includes(schema.type)){
            type = schema.type;
        }else{

            for(let inputType in InputTypes){
                if(InputTypes[inputType].includes(schema.type)){
                    type = inputType;
                }
            }

        }
        console.log(type);
        return type;
    }

    static  label( inputId, label ){

        return vElement('label', {
            for: inputId,
        }, [ucwords(label.replace(/\_/g, ' '))]);
    }

    static text( name, value, params={} ){
        name = this.parseName(name);
        const vdom = vElement('input', {
            id: name.id,
            type: params.type || 'text',
            name: name.name, 
            value: value
        });
        if(params.events) vdom.events = params.events;
        return vdom;
    }

    static  textarea( name, value, attributes,params ){
        name = this.parseName(name);
        if(type(value, 'object')) value = JSON.stringify(value, undefined, 4);
        const vdom = vElement('textarea', {
            id: name.id,
            name: name.name,
            ...attributes
        }, [value]);
       // if(params.events) vdom.events = params.events;
        return vdom;
    }
      

    static  hidden( name, value, params ){
        return this.text( name, value, { type: 'hidden' } );
    }

    static  date( name, value, params ){
        return this.text( name, value, { type: 'date' } );
    }

    static  number( name, value, params ){
        return this.text( name, value, { type: 'number' } );
    }

    static  select( name, value, options, params ){

        name = this.parseName(name);

        function makeOption(o){
            if(type(o, 'string')){
                o = { value: o, label: o };
            }
            return vElement('option', {
                value: o.value
            }, [o.label]);
        }

        const vdom = vElement('select', {
            id: name.id,
            name: name.name
        }, options.map(makeOption));

        if(params.events) vdom.events = params.events;
        
        return vdom;
    }

    radios(){

    }

    checkboxes(){

    }

    static build( inputs ){
        return render(inputs);
    }

    static buildFromSchema( schema={}, values={} ){
        const inputs = [];
        for(let property in schema ){
            const inputType = this.typeFromSchema( schema[property] );
            const pschema = schema[property];
            if(this[inputType]){
                const wrapper = { tag: 'form-input', children: [] };

                const args = [property, values[property] || ''];
                const params = {};
                if(pschema.options){
                    args.push(pschema.options);
                }
                args.push(params);
                const input = this[inputType]( ...args );
                console.log(input);
               if(inputType !== 'hidden') wrapper.children.push(this.label(input.attributes.id, property));
                wrapper.children.push(input);
                inputs.push(wrapper);
            
            }
        }

        return render(inputs);
    }
}

export default FormBuilder;
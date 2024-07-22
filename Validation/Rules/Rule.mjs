import RulePresets from '../Presets.mjs';
import Messages from '../Messages.mjs';
import { ValidationError } from '../Errors.mjs';

//Rule stores a single rule for a single property

class Rule {

    type;
    args = [];
    fn;
    value;
    property;
    scope;
    state = 'initial';
    status = 'initial';
    
    constructor( type, ...args ){
        this.type = type;
        this.args = args;
        if(RulePresets[type]) 
            this.fn = RulePresets[type];
    }

    msg( field ){
        this.field = field;
        return Messages.get( this );
    }

    message(){
        return Messages.get( this );
    }

    toError(){
        return new ValidationError( this );
    }

    test( value ){
        
        this.value = value; 
        this.status = 'testing';
        this.valid = false;
       // console.log('test', value, this );
        if(!this.fn){
            //If no function is set then the rule is valid
            this.state = 'tested';
            this.valid = true;
            return true;
        }
        //Support Promise Tests
        if(this.state == 'testing'){
            //If currently testing queue the value
            this.valid = null;
            this.queued = value;
            return true;
        }
        return new Promise((resolve, reject) => {
            //Call the rule validation function
            const result = this.fn( value, ...this.args );
            //debug(result);
            if(typeof result.then == 'function'){
                //Result is a promise
                result.then((resp) => {
                    resolve( resp.result );
                });
            }else if(typeof result == 'boolean'){
                //Result is a boolean
                resolve(result);
            }else{
                throw 'Validation Rule must return a boolean or a promise that resolves to a boolean'
            }
        }).then((result) => {
            //debug(this.property+': '+result);
            this.state = 'tested';
            this.valid = result;
            return result === true ? true : this.toError();
        });

    }
}


export default Rule;
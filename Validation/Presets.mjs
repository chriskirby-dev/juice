import Util from '../Util/Core.mjs';
import { EmailValidationError, PhoneValidationError, AddressValidationError, PostalValidationError, TypeValidationError, InvalidTimestamp, MinLengthError, MaxLengthError, NotEqualError, ValueRequiredError, InSetError } from './Errors.mjs';
import { empty } from '../Util/Core.mjs';

export const ERROR_TYPES = {
    email: EmailValidationError,
    phone: PhoneValidationError,
    address: AddressValidationError,
    postal: PostalValidationError,
    string: TypeValidationError,
    number: TypeValidationError,
    array: TypeValidationError,
    boolean: TypeValidationError,
    object: TypeValidationError,
    int: TypeValidationError,
    timestamp: InvalidTimestamp,
    min: MinLengthError,
    max: MaxLengthError,
    equals: NotEqualError,
    required: ValueRequiredError,
    in: InSetError
}

class Presets {

    static email( email ){
        //const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const re = /(\w\.?)+@[\w\.-]+\.\w{2,}/
        return re.test(String(email).toLowerCase());
    }

    static phone( phone ){
        const digits = phone.replace(/[\D\+\(\)]/g, "");
        var re = /[0-9]{10,14}$/;
        return re.test( digits );
    }

    static address(address){
        var re = /^[a-zA-Z0-9\s,.'-]{3,}$/i;
        return re.test( address );
    }

    static postal(postal){
        var re = /^[0-9]{5}(?:-[0-9]{4})?$/i;
        return re.test( postal );
    }

    static string(value){
        return Util.type( value, 'string');
    }

    static text(value){
        return Util.type( value, 'string');
    }

    static number( value ){
        return !isNaN( Number( value ) );
    }

    static array( arr ){
        return Util.type( arr, 'array');
    }

    static boolean( bool ){
        return Util.type( bool, 'boolean');
    }

    static object( o ){
        return Util.type( o, 'object');
    }

    static int( integer ){
        return Number.isInteger( Number(integer) );
    }

    static integer( integer ){
        return Presets.int(integer);
    }

    static timestamp( ts ){
        return (new Date(ts)).getTime() > 0;
    }

    static sha256( hash ){
        return this.string(hash) && hash.length == 64;
    }

    static equals( value, eq ){
        
        switch( Util.type( value ) ){
            case 'array':
                return value === eq;
            break;
            case 'object':
                return value === eq;
            break;
            case 'date':
                value.getTime() === eq.getTime();
            break;
            case 'boolean':

            break;
            default:
                return value === eq;
        }

        return true;
    }

    static max( value, max ){
        if(!value) return true;
        switch( Util.type( value ) ){
            case 'date':
                return Util.Date.parse( value ).getTime() <= Util.Date.parse( max ).getTime();
            break;
            case 'int':
                return parseInt(value) <= parseInt(max);
            break;
            case 'number':
                return Number(value) <= parseInt(max);
            break;
            case 'string':
                return value.trim().length <= parseInt(max);
            break;
            default:
            return value.trim().length >= parseInt(min);
        }
    }


    static min( value, min ){
        if(!value && parseInt(min) > 0) return false;
        switch( Util.type(value) ){
            case 'date':
                return Util.Date.parse( value ).getTime() >= Util.Date.parse( min ).getTime();
            break;
            case 'number':
                return Number(value) >= parseInt(min);
            break;
            case 'string':
                return value.trim().length >= parseInt(min);
            break;
            default:
            return value.trim().length >= parseInt(min);
        }
    }

    static length( value, min, max ){
       // console.log( value, min, max );
        if(!value) return false;
        const len = ""+(value && value.length);
        return len >= parseInt(min) && len <= parseInt(max);
    }

    static required( value ){
        return Presets.notEmpty(value);
    }

    static empty( value ){
        if( value === undefined || value === null || value == '' ) return true;
        switch( Util.type(value) ){
            case 'array':
                return value.length === 0;
            break;
            case 'object':
                return Object.keys(value).length === 0;
            break;
            case 'string':
                return value.trim() === "";
            break;
        }
    }

    static notEmpty( value ){
        return !Presets.empty(value);
    }

    static chars( value, ...chars ){
        const specChars = ['-',"'",'[', '\\', '^', '$', '.', '|', '?', '*', '+', '(', ')'];
        const allowed = chars.map( (char) => { return specChars.includes(char) ? '\\'+char : char })
        const regex = new RegExp(`^[${allowed.join('')}]+$`);
        return regex.test(value);
    }

    static null(value){
        return value === null;
    }

    static required_if( value, condition ){

    }

    static in(value, ...values){
        return values.includes(value);
    }

    
}

export default Presets;
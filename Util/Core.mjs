import ArrayUtil from "./Array.mjs";
import DateUtil from "./Date.mjs";
import StringUtil from "./String.mjs";
import ObjectUtil from "./Object.mjs";
import NumberUtil from "./Number.mjs";
import operators from "./Operators.mjs";

if(typeof window !== "object"){
    import('crypto').then((crpt) => {
        global.crypto = crpt.default;
    });
}
//import crypto from "crypto";

export function type(o, is_type) {
    if(is_type) is_type = is_type.toLowerCase();
    var t = Object.prototype.toString.call(o).split(' ').pop().replace(']', '').toLowerCase();
    if(is_type && is_type.charAt(0) == '!'){
        return is_type.substr(1) !== t;
    }
    return is_type ? is_type === t : t;
}

export function empty(val) {

    var empty = false;
    if (val === undefined || val === null || val === '' ) return true;
    
    switch (Util.type(val)) {
        case "string":
            return val.trim().length == 0;
        break;
        case "array":
            return val.length == 0;
        break;
        case "object":
            return Object.keys(val).length == 0;
        break;
        case "date":
        break;
        default: 
            empty = val === null || val === undefined;
    }

    return empty;
}

export function uuid(){
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );          
}

export function exists( item ){
    return item !== undefined;
}

export function equals( a, b ){
    return a === b;
}

class Util {

    static Array = ArrayUtil;
    static Date = DateUtil;
    static String = StringUtil;
    static Object = ObjectUtil;
    static Number = NumberUtil;
    static operators = operators;

    static type = type;

    static isArray( item ){
        return this.type( item, 'array' );
    }

    static isObject( item ){
        return this.type( item, 'object' );
    }

    static isNumber( item ){
        return this.type( item, 'number' );
    }

    static empty = empty;

    static uuid = uuid;

}


export default Util;

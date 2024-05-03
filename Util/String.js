const SEPERATOR = /[_-\s]/;


//PascalCase - First letter of every word capitalized
export function pascalCase(value){
    const parts = value.split(/[_-\s]/);
    return parts.map((part) => {
        return part.charAt(0).toUpperCase() + part.substr(1);
    }).join('');
}

export function studly( value ){
    const parts = value.split(/[_-]/);
    return parts.shift().toLowerCase() + ( parts.map((part) => {
        return part.charAt(0).toUpperCase() + part.substr(1);
    }).join('') );
}

export function unStudly(value){
    return value.replace(/[A-Z]/g, m => "_" + m.toLowerCase());
}

export function normalCase( value, seperator = '_' ){
    return value.replace(/[A-Z_-\s]/g, m => " " + m.toLowerCase()).trim().replace(' ', seperator );
}

export function camelCase( str ){
    const parts = str.split(/[_-\s]/);
    return parts.shift().toLowerCase() + ( parts.map((part) => {
        return part.charAt(0).toUpperCase() + part.substr(1);
    }).join('') );
}

export function toUpper( str ){
    return str.toUpperCase();
}

export function toLower( str ){
    return str.toLowerCase();
}

export function capitalize( str ){
    return str.charAt(0).toUpperCase() + str.substr(1);
}

export function sprintf( string, args ){
    var replacer = function(p,c){return p.replace(/%s/,c)};
    return args.reduce( replacer, string );
}

export function computize( value ){
    if(!value) return '';
    value = value.replace(/[\[\]]/g, '-')
    return value.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s/g, '-').toLowerCase();
}

export default {

};
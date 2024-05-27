class DotNotation {



    static find( path, scope ){
        return path.split('.').reduce((obj, key) => obj && obj[key] || undefined, scope);
    }
}

export default DotNotation;
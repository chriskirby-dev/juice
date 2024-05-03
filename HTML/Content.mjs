class Content {

    tpls = {};

    constructor( src ){

        this.source = src;

        const templateMatches = src.match(/<template\s*([^>]*)>([\s\S]*?)<\/template>/g);
        if(templateMatches){
            templateMatches.forEach( match => {

                let id = match.match(/id=["']([^"']+)["']/);
                if(id){
                    id = id[1];
                    const contentRegex = new RegExp(`<template\\b[^>]*>((.|[\\n\\r])*)<\\/template>`);
                    let content = match.match(contentRegex);
                    this.tpls[id] = content[1];
                }
            } );

        }

        this.html = src;
        
    }

    addTemplate( id, html ){

    }

    replaceTokens( data, content, internal ) {

        const varpattern=/\{\{([\w.]+)\}\}/g;
        const eachpattern=/\{each\{([\w.\-\>]+)\}\}/g;

        content = content || this.html;

        content = content.replace(varpattern, (match, token) => {
            const tokenValue = token.split('.').reduce((obj, key) => obj && obj[key] || '', data);
            return tokenValue !== undefined ? tokenValue : '';
        });

        content = content.replace(eachpattern, (match, tok) => {
            let html = "";
            const [token, tplid] = tok.split('->');
            if(this.tpls[tplid]){
                let tpl = this.tpls[tplid];

                const tokenValue = token.split('.').reduce((obj, key) => obj && obj[key] || '', data);

                if(Array.isArray(tokenValue)){
                    return tokenValue.map( item => this.replaceTokens( item, tpl.slice(0), true ) ).join(" \n");
                }else if(tokenValue !== undefined){
                    return this.replaceTokens( tokenValue, tpl.slice(0), true );
                }
            }
            return '';
        });

        return content;
    }
}

export default Content;
//data-tokattr="value::user.phone"

class Template {

    raw;
    html;

    constructor( raw, pattern ){
        this.raw = raw;
    }

    replaceTokens(data) {
        let html = this.raw;
        const regex = /\{\{([\w.]+)\}\}/g;
        this.html = html.replace(regex, (match, token) => {
            const tokenValue = token.split('.').reduce((obj, key) => obj && obj[key], data);
            return tokenValue !== undefined ? tokenValue : '';
        });
    }
}

export default Template;
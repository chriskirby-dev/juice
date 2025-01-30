export const words = (string) => string.split(/[\s\-_]/g);

export const toLower = (str) => str.toLowerCase();
export const toUpper = (str) => str.toUpperCase();

export const ucword = (string) => string.charAt(0).toUpperCase() + string.substr(1);
export const ucwords = (string) =>
    words(string)
        .map((word) => ucword(word))
        .join(" ");

export const replaceAll = (string, search, replace) => string.split(search).join(replace);

export const camelCase = (value) => {
    const parts = value.split(/[_-\s]/);
    return (
        parts.shift().toLowerCase() +
        parts
            .map((part) => {
                return part.charAt(0).toUpperCase() + part.substr(1);
            })
            .join("")
    );
};

//Change to Pascal case (first wortd lower remaining words capitalxxcs)
export const pascalCase = function (value) {
    const parts = value.split(/[_-\s]/);
    return parts
        .map((part) => {
            return part.charAt(0).toUpperCase() + part.substr(1);
        })
        .join("");
};

export const unPascal = function (value, seperator = "_") {
    return value
        .replace(/[A-Z]/g, (m) => " " + m.toLowerCase())
        .trim()
        .replace(" ", seperator);
};

export const studly = function (value) {
    const parts = value.split(/[_-]/);
    return (
        parts.shift().toLowerCase() +
        parts
            .map((part) => {
                return part.charAt(0).toUpperCase() + part.substr(1);
            })
            .join("")
    );
};

export const unStudly = function (value) {
    return value.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
};

export function normalCase(value, seperator = "_") {
    return value
        .replace(/[A-Z_-\s]/g, (m) => " " + m.toLowerCase())
        .trim()
        .replace(" ", seperator);
}

export function dashed(value) {
    let dashed = value.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    return dashed.charAt(0) == "-" ? dashed.slice(1) : dashed;
}

export default {
    upper: toUpper,
    lower: toLower,

    seperators() {
        return ["-", "_", " "];
    },

    words,

    ucword,

    ucwords,

    replaceAll,

    tpl(string, args) {
        var replacer = function (p, c) {
            return p.replace(/%s/, c);
        };
        return args.reduce(replacer, string);
    },

    sprintx(string, args = [], tokens = []) {
        let out = string;
        for (let i = 0; i < args.length; i++) {
            out = out.replace(`%${tokens[i]}...`, args[i].join(", "));
            const replacer = function (p, c) {
                return p.replace(`%${tokens[i]}`, c);
            };
            out = args[i].reduce(replacer, out);
        }
        return out;
    },

    sprintf(string, args) {
        const tokens = [...args];
        var replacer = function (p, c) {
            args.shift();
            return p.replace(/%s/, c);
        };
        return tokens.reduce(replacer, string);
    },

    sprintMake(string, args) {
        var replacer = function (p, c) {
            return p.replace(c, "%s");
        };
        return args.reduce(replacer, string);
    },

    pascalCase,

    unPascal,

    studly,

    unStudly,

    camel(value) {
        const parts = value.split(/[_-\s]/);
        return (
            parts.shift().toLowerCase() +
            parts
                .map((part) => {
                    return part.charAt(0).toUpperCase() + part.substr(1);
                })
                .join("")
        );
    },

    dashed(value) {
        let dashed = value.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
        return dashed.charAt(0) == "-" ? dashed.slice(1) : dashed;
    },

    computize(value) {
        if (!value) return "";
        value = value.replace(/[\[\]]/g, "-");
        return value
            .replace(/[^a-zA-Z0-9 -]/g, "")
            .replace(/\s/g, "-")
            .toLowerCase();
    },
};

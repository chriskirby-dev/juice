import Attributes from "../Dom/Attributes.mjs";
import fs from "fs";
import path from "path";
import { relink } from "./Relink.mjs";
import { isRelative, resolve } from "../Util/Path.mjs";

const REGEX = {
    tag: /\{(?:([a-z]*)(?:[\(]*)([^\)]*)(?:[\)]*)*)\{([\s\S]*?)\}\}/,
    includes: /\{include\(([^)]*)\)\{([^\}]*)\}\}/g,
    templates: /\{template (\w+)\{"([^"]+)"\}\}/g,
    natives: /<template\s*([^>]*)>([\s\S]*?)<\/template>/g,
    each: /\{([a-z]+)([\sa-z]*)\{([^\}]+)\}\}/g,
    vars: /\{\{([\s\S]*?)\}\}/g,
    layout: /\{layout\(([^)]*)\)\{([^\}]*)\}\}/g,
};

const TOKENIZER_CACHE = {};

const tokenizerCache = {};

class Tokenizer {
    data;
    source = "";
    tokenized;
    children = [];
    cache = {};
    rootPath = "/";
    templates = {};
    parent;
    incIndex = 0;
    count = 0;

    static parseRawToken(raw) {
        console.log(raw);
        const result = raw.match(REGEX.tag);
        console.log(result);
        const [token, type, _args, key] = result;

        //Split Args seperated by comma(,) trim items and filter out empty
        const args = _args
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a !== "");

        const _token = {
            raw: { token, args },
            type,
            key,
            args: args,
            value: null,
        };

        switch (type) {
            case "each":
                const [name, tpl] = key.split("->");
                _token.key = name;
                _token.templateId = tpl;
                break;
        }

        return _token;
    }

    constructor(string, data, options = {}) {
        console.log(data, options);
        if (options.root) {
            this.rootPath = options.root;
            console.log("TOKENIZER ROOT", this.rootPath);
        }
        this.options = options;
        this.use(string, data);
    }

    load(loc) {
        console.log(this.rootPath, loc);
        if (loc.startsWith("http")) {
            return fetch(loc).then((res) => res.text());
        } else if (loc.startsWith("file://")) {
            loc = loc.replace("file://", "");
        } else if (loc.startsWith("/")) {
        } else {
            loc = path.resolve(this.rootPath, loc);
        }
        const content = fs.readFileSync(loc, "utf8");
        return content;
    }

    parseRawToken(raw) {
        const token = Tokenizer.parseRawToken(raw);
        token.index = this.tokens.length;
        this.tokens.push(token);
        return token;
    }

    /**
     * Parse raw token chain key or keys ex. (key||key)
     * @param {*} rawToken
     * @returns {*} value
     */

    parseToken(rawToken) {
        const FALLBACK_SEPERATOR = "||";
        const ENCAPSULATED = /\w+\(.*?\)/;
        const tokenChain = rawToken.includes(FALLBACK_SEPERATOR) ? rawToken.split(FALLBACK_SEPERATOR) : [rawToken];
        let tokenValue;
        while (tokenChain.length && !tokenValue) {
            const key = tokenChain.shift();
            tokenValue = this.getKeyValue(key);
        }
        return tokenValue || "";
    }

    use(string, data) {
        this.source = string;
        if (data) this.data = data;
        this.prepare();
        return this.tokenized;
    }

    with(data = {}) {
        this.data = data;
    }

    relink(targetDir) {
        console.log("RELINK", targetDir);
        this.tokenized = relink(this.tokenized, targetDir, this.rootPath);
    }

    getKeyValue(token) {
        const { data } = this;
        const IS_JSON = /(?:^|,)\s*"(?<key>[^"]+)"\s*:\s*["'](?<value>[^"]*)["']\s*/;
        const IS_STRING = /['"]([^'"]+)['"]/g;
        if (IS_JSON.test(token)) return JSON.parse(`{ ${token} }`);
        if (IS_STRING.test(token)) return token.replace(/['"]/g, "");
        if (token == "@counter") {
            return this.count;
        } else if (token == "@incr") {
            this.count++;
            return this.count;
        } else if (token == "@unique") {
            return Math.random().toString(36).substring(7);
        } else if (token == "@incIndex") {
            return this.incIndex;
        } else if (token == "@data") {
            return this.data;
        } else if (token == "@json") {
            return JSON.stringify(this.data, null, 4);
        }
        return token.split(".").reduce((obj, key) => {
            return obj && obj[key];
        }, data);
    }

    render(data) {
        const { tokens, tokenized } = this;
        if (data) this.data = data;
        let content = tokenized;

        tokens.forEach((token) => {
            let tokenValue;

            if (token.key) {
                tokenValue = this.parseToken(token.key);
            }

            switch (token.type) {
                case "include":
                    let tokenizer;
                    const ipath = this.getKeyValue(token.args[0]);
                    const incPath = path.resolve(this.rootPath, ipath);
                    console.log(incPath);
                    this.incIndex++;
                    if (TOKENIZER_CACHE[incPath]) {
                        tokenizer = TOKENIZER_CACHE[incPath];
                    } else {
                        const src = fs.readFileSync(incPath, "utf8");
                        tokenizer = new Tokenizer(
                            src,
                            { ...this.data },
                            {
                                root: path.dirname(incPath),
                            }
                        );
                        TOKENIZER_CACHE[incPath] = tokenizer;
                    }
                    token.value = tokenizer.render(tokenValue);
                    break;
                case "native":
                    token.value = token.raw;
                    break;
                case "each":
                    if (tokenValue) {
                        const tokenizer = this.templates[token.templateId];
                        token.value = tokenValue
                            .map((item) => {
                                return tokenizer.render(item);
                            })
                            .join("");
                    }
                    break;
                default:
                    token.value = tokenValue;
            }
            // console.log(token);
            content = content.replace(`[TOKEN[${token.index}]]`, token.value);
        });

        if (this.parent) {
            this.parent.tokenizer.set("content", content);
            content = this.parent.tokenizer.render();
        }

        return content;
    }

    set(property, value) {
        this.data[property] = value;
    }

    prepare() {
        this.tokens = [];

        if (REGEX.layout.test(this.source)) {
            console.log("HAS LAYOUT");
            this.source = this.source.replace(REGEX.layout, (raw, path, params) => {
                let _path = path.replace(/[\"\']/g, "");
                if (isRelative(_path)) _path = resolve(this.rootPath, _path);
                const _dir = _path.substring(0, Math.max(_path.lastIndexOf("/"), _path.lastIndexOf("\\")));
                const _contents = this.load(_path);
                const _tokenizer = new Tokenizer(_contents, JSON.parse(`{ ${params} }`), { root: _dir });
                _tokenizer.relink(this.rootPath);
                this.parent = {
                    dir: _dir,
                    tokenizer: _tokenizer,
                };
                return "";
            });
        }

        let src = this.source.replace(REGEX.natives, (raw, attributes, contents) => {
            let id = raw.match(/id=["']([^"']+)["']/)[1];
            const tokenizer = new Tokenizer(contents);
            const token = {
                elementId: id,
                index: this.tokens.length,
                type: "native",
                raw: raw,
                value: null,
                render(data) {
                    const content = tokenizer.render(data);
                    this.value = content;
                    return content;
                },
                tokenizer: tokenizer,
            };
            this.templates[id] = tokenizer;
            this.tokens.push(token);
            return `[TOKEN[${token.index}]]`;
        });

        src = src.replace(REGEX.includes, (raw, path, contents) => {
            const token = this.parseRawToken(raw);
            return `[TOKEN[${token.index}]]`;
        });

        const matches = [];
        this.tokenized = src.replace(REGEX.groups, (match, ...captures) => {
            const token = this.parseRawToken(match);
            return `[TOKEN[${token.index}]]`;
        });

        this.tokenized = this.tokenized.replace(REGEX.each, (match, ...captures) => {
            const token = this.parseRawToken(match);
            return `[TOKEN[${token.index}]]`;
        });

        this.tokenized = this.tokenized.replace(REGEX.vars, (match, tok) => {
            console.log(match, tok);
            const token = {
                raw: { token: match, args: [] },
                type: "var",
                key: tok,
                args: [],
                value: null,
            };
            token.index = this.tokens.length;
            this.tokens.push(token);
            return `[TOKEN[${token.index}]]`;
        });

        this.captures = matches;
        //console.log( this.tokenized);

        return this.tokenized;
    }
}

export default Tokenizer;

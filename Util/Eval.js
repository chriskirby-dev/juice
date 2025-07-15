export const operators = {
    relational: ["<", ">", "<=", ">=", "==", "===", "!=", "!=="],
    arithmetic: ["+", "-", "*", "/", "%"],
    assignment: ["=", "+=", "-=", "*=", "/=", "%="],
    incremental: ["++", "--"],
    bitwise: ["&", "|", "^", "~", ">>", "<<", ">>>"],
    logical: ["!", "&&", "||"],
    conditional: ["?:"],
    ternary: ["?"]
};

export function safeEval(string, tokens = {}) {
    try {
        const result = new Function("tokens", prepareTokensInString(string));
        return result(tokens);
    } catch (e) {
        console.error(e);
        return null;
    }
}

export function findTokensInString(string, tokens = {}) {
    const found = [];
    Object.keys(tokens).forEach((token) => {
        if (string.indexOf(token) === -1) return;
        const idx = string.indexOf(token);
        if (["", " "].includes(string.charAt(idx - 1)) && ["", " ", "."].includes(string.charAt(idx + token.length))) {
            if (!found.includes(token)) found.push(token);
        }
    });
    return found;
}

export function prepareTokensInString(string, tokens = {}) {
    Object.keys(tokens).forEach((token) => {
        if (string.indexOf(token) === -1) return;
        const idx = string.indexOf(token);
        if (["", " "].includes(string.charAt(idx - 1)) && ["", " ", "."].includes(string.charAt(idx + token.length))) {
            string = string.replace(token, `tokens.${token}`);
        }
    });
    return string;
}

export function evalStatement(string, variables = {}) {
    return safeEval(string, variables);
}

export default {
    safeEval,
    findTokensInString,
    prepareTokensInString,
    evalStatement
};

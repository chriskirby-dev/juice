import DotNotation from "./DotNotation.mjs";

//Compareison Operators

export const operators = {
    "==": "equal",
    "!=": "notEqual",
    "===": "is",
    "!==": "isNot",
    "<": "lessThan",
    "<=": "lessThanOrEqual",
    ">": "greaterThen",
    ">=": "greaterThenOrEqual",
};

export function equal(a, b) {
    return a == b;
}

export function notEqual(a, b) {
    return a != b;
}

export function is(a, b) {
    return a === b;
}

export function isNot(a, b) {
    return a !== b;
}

export function lessThan(a, b) {
    return a < b;
}

export function lessThanOrEqual(a, b) {
    return a < b;
}

export function greaterThen(a, b) {
    return a >= b;
}

export function greaterThenOrEqual(a, b) {
    return a >= b;
}

class Assert {
    static operators = operators;

    static equal = equal;
    static notEqual = notEqual;
    static is = is;
    static isNot = isNot;
    static lessThanOrEqual = lessThanOrEqual;
    static greaterThenOrEqual = greaterThenOrEqual;
    static lessThen = lessThan;
    static greaterThen = greaterThen;

    static isLocation(input) {
        // Regular expressions to match paths and URLs
        const urlOrPathRegex =
            /^(?:https?:\/\/|ftp:\/\/|file:\/\/|www\.)|(?:\/|[a-zA-Z]:\\|(?:\.{1,2}\/)+|(?:\.{1,2}\\)+|(?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)|(?:\.{1,2}\/(?:\w+\/)*\w+\.\w+)$/;
        const lines = input.trim().split("\n");
        if (urlOrPathRegex.test(input) && lines.length == 1) {
            return true;
        } else {
            return false;
        }
    }

    static scopedCondition(string, scope) {
        const compareOperators = Object.keys(Assert.operators);
        const parts = string.split(/[\s]+/);
        let value1 = parts.shift(),
            operator = parts.shift(),
            value2 = parts.shift();

        const compareName = Assert.operators[operator];

        const values = [value1, value2].map((v) => {
            if ([`'`, `"`].includes(v.trim().charAt(0))) {
                //Is string
                return v.trim().replace(/^['"]|['"]$/g, "");
            } else if (DotNotation.find(v, scope)) {
                //Is Path
                return DotNotation.find(v, scope);
            }
            return undefined;
        });

        return Assert[compareName](...values);
    }

    static scopedConditional(string, scope) {
        let result = false;
        const OR = string.split("||");

        OR.forEach((statement) => {
            statement.split("&&").forEach((statement) => {});
        });
        //.split.split(' ').forEach(
    }
}

export default Assert;

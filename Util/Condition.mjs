export function isNull(value) {
    return value === null;
}

export function isTrue(value) {
    return value === true;
}

export function isFalse(value) {
    return value === false;
}

export function falseish(value) {
    return ["false", "null", "undefined", "0", "-0", "NaN", "0n", "-0n", false, null, undefined].includes(str);
}

export function truish() {}

export function type(o, is_type) {
    if (is_type) is_type = is_type.toLowerCase();
    var t = Object.prototype.toString.call(o).split(" ").pop().replace("]", "").toLowerCase();
    if (is_type && is_type.charAt(0) == "!") {
        return is_type.substr(1) !== t;
    }
    return is_type ? is_type === t : t;
}

export function empty(val) {
    var empty = false;
    if (val === undefined || val === null || val == "") return true;

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
    }
    return empty;
}

export function notEqual(...args) {
    const src = args[0];
    return args.some((item) => item !== src);
}

export function equal(a, b) {
    const t = type(a);
    if (type(b) !== t) return false;
    switch (t) {
        case "array":
            return a.length === b.length && a.every((item, index) => equal(item, b[index]));
            break;
        case "object":
            return (
                Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((key) => equal(a[key], b[key]))
            );
            break;
        case "date":
            return a.getTime() === b.getTime();
            break;
        case "function":
            return true;
            break;
        default:
            return a === b;
    }
}

export function isEqual(...args) {
    const src = args[0];
    return args.every((item) => equal(item, src));
}

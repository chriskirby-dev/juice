export function parseString(string) {
    const parse = {};
    parse.args = string
        .split("(")
        .pop()
        .split(")")
        .shift()
        .split(",")
        .map((arg) => arg.replace(/['"]/g, "").trim());
}

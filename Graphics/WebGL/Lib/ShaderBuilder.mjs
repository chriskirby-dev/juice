class ShaderBuilder {
    head = [];
    definitions = [];
    main = [];
    functions = [];
    structs = [];
    precision = null;

    constructor(version = 2) {
        this.version = version;
    }

    setPrecision(precision, dataType) {
        this.precision = `precision ${precision.toLowerCase()}p ${dataType};`;
    }

    addHeader(header) {
        this.head.push(header);
    }

    define(qualifier, name, type) {
        this.definitions.push(`${qualifier} ${type} ${name};`);
    }

    addMain(code) {
        this.main.push(code);
    }

    addFunction(returnType, name, args, code) {
        this.functions.push(`//Function: ${name} \n${returnType} ${name}(${args.join(", ")}) {\n ${code} \n}`);
    }

    addStruct(name, fields) {
        this.definitions.push(`struct ${name} { 
             ${fields.join(";\n ")};
         };`);
    }

    build() {
        const code =
            (this.version === 1 ? "#version 100" : "#version 300 es") +
            `
            ${this.precision ? this.precision : ""}
            ${this.structs.join("\n")}
        \n${this.functions.join("\n\n")}
        \n${this.head.length ? this.head.join("\n") : ""}   

        \n${this.definitions.join("\n")}

        \nvoid main() {\n${this.main.join("\n")} \n}
    `;
        // debug logs removed for performance
        return code;
    }
}

export default ShaderBuilder;
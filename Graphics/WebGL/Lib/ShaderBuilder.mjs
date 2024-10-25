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
        this.functions.push(`${returnType} ${name}(${args.join(", ")}) { ${code} }`);
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
        ${this.functions.join("\n")}
        ${this.head.length ? this.head.join("\n") : ""}   

        ${this.definitions.join("\n")}

        void main() { ${this.main.join("\n")} }
    `;
        console.log(code);
        return code;
    }
}

export default ShaderBuilder;

class Conditions {
    commands = [];
    from(object) {
        for (let key in object) {
            if (object[key].startsWith("LIKE")) {
                this.commands.push(
                    `${this[key]} LIKE ${typeof object[key] == "string" ? `'${object[key]}'` : object[key]}`
                );
            }
            this.commands.push(`${this[key]} = ${typeof object[key] == "string" ? `'${object[key]}'` : object[key]}`);
        }
    }
}

export default Conditions;

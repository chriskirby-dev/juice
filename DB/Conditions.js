class Conditions {
    commands = [];
    from(object){
        for(let key in object){
            this.commands.push(`${this[key]} = ${typeof object[key] == 'string' ? `'${object[key]}'` : object[key]}`);
        }
    }
}

export default Conditions;
import VariableSettings from "./VariableSettings.mjs";
import VariableBase from "./VariableBase.mjs";
class OutputAttribute extends VariableBase {
    static index = -1;
    constructor(name, type, value) {
        super("out", name, type, value);
    }
}

export default OutputAttribute;

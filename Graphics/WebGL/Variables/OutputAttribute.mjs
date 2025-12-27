/**
 * Output attribute for shader outputs.
 * Manages shader output attributes for fragment shader.
 * @module Graphics/WebGL/Variables/OutputAttribute
 */

import VariableSettings from "./VariableSettings.mjs";
import VariableBase from "./VariableBase.mjs";

/**
 * Output attribute for shader outputs.
 * @class OutputAttribute
 * @extends VariableBase
 */
class OutputAttribute extends VariableBase {
    static index = -1;
    constructor(name, type, value) {
        super("out", name, type, value);
    }
}

export default OutputAttribute;
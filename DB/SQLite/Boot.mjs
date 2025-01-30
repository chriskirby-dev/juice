import Model from "../Model/Model.js";
import { STORAGE_TYPES, TYPE_ALIASES } from "./Constants.mjs";
import * as Condition from "../../Util/Condition.mjs";

class Boot extends Model {
    static get schema() {
        return {
            id: { type: "integer", primaryKey: true, autoIncrement: true },
            errors: { type: "json", default: {} },
            shutdown: { type: "datetime" },
            updated_at: { type: "datetime" },
            created_at: { type: "datetime" },
        };
    }
}

export default Boot;

import DotNotation from "./Util/DotNotation.mjs";
const root = window || global;
const DEFAULT_CONFIG = {
    version: "1.0.0",
    description: "",
    repository: {},
    homepage: "",
    license: "ISC",
    dependencies: {},
};

if (root.JUICE_CONFIG) {
    Object.assign(DEFAULT_CONFIG, root.JUICE_CONFIG);
}

export default new DotNotation(DEFAULT_CONFIG);

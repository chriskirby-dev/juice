import ShakeFilter from "./Shake.mjs";

class Filters {
    static shake(options) {
        return new ShakeFilter(activeFilters);
    }
}

export default Filters;
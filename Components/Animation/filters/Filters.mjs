/**
 * Camera filters factory for creating effect filters.
 * Provides static methods to create camera filters like shake.
 * @module Components/Animation/filters/Filters
 */

import ShakeFilter from "./Shake.mjs";

/**
 * Factory for creating camera filters.
 * @class Filters
 */
class Filters {
    static shake(options) {
        return new ShakeFilter(activeFilters);
    }
}

export default Filters;
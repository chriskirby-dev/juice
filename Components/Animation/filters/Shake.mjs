/**
 * Shake filter for camera shake effects.
 * Applies screen shake with configurable intensity and duration.
 * @module Components/Animation/filters/Shake
 */

import CameraFilter from "./Filter.mjs";

/**
 * Camera shake filter effect.
 * @class ShakeFilter
 * @extends CameraFilter
 */
class ShakeFilter extends CameraFilter {
    options = {
        amount: 0,
        duration: 0,
    };

    apply() {}
}

export default ShakeFilter;
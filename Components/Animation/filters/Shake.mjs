import CameraFilter from "./Filter.mjs";

class ShakeFilter extends CameraFilter {
    options = {
        amount: 0,
        duration: 0,
    };

    apply() {}
}

export default ShakeFilter;

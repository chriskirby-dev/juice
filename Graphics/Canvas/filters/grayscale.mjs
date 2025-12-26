class GreyScaleFilter extends Filter {
    constructor() {
        super();
    }

    alterPixel(pixel, r, g, b, a) {
        const pixelStart = pixel.index;
        const gray = (r + g + b) / 3;
        return [gray, gray, gray, a];
    }
}

export default GreyScaleFilter;
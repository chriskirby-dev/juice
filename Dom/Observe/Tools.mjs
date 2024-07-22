import Util from "../../Util/Core.mjs";

class ObserverTools {
    static rootMarginFromRect(rootRect, activeRect) {
        const margin = {
            top: Math.round(activeRect.top),
            right: Math.round(rootRect.width - activeRect.right),
            bottom: Math.round(rootRect.height - activeRect.bottom),
            left: Math.round(activeRect.left),
        };

        if (["top", "right", "bottom", "left"].filter((key) => margin[key] < 0).length > 0) {
            return "0px 0px 0px 0px";
        }

        return `-${margin.top}px -${margin.right}px -${margin.bottom}px -${margin.left}px`;
    }

    static threshold(value) {
        //1.0 Fully Visible
        //0 every pixel
        //[x,x,x] 0-1 steps

        if (Util.type(value, "number")) {
            const arr = [0];
            if (value === 0) return 0;
            if (value === 1) return 1;
            let th = value;
            while (th < 1) {
                arr.push(Math.min(th.toFixed(3), 1));
                th += value;
            }
            arr.push(1);
            return arr;
        }
        return value;
    }
}

export default ObserverTools;

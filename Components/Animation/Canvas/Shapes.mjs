import { type } from "../../../Util/Core.mjs";
import Asset from "./Asset.mjs";

class Stroke {
    color = null;
    width = 0;

    constructor(color, width) {
        this.color = color;
        this.width = width;
    }

    apply(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.stroke();
    }
}

export class Shape extends Asset {
    type = "shape";
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.points = [];
        this.width = 0;
        this.height = 0;
        this.fill = null;
        this.stroke = new Stroke();
        this.lineWidth = 0;
        this.rotation = 0;
    }

    prepareDraw(ctx) {
        if (this.rotation) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
        }
    }

    finalizeDraw(ctx) {
        if (this.fill) {
            ctx.fillStyle = this.fill;
            ctx.fill();
        }

        if (this.stroke) {
            this.stroke.apply(ctx);
        }

        if (this.rotation) {
            ctx.restore();
        }
    }

    draw(ctx) {
        this.prepareDraw(ctx);

        ctx.beginPath();
        this.finalizeDraw(ctx);
    }
}

export class Circle extends Asset {
    constructor(x, y, radius) {
        super();
        this._x = x;
        this._y = y;
        this._radius = radius;
        this.fill = null;
    }

    draw(ctx) {
        ctx.arc(this._x, this._y, this._radius, 0, Math.PI * 2, false);
    }
}

export class Rectangle extends Asset {
    constructor(x, y, width, height) {
        super();
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }
}

export class Square extends Rectangle {
    constructor(x, y, size) {
        super(x, y, size, size);
    }
}

export class Ellipse extends Asset {
    constructor(x, y, width, height) {
        super();
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }
}

export class Circle extends Asset {
    constructor(x, y, radius) {
        super();
        this._x = x;
        this._y = y;
        this._radius = radius;
    }
}

export class Line extends Asset {
    constructor(x, y, x2, y2) {
        super();
        this._x = x;
        this._y = y;
        this._x2 = x2;
        this._y2 = y2;
    }
}

export class Triangle extends Asset {
    constructor(x, y, x2, y2, x3, y3) {
        super();
        this._x = x;
        this._y = y;
        this._x2 = x2;
        this._y2 = y2;
        this._x3 = x3;
        this._y3 = y3;
    }
}
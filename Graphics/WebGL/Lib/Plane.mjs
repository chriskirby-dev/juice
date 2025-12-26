class Plane {
    constructor(width, height, subdivisionsX, subdivisionsY) {
        this.width = width;
        this.height = height;
        this.subdivisionsX = subdivisionsX;
        this.subdivisionsY = subdivisionsY;

        this.vertices = [];
        this.uvs = [];
        this.triangles = [];
        this.normals = [];
        this.colors = [];
        this.uvs = [];

        this.generate();
    }

    generateVertices() {
        const xStep = this.width / this.subdivisionsX;
        const yStep = this.height / this.subdivisionsY;

        for (let y = 0; y <= this.subdivisionsY; y++) {
            for (let x = 0; x <= this.subdivisionsX; x++) {
                this.vertices.push(x * xStep - this.width / 2, y * yStep - this.height / 2, 0);
            }
        }
    }

    generateUvs() {
        for (let y = 0; y <= this.subdivisionsY; y++) {
            for (let x = 0; x <= this.subdivisionsX; x++) {
                this.uvs.push(x / this.subdivisionsX, y / this.subdivisionsY);
            }
        }
    }

    generateTriangles() {
        for (let y = 0; y < this.subdivisionsY; y++) {
            for (let x = 0; x < this.subdivisionsX; x++) {
                this.triangles.push(
                    x + y * (this.subdivisionsX + 1),
                    x + 1 + y * (this.subdivisionsX + 1),
                    x + 1 + (y + 1) * (this.subdivisionsX + 1)
                );
                this.triangles.push(
                    x + 1 + y * (this.subdivisionsX + 1),
                    x + 1 + (y + 1) * (this.subdivisionsX + 1),
                    x + (y + 1) * (this.subdivisionsX + 1)
                );
            }
        }
    }

    generateNormals() {
        for (let y = 0; y <= this.subdivisionsY; y++) {
            for (let x = 0; x <= this.subdivisionsX; x++) {
                this.normals.push(0, 0, 1);
            }
        }
    }

    generateColors() {
        for (let y = 0; y <= this.subdivisionsY; y++) {
            for (let x = 0; x <= this.subdivisionsX; x++) {
                this.colors.push(1, 1, 1, 1);
            }
        }
    }

    compile() {
        return {
            vertices: this.vertices,
            uvs: this.uvs,
            triangles: this.triangles,
            normals: this.normals,
            colors: this.colors,
        };
    }

    generate() {
        this.generateVertices();
        this.generateUvs();
        this.generateTriangles();
        this.generateNormals();
        this.generateColors();
    }
}
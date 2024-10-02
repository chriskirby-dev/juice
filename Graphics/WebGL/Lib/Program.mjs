class Program {
    buffers = {};
    constructor(gl, vertexShader, fragmentShader) {
        this.gl = gl;
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.build();
    }

    attribLocation(name) {
        const { gl } = this;
        return gl.getAttribLocation(this.native, name);
    }

    uniformLocation(name) {
        const { gl } = this;
        return gl.getUniformLocation(this.native, name);
    }

    buffer(name) {
        return this.buffers[name];
    }

    createBuffer(name, TYPE, value, options = { usage: "STATIC_DRAW" }) {
        const { gl } = this;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl[TYPE], buffer);
        if (value) gl.bufferData(gl[TYPE], new Float32Array(value), gl[options.usage]);
        this.buffers[name] = buffer;
        return buffer;
    }

    build() {
        const gl = this.gl;

        this.native = gl.createProgram();
        gl.attachShader(this.native, this.vertexShader.shader);
        gl.attachShader(this.native, this.fragmentShader.shader);
        gl.linkProgram(this.native);

        var success = gl.getProgramParameter(this.native, gl.LINK_STATUS);
        if (success) {
            return this.native;
        }
        console.log(gl.getProgramInfoLog(this.native));
        gl.deleteProgram(this.native);
    }
}

export default Program;
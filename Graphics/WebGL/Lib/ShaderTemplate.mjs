const VertexShader = `

// an attribute will receive data from a buffer
  attribute vec4 a_position;
  ${attributes}

  void main() {
    gl_Position = a_position;
  }

`;

const FragmentShader = `

  precision mediump float;
  ${uniforms}

  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }

  `;

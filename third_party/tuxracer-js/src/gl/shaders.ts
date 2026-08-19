export namespace Shaders {
  export function loadFromString(
    vertexShaderSource: string,
    fragmentShaderSource: string,
    gl: WebGL2RenderingContext,
  ): WebGLProgram {
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource, gl);
    const fragmentShader = createShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
      gl,
    );

    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Couldn't create program: " + log);
    }

    return program;
  }

  function createShader(
    type: GLenum,
    source: string,
    gl: WebGL2RenderingContext,
  ): WebGLShader {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      console.error(source);
      throw new Error("Couldn't compile shader. " + log);
    }

    return shader;
  }

  export function getUniformLocations(
    shader: WebGLProgram,
    gl: WebGL2RenderingContext,
    ...names: string[]
  ): WebGLUniformLocation[] {
    return names.map((name) => getUniformLocation(shader, name, gl));
  }

  function getUniformLocation(
    shader: WebGLProgram,
    name: string,
    gl: WebGL2RenderingContext,
  ): WebGLUniformLocation {
    const uniformLocation = gl.getUniformLocation(shader, name);
    if (!uniformLocation) {
      throw new Error("Could not get uniform location: " + name);
    }
    return uniformLocation;
  }

  export function getAttributeLocations(
    shader: WebGLProgram,
    gl: WebGL2RenderingContext,
    ...names: string[]
  ): number[] {
    return names.map((name) => getAttributeLocation(shader, name, gl));
  }

  function getAttributeLocation(
    shader: WebGLProgram,
    name: string,
    gl: WebGL2RenderingContext,
  ): number {
    const attributeLocation = gl.getAttribLocation(shader, name);
    if (attributeLocation === -1) {
      throw new Error("Could not get attribute location: " + name);
    }
    return attributeLocation;
  }
}

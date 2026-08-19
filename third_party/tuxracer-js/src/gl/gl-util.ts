import { Color } from "../util/color.ts";

export namespace GlUtil {
  export function clearRenderContext(
    color: Color,
    gl: WebGL2RenderingContext,
  ): void {
    gl.depthMask(true);
    gl.clearColor(...color);
    gl.clearStencil(0);
    gl.clear(
      WebGL2RenderingContext.COLOR_BUFFER_BIT |
        WebGL2RenderingContext.DEPTH_BUFFER_BIT |
        WebGL2RenderingContext.STENCIL_BUFFER_BIT,
    );
  }

  export function bindTextureIndices(
    textureIndices: number[],
    textureIndexAttributeLocation: number,
    gl: WebGL2RenderingContext,
  ): void {
    createAndBindBuffer(gl);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(textureIndices),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(textureIndexAttributeLocation);
    gl.vertexAttribPointer(
      textureIndexAttributeLocation,
      1,
      gl.FLOAT,
      false,
      0,
      0,
    );
  }

  export function bindNormals(
    normals: number[],
    normalAttributeLocation: number,
    gl: WebGL2RenderingContext,
  ): void {
    createAndBindBuffer(gl);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalAttributeLocation);
    gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
  }

  export function bindTextureCoordinates(
    textureCoordinates: number[],
    textureCoordinatesAttributeLocation: number,
    gl: WebGL2RenderingContext,
  ): void {
    createAndBindBuffer(gl);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(textureCoordinates),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(textureCoordinatesAttributeLocation);
    gl.vertexAttribPointer(
      textureCoordinatesAttributeLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );
  }

  export function bindIndices(
    indices: number[],
    gl: WebGL2RenderingContext,
    useUInt32 = false,
  ): void {
    createAndBindBuffer(gl, gl.ELEMENT_ARRAY_BUFFER);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      useUInt32 ? new Uint32Array(indices) : new Uint16Array(indices),
      gl.STATIC_DRAW,
    );
  }

  export function bindPositions(
    positions: number[],
    positionAttributeLocation: number,
    gl: WebGL2RenderingContext,
  ): void {
    createAndBindBuffer(gl);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
  }

  export function createAndBindVertexArray(
    gl: WebGL2RenderingContext,
  ): WebGLVertexArrayObject {
    const vertexArray = gl.createVertexArray();
    if (!vertexArray) {
      throw new Error("Could not create vertex array");
    }
    gl.bindVertexArray(vertexArray);
    return vertexArray;
  }

  export function createAndBindBuffer(
    gl: WebGL2RenderingContext,
    target: GLenum = WebGL2RenderingContext.ARRAY_BUFFER,
  ): WebGLBuffer {
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("Could not create buffer");
    }
    gl.bindBuffer(target, buffer);
    return buffer;
  }
}

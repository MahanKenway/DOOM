import { GlContext } from "../../gl/gl-context.ts";
import { Matrices } from "../../math/matrices.ts";
import { Textures } from "../../gl/textures.ts";
import { Shaders } from "../../gl/shaders.ts";
import { GlUtil } from "../../gl/gl-util.ts";
import { GameContext } from "../game-context.ts";

export class Skybox {
  private static readonly VERTEX_SHADER = `#version 300 es
in vec4 a_Position;
in vec2 a_TextureCoordinate;

uniform mat4 u_TransformationMatrix;

out vec2 v_TextureCoordinate;

void main() {
  gl_Position = u_TransformationMatrix * a_Position;
  v_TextureCoordinate = a_TextureCoordinate;
}
`;

  private static readonly FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 v_TextureCoordinate;

uniform sampler2D u_texture;

out vec4 outColor;
 
void main() {
  outColor = texture(u_texture, v_TextureCoordinate);
}
`;

  private static readonly DELTA = 0.0005;
  private static readonly POSITIONS: number[] = [
    // Front face
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    // Back face
    1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1,
    // Left face
    -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1,
    // Right face
    1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1,
    // Top face
    -1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1,
  ];
  private static readonly TEXTURE_COORDINATES: number[] = [
    // Back face
    0,
    1,
    1 / 3 - Skybox.DELTA,
    1,
    1 / 3 - Skybox.DELTA,
    0.5 + Skybox.DELTA,
    0,
    0.5 + Skybox.DELTA,
    // Front face
    0,
    1 / 2 - Skybox.DELTA,
    1 / 3 + Skybox.DELTA,
    1 / 2 - Skybox.DELTA,
    1 / 3 + Skybox.DELTA,
    0,
    0,
    0,
    // Right face
    1 / 3 + Skybox.DELTA,
    1,
    2 / 3 - Skybox.DELTA,
    1,
    2 / 3 - Skybox.DELTA,
    0.5 + Skybox.DELTA,
    1 / 3 + Skybox.DELTA,
    0.5 + Skybox.DELTA,
    // Left face
    2 / 3 + Skybox.DELTA,
    0.5 - Skybox.DELTA,
    1,
    0.5 - Skybox.DELTA,
    1,
    0,
    2 / 3 + Skybox.DELTA,
    0,
    // Top face
    2 / 3 + Skybox.DELTA,
    1,
    1,
    1,
    1,
    0.5 + Skybox.DELTA,
    2 / 3 + Skybox.DELTA,
    0.5 + Skybox.DELTA,
  ];
  private static readonly INDICES: number[] = [
    // Front face
    0, 1, 2, 0, 2, 3,
    // Back face
    4, 5, 6, 4, 6, 7,
    // Left face
    8, 9, 10, 8, 10, 11,
    // Right face
    12, 13, 14, 12, 14, 15,
    // Top face
    16, 17, 18, 16, 18, 19,
  ];

  private shader: WebGLProgram;
  private vertexArray: WebGLVertexArrayObject;
  private texture: WebGLTexture;
  private matrixUniformLocation: WebGLUniformLocation;

  public async init(): Promise<void> {
    const gl = GlContext.gl;

    this.shader = Shaders.loadFromString(
      Skybox.VERTEX_SHADER,
      Skybox.FRAGMENT_SHADER,
      gl,
    );
    [this.matrixUniformLocation] = Shaders.getUniformLocations(
      this.shader,
      gl,
      "u_TransformationMatrix",
    );
    const [positionAttributeLocation, textureCoordinateAttributeLocation] =
      Shaders.getAttributeLocations(
        this.shader,
        gl,
        "a_Position",
        "a_TextureCoordinate",
      );

    this.vertexArray = GlUtil.createAndBindVertexArray(gl);
    GlUtil.bindPositions(Skybox.POSITIONS, positionAttributeLocation, gl);
    GlUtil.bindIndices(Skybox.INDICES, gl);
    GlUtil.bindTextureCoordinates(
      Skybox.TEXTURE_COORDINATES,
      textureCoordinateAttributeLocation,
      gl,
    );

    // texture
    this.texture = await Textures.loadFromFile(
      `assets/skybox/${GameContext.environment.skyboxTexture}`,
      false,
      gl,
      false,
    );
  }

  public draw(): void {
    GlContext.modelViewMatrix.push();

    GlContext.modelViewMatrix.multiply(
      Matrices.createTranslation(...GlContext.cameraPosition),
    );

    const matrix = Matrices.multiply(
      GlContext.modelViewMatrix.current,
      GlContext.perspectiveMatrix,
    );

    const gl = GlContext.gl;

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.BLEND);

    gl.useProgram(this.shader);
    gl.uniformMatrix4fv(this.matrixUniformLocation, false, matrix);

    gl.bindVertexArray(this.vertexArray);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.drawElements(gl.TRIANGLES, Skybox.INDICES.length, gl.UNSIGNED_SHORT, 0);

    GlContext.modelViewMatrix.pop();
  }
}

import { GlContext } from "../../gl/gl-context.ts";
import { Matrices } from "../../math/matrices.ts";
import { Shaders } from "../../gl/shaders.ts";
import { GlUtil } from "../../gl/gl-util.ts";
import { ShaderFactory } from "../shader-factory.ts";
import { GameContext } from "../game-context.ts";

export class FogPanel {
  private static readonly VERTEX_SHADER = `#version 300 es
in vec4 a_Position;

uniform mat4 u_TransformationMatrix;

out float y;

void main() {
  gl_Position = u_TransformationMatrix * a_Position;
  y = a_Position.y;
}
`;

  private static readonly FRAGMENT_SHADER = `#version 300 es
#define FOG_COLOR $$fog-color$$
#define FOG_HEIGHT $$fog-height$$
#define FOG_FADE_HEIGHT 0.2
  
precision mediump float;

in float y;

out vec4 outColor;
 
void main() {
  if (y > -FOG_HEIGHT) {
    discard;
  } else if (y > -(FOG_HEIGHT + FOG_FADE_HEIGHT)) {
    float alpha = (-FOG_HEIGHT - y) / FOG_FADE_HEIGHT;
    outColor = vec4(FOG_COLOR.rgb, alpha);
  } else {
    outColor = FOG_COLOR;
  }
}
`;

  private static readonly POSITIONS: number[] = [
    // Front face
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    // Back face
    1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1,
    // Left face
    -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1,
    // Right face
    1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1,
    // Bottom face
    -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1,
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
  private matrixUniformLocation: WebGLUniformLocation;

  public async init(): Promise<void> {
    const gl = GlContext.gl;

    const fragmentShader = ShaderFactory.replacePlaceholders(
      FogPanel.FRAGMENT_SHADER,
      new Map([
        [
          "fog-color",
          ShaderFactory.toVec4(...GameContext.environment.fog.color),
        ],
        [
          "fog-height",
          ShaderFactory.toFloat(GameContext.courseConfig.fogHeight),
        ],
      ]),
    );
    this.shader = Shaders.loadFromString(
      FogPanel.VERTEX_SHADER,
      fragmentShader,
      gl,
    );
    [this.matrixUniformLocation] = Shaders.getUniformLocations(
      this.shader,
      gl,
      "u_TransformationMatrix",
    );
    const [positionAttributeLocation] = Shaders.getAttributeLocations(
      this.shader,
      gl,
      "a_Position",
    );

    this.vertexArray = GlUtil.createAndBindVertexArray(gl);
    GlUtil.bindPositions(FogPanel.POSITIONS, positionAttributeLocation, gl);
    GlUtil.bindIndices(FogPanel.INDICES, gl);
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
    gl.enable(gl.BLEND);

    gl.useProgram(this.shader);
    gl.uniformMatrix4fv(this.matrixUniformLocation, false, matrix);

    gl.bindVertexArray(this.vertexArray);

    gl.drawElements(
      gl.TRIANGLES,
      FogPanel.INDICES.length,
      gl.UNSIGNED_SHORT,
      0,
    );

    GlContext.modelViewMatrix.pop();
  }
}

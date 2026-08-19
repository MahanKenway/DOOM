import { GlContext } from "../../gl/gl-context.ts";
import { CourseField } from "./course-field.ts";
import { Textures } from "../../gl/textures.ts";
import { GlUtil } from "../../gl/gl-util.ts";
import { ShaderFactory, ShaderLightSettings } from "../shader-factory.ts";
import { Shaders } from "../../gl/shaders.ts";

export class CourseRenderer {
  private static readonly VERTEX_SHADER = `#version 300 es

#define SPECULAR_EXPONENT 1.0
#define TEXTURE_SCALE 6.0

in vec4 a_Position;
in vec3 a_Normal;
in float a_TextureIndex;

uniform mat4 u_ModelViewMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

out vec3 v_LightColor;
out float v_FogFactor;
out vec2 v_TextureCoordinate;
out vec3 v_TextureWeights;

$$lighting-function$$

void setTextureWeights() {
  uint index = uint(a_TextureIndex);
  v_TextureWeights = vec3(0.0);
  v_TextureWeights[index] = 1.0;
}

void main() {
  vec4 eyePosition = u_ModelViewMatrix * a_Position;
  gl_Position = u_ProjectionMatrix * eyePosition;

  v_LightColor = computeAllLights(eyePosition);
  v_FogFactor = computeFogFactor(eyePosition);

  v_TextureCoordinate = vec2(
    a_Position.x / TEXTURE_SCALE,
    a_Position.z / TEXTURE_SCALE
  );

  setTextureWeights();
}
`;

  private static readonly FRAGMENT_SHADER = `#version 300 es
#define NUM_TEXTURES 3

precision mediump float;
  
in vec3 v_LightColor;
in float v_FogFactor;
in vec2 v_TextureCoordinate;
in vec3 v_TextureWeights;

uniform sampler2D u_Textures[NUM_TEXTURES];

out vec4 outColor;

$$lighting-function$$

vec4 getTextureColor() {
  vec4 color = vec4(0.0);
  if (v_TextureWeights[0] > 0.0) {
    color += texture(u_Textures[0], v_TextureCoordinate) * v_TextureWeights[0];
  }
  if (v_TextureWeights[1] > 0.0) {
    color += texture(u_Textures[1], v_TextureCoordinate) * v_TextureWeights[1];
  }
  if (v_TextureWeights[2] > 0.0) {
    color += texture(u_Textures[2], v_TextureCoordinate) * v_TextureWeights[2];
  }
  return color;
}

void main() {
  vec4 textureColor = getTextureColor();
  outColor = computeFinalColor(textureColor);
}
`;

  private static readonly SHADER_LIGHT_SETTINGS: ShaderLightSettings = {
    useMaterial: false,
    useStaticNormal: false,
    useNormalMatrix: false,
  };

  private shader: WebGLProgram;
  private vertexArray: WebGLVertexArrayObject;

  private numIndices: number;

  private textures: WebGLTexture[];
  private textureMapping: number[];

  private viewMatrixUniformLocation: WebGLUniformLocation;
  private modelViewMatrixUniformLocation: WebGLUniformLocation;
  private projectionMatrixUniformLocation: WebGLUniformLocation;
  private texturesUniformLocation: WebGLUniformLocation;

  public async init(
    numFieldsX: number,
    numFieldsY: number,
    fields: CourseField[],
  ): Promise<void> {
    const gl = GlContext.gl;

    this.shader = ShaderFactory.createShader(
      CourseRenderer.VERTEX_SHADER,
      CourseRenderer.FRAGMENT_SHADER,
      CourseRenderer.SHADER_LIGHT_SETTINGS,
      gl,
    );
    [
      this.viewMatrixUniformLocation,
      this.modelViewMatrixUniformLocation,
      this.projectionMatrixUniformLocation,
      this.texturesUniformLocation,
    ] = Shaders.getUniformLocations(
      this.shader,
      gl,
      "u_ViewMatrix",
      "u_ModelViewMatrix",
      "u_ProjectionMatrix",
      "u_Textures",
    );
    const [
      positionAttributeLocation,
      normalAttributeLocation,
      textureIndexAttributeLocation,
    ] = Shaders.getAttributeLocations(
      this.shader,
      gl,
      "a_Position",
      "a_Normal",
      "a_TextureIndex",
    );

    const positions: number[] = fields.map((field) => field.point).flat();
    const normals: number[] = fields.map((field) => field.normal).flat();
    const textureIndices: number[] = fields.map((field) => field.terrain.glId);
    const indices = this.generateIndices(numFieldsX, numFieldsY);
    this.numIndices = indices.length;

    this.vertexArray = GlUtil.createAndBindVertexArray(gl);
    GlUtil.bindPositions(positions, positionAttributeLocation, gl);
    GlUtil.bindIndices(indices, gl, true);
    GlUtil.bindNormals(normals, normalAttributeLocation, gl);
    GlUtil.bindTextureIndices(
      textureIndices,
      textureIndexAttributeLocation,
      gl,
    );

    this.textures = await this.loadTerrainTextures(fields, gl);
    this.textureMapping = [...this.textures.keys()];
  }

  public draw(): void {
    const gl = GlContext.gl;

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    gl.useProgram(this.shader);
    gl.uniformMatrix4fv(
      this.viewMatrixUniformLocation,
      false,
      GlContext.viewMatrix,
    );
    gl.uniformMatrix4fv(
      this.modelViewMatrixUniformLocation,
      false,
      GlContext.modelViewMatrix.current,
    );
    gl.uniformMatrix4fv(
      this.projectionMatrixUniformLocation,
      false,
      GlContext.perspectiveMatrix,
    );
    gl.uniform1iv(this.texturesUniformLocation, this.textureMapping);

    gl.bindVertexArray(this.vertexArray);

    Textures.bindTextures(this.textures, gl);

    gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_INT, 0);
  }

  private generateIndices(numFieldsX: number, numFieldsY: number): number[] {
    const indices: number[] = [];
    for (let y = 0; y < numFieldsY - 1; y++) {
      for (let x = 0; x < numFieldsX - 1; x++) {
        indices.push(x + y * numFieldsX);
        indices.push(x + 1 + y * numFieldsX);
        indices.push(x + (y + 1) * numFieldsX);

        indices.push(x + 1 + y * numFieldsX);
        indices.push(x + 1 + (y + 1) * numFieldsX);
        indices.push(x + (y + 1) * numFieldsX);
      }
    }
    return indices;
  }

  private async loadTerrainTextures(
    fields: CourseField[],
    gl: WebGL2RenderingContext,
  ): Promise<WebGLTexture[]> {
    const textures = [];
    const terrains = new Set(fields.map((field) => field.terrain));
    for (const terrain of terrains.values()) {
      textures[terrain.glId] = Textures.loadFromFile(
        `assets/terrain/${terrain.texture}`,
        true,
        gl,
      );
    }
    return await Promise.all(textures);
  }
}

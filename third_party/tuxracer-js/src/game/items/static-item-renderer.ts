import { GlContext } from "../../gl/gl-context.ts";
import { GlUtil } from "../../gl/gl-util.ts";
import { ItemRenderer } from "./item-renderer.ts";
import { Item } from "./item.ts";
import { MathUtil } from "../../math/math-util.ts";
import { ShaderFactory, ShaderLightSettings } from "../shader-factory.ts";
import { Textures } from "../../gl/textures.ts";
import { Shaders } from "../../gl/shaders.ts";

export class StaticItemRenderer {
  private static readonly COS_1 = Math.cos(MathUtil.toRadians(1));
  private static readonly SIN_1 = Math.sin(MathUtil.toRadians(1));

  private static readonly VERTEX_SHADER = `#version 300 es

#define NORMAL vec3(0.0, 0.0, 1.0)
#define SPECULAR_EXPONENT 1.0

in vec4 a_Position;
in vec2 a_TextureCoordinate;
in float a_TextureIndex;

uniform mat4 u_ModelViewMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

out vec3 v_LightColor;
out float v_FogFactor;
out vec2 v_TextureCoordinate;
flat out uint v_TextureIndex;

$$lighting-function$$

void main() {
  vec4 eyePosition = u_ModelViewMatrix * a_Position;
  gl_Position = u_ProjectionMatrix * eyePosition;
  
  v_LightColor = computeAllLights(eyePosition);
  v_FogFactor = computeFogFactor(eyePosition);
  
  v_TextureCoordinate = a_TextureCoordinate;
  v_TextureIndex = uint(a_TextureIndex);
}
`;

  private static readonly FRAGMENT_SHADER = `#version 300 es
#define NUM_TEXTURES 7
  
precision mediump float;

in vec3 v_LightColor;
in float v_FogFactor;
in vec2 v_TextureCoordinate;
flat in uint v_TextureIndex;

uniform sampler2D u_Textures[NUM_TEXTURES];

out vec4 outColor;

$$lighting-function$$
 
vec4 getTextureColor() {
  switch (v_TextureIndex) {
    case 0u:
      return texture(u_Textures[0], v_TextureCoordinate);
    case 1u:
      return texture(u_Textures[1], v_TextureCoordinate);
    case 2u:
      return texture(u_Textures[2], v_TextureCoordinate);
    case 3u:
      return texture(u_Textures[3], v_TextureCoordinate);
    case 4u:
      return texture(u_Textures[4], v_TextureCoordinate);
    case 5u:
      return texture(u_Textures[5], v_TextureCoordinate);
    case 6u:
      return texture(u_Textures[6], v_TextureCoordinate);
    default:
      return vec4(0.0);
  }
}
 
void main() {
  vec4 textureColor = getTextureColor();
  if (textureColor.a < 0.5) {
    discard;
  }
  
  outColor = computeFinalColor(textureColor);
}
`;

  private static readonly SHADER_LIGHT_SETTINGS: ShaderLightSettings = {
    useMaterial: false,
    useStaticNormal: true,
    useNormalMatrix: false,
  };

  private shader: WebGLProgram;

  private textures: WebGLTexture[];
  private textureMapping: number[];

  private viewMatrixUniformLocation: WebGLUniformLocation;
  private modelViewMatrixUniformLocation: WebGLUniformLocation;
  private projectionMatrixUniformLocation: WebGLUniformLocation;
  private texturesUniformLocation: WebGLUniformLocation;

  private vertexArray: WebGLVertexArrayObject;
  private numIndices: number;

  public async init(
    textures: WebGLTexture[],
    staticItems: Item[],
  ): Promise<void> {
    this.textures = textures;
    this.textureMapping = [...this.textures.keys()];

    const gl = GlContext.gl;

    this.shader = ShaderFactory.createShader(
      StaticItemRenderer.VERTEX_SHADER,
      StaticItemRenderer.FRAGMENT_SHADER,
      StaticItemRenderer.SHADER_LIGHT_SETTINGS,
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
      textureCoordinateAttributeLocation,
      textureIndexAttributeLocation,
    ] = Shaders.getAttributeLocations(
      this.shader,
      gl,
      "a_Position",
      "a_TextureCoordinate",
      "a_TextureIndex",
    );

    [this.vertexArray, this.numIndices] = this.createStaticVertexArray(
      staticItems,
      positionAttributeLocation,
      textureCoordinateAttributeLocation,
      textureIndexAttributeLocation,
      gl,
    );
  }

  public draw(gl: WebGL2RenderingContext): void {
    gl.useProgram(this.shader);

    gl.uniformMatrix4fv(
      this.projectionMatrixUniformLocation,
      false,
      GlContext.perspectiveMatrix,
    );
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
    gl.uniform1iv(this.texturesUniformLocation, this.textureMapping);

    Textures.bindTextures(this.textures, gl);

    gl.bindVertexArray(this.vertexArray);

    gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
  }

  private createStaticVertexArray(
    items: Item[],
    positionAttributeLocation: number,
    textureCoordinateAttributeLocation: number,
    textureIndexAttributeLocation: number,
    gl: WebGL2RenderingContext,
  ): [WebGLVertexArrayObject, number] {
    const positions: number[] = [];
    const indices: number[] = [];
    const textureCoordinates: number[] = [];
    const textureIndices: number[] = [];

    items.forEach((item) => {
      const glId = item.type.glId;
      if (item.type.isFlat) {
        indices.push(
          ...this.offsetIndices(
            ItemRenderer.FLAT_INDICES,
            positions.length / 3,
          ),
        );
        positions.push(
          ...this.transformPositions(ItemRenderer.FLAT_POSITIONS, item),
        );
        textureCoordinates.push(...ItemRenderer.FLAT_TEXTURE_COORDINATES);
        textureIndices.push(glId, glId, glId, glId);
      } else {
        indices.push(
          ...this.offsetIndices(
            ItemRenderer.TREE_INDICES,
            positions.length / 3,
          ),
        );
        positions.push(
          ...this.transformPositions(ItemRenderer.TREE_POSITIONS, item),
        );
        textureCoordinates.push(...ItemRenderer.TREE_TEXTURE_COORDINATES);
        textureIndices.push(glId, glId, glId, glId, glId, glId, glId, glId);
      }
    });

    const vertexArray = GlUtil.createAndBindVertexArray(gl);
    GlUtil.bindPositions(positions, positionAttributeLocation, gl);
    GlUtil.bindIndices(indices, gl);
    GlUtil.bindTextureCoordinates(
      textureCoordinates,
      textureCoordinateAttributeLocation,
      gl,
    );
    GlUtil.bindTextureIndices(
      textureIndices,
      textureIndexAttributeLocation,
      gl,
    );
    return [vertexArray, indices.length];
  }

  private offsetIndices(indices: number[], offset: number): number[] {
    return indices.map((index) => index + offset);
  }

  private transformPositions(positions: number[], item: Item): number[] {
    const translated: number[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      // apply rotation
      const pX =
        positions[i] * StaticItemRenderer.COS_1 +
        positions[i + 2] * StaticItemRenderer.SIN_1;
      const pY = positions[i + 1];
      const pZ =
        -positions[i] * StaticItemRenderer.SIN_1 +
        positions[i + 2] * StaticItemRenderer.COS_1;

      // apply scale and translation
      translated.push(pX * item.diameter + item.position[0]);
      translated.push(pY * item.height + item.position[1]);
      translated.push(pZ * item.diameter + item.position[2]);
    }
    return translated;
  }
}

import { GlContext } from "../../gl/gl-context.ts";
import { GlUtil } from "../../gl/gl-util.ts";
import { ItemRenderer } from "./item-renderer.ts";
import { ItemType } from "./item-types.ts";
import { Item } from "./item.ts";
import { Settings } from "../../settings.ts";
import { Matrices } from "../../math/matrices.ts";
import { ShaderFactory, ShaderLightSettings } from "../shader-factory.ts";
import { Vectors } from "../../math/vectors.ts";
import { MathUtil } from "../../math/math-util.ts";
import { Axis } from "../../math/axis.ts";
import { Shaders } from "../../gl/shaders.ts";

export class DynamicItemRenderer {
  private static readonly VERTEX_SHADER = `#version 300 es

#define NORMAL vec3(0.0, 0.0, 1.0)
#define SPECULAR_EXPONENT 1.0

in vec4 a_Position;
in vec2 a_TextureCoordinate;

uniform mat4 u_ModelViewMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;

$$lighting-function$$

out vec3 v_LightColor;
out float v_FogFactor;
out vec2 v_TextureCoordinate;

void main() {
  vec4 eyePosition = u_ModelViewMatrix * a_Position;
  gl_Position = u_ProjectionMatrix * eyePosition;
  
  v_LightColor = computeAllLights(eyePosition);
  v_FogFactor = computeFogFactor(eyePosition);
  
  v_TextureCoordinate = a_TextureCoordinate;
}
`;

  private static readonly FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec3 v_LightColor;
in float v_FogFactor;
in vec2 v_TextureCoordinate;

uniform sampler2D u_texture;

out vec4 outColor;

$$lighting-function$$

void main() {
  vec4 textureColor = texture(u_texture, v_TextureCoordinate);
  if (textureColor.a < 0.5) {
    discard;
  }
  
  outColor = computeFinalColor(textureColor);
}
`;

  private static readonly SHADER_LIGHT_SETTINGS: ShaderLightSettings = {
    useMaterial: false,
    useStaticNormal: true,
    useNormalMatrix: true,
  };

  private dynamicItems: Map<ItemType, Item[]>;

  private shader: WebGLProgram;
  private textures: WebGLTexture[];
  private viewMatrixUniformLocation: WebGLUniformLocation;
  private modelViewMatrixUniformLocation: WebGLUniformLocation;
  private projectionMatrixUniformLocation: WebGLUniformLocation;
  private normalMatrixUniformLocation: WebGLUniformLocation;
  private vertexArray: WebGLVertexArrayObject;

  public async init(
    textures: WebGLTexture[],
    dynamicItems: Map<ItemType, Item[]>,
  ): Promise<void> {
    this.textures = textures;
    this.dynamicItems = dynamicItems;

    const gl = GlContext.gl;

    this.shader = ShaderFactory.createShader(
      DynamicItemRenderer.VERTEX_SHADER,
      DynamicItemRenderer.FRAGMENT_SHADER,
      DynamicItemRenderer.SHADER_LIGHT_SETTINGS,
      gl,
    );
    [
      this.viewMatrixUniformLocation,
      this.modelViewMatrixUniformLocation,
      this.projectionMatrixUniformLocation,
      this.normalMatrixUniformLocation,
    ] = Shaders.getUniformLocations(
      this.shader,
      gl,
      "u_ViewMatrix",
      "u_ModelViewMatrix",
      "u_ProjectionMatrix",
      "u_NormalMatrix",
    );
    const [positionAttributeLocation, textureCoordinateAttributeLocation] =
      Shaders.getAttributeLocations(
        this.shader,
        gl,
        "a_Position",
        "a_TextureCoordinate",
      );

    this.vertexArray = GlUtil.createAndBindVertexArray(gl);
    GlUtil.bindPositions(
      ItemRenderer.FLAT_POSITIONS,
      positionAttributeLocation,
      gl,
    );
    GlUtil.bindIndices(ItemRenderer.FLAT_INDICES, gl);
    GlUtil.bindTextureCoordinates(
      ItemRenderer.FLAT_TEXTURE_COORDINATES,
      textureCoordinateAttributeLocation,
      gl,
    );
  }

  public draw(gl: WebGL2RenderingContext): void {
    gl.useProgram(this.shader);

    gl.uniformMatrix4fv(
      this.viewMatrixUniformLocation,
      false,
      GlContext.viewMatrix,
    );
    gl.uniformMatrix4fv(
      this.projectionMatrixUniformLocation,
      false,
      GlContext.perspectiveMatrix,
    );

    this.dynamicItems.forEach((items, itemType) => {
      this.drawItemsOfType(itemType, items, gl);
    });
  }

  private drawItemsOfType(
    type: ItemType,
    items: Item[],
    gl: WebGL2RenderingContext,
  ): void {
    const texture = this.textures[type.glId];
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.bindVertexArray(this.vertexArray);
    items.forEach((item) => this.drawItem(item, gl));
  }

  private drawItem(item: Item, gl: WebGL2RenderingContext): void {
    if (item.isCollected || !this.isInClipDistance(item)) {
      return;
    }

    GlContext.modelViewMatrix.push();

    GlContext.modelViewMatrix.multiply(
      Matrices.createTranslation(...item.position),
    );

    // make item look at camera
    const direction = Vectors.subtract(GlContext.cameraPosition, item.position);
    const angle = MathUtil.toDegrees(Math.atan2(direction[0], direction[2]));
    GlContext.modelViewMatrix.multiply(Matrices.createRotation(angle, Axis.Y));

    GlContext.modelViewMatrix.multiply(
      Matrices.createScaling(item.diameter, item.height, item.diameter),
    );

    gl.uniformMatrix4fv(
      this.modelViewMatrixUniformLocation,
      false,
      GlContext.modelViewMatrix.current,
    );
    gl.uniformMatrix4fv(
      this.normalMatrixUniformLocation,
      true,
      Matrices.invert(GlContext.modelViewMatrix.current) ??
        GlContext.modelViewMatrix.current,
    );

    gl.drawElements(
      gl.TRIANGLES,
      ItemRenderer.FLAT_INDICES.length,
      gl.UNSIGNED_SHORT,
      0,
    );

    GlContext.modelViewMatrix.pop();
  }

  private isInClipDistance(item: Item): boolean {
    const viewZ = GlContext.cameraPosition[2];
    const itemZ = item.position[2];
    if (viewZ - itemZ > Settings.FAR_CLIPPING_DISTANCE) {
      return false;
    }
    return itemZ - viewZ <= Settings.BACKWARD_CLIPPING_DISTANCE;
  }
}

import { GlContext } from "../../gl/gl-context.ts";
import { SphereMesh } from "../../util/sphere-mesh.ts";
import { CharacterNode } from "./character-node.ts";
import { GlUtil } from "../../gl/gl-util.ts";
import { ShaderFactory, ShaderLightSettings } from "../shader-factory.ts";
import { Shaders } from "../../gl/shaders.ts";
import { Matrices } from "../../math/matrices.ts";

type NodeRenderingInfo = {
  numIndices: number;
  vertexArray: WebGLVertexArrayObject;
};

export class CharacterNodeRenderer {
  public static readonly MIN_SPHERE_DIVISIONS = 3;
  public static readonly MAX_SPHERE_DIVISIONS = 16;

  private static readonly VERTEX_SHADER = `#version 300 es
in vec4 a_Position;
in vec3 a_Normal;

uniform mat4 u_ModelViewMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;
uniform vec3 u_MaterialDiffuseColor;
uniform vec3 u_MaterialSpecularColor;
uniform float u_MaterialSpecularExponent;

out vec3 v_LightColor;

$$lighting-function$$

void main() {
  vec4 eyePosition = u_ModelViewMatrix * a_Position;
  gl_Position = u_ProjectionMatrix * eyePosition;

  v_LightColor = computeAllLights(eyePosition);
}
`;

  private static readonly FRAGMENT_SHADER = `#version 300 es
precision mediump float;
  
in vec3 v_LightColor;

out vec4 outColor;

void main() {
  outColor = vec4(v_LightColor, 1.0);
}
`;

  private static readonly SHADER_LIGHT_SETTINGS: ShaderLightSettings = {
    useMaterial: true,
    useStaticNormal: false,
    useNormalMatrix: true,
  };

  private readonly renderingInfo: Map<number, NodeRenderingInfo>;

  private shader: WebGLProgram;

  private viewMatrixUniformLocation: WebGLUniformLocation;
  private modelViewMatrixUniformLocation: WebGLUniformLocation;
  private projectionMatrixUniformLocation: WebGLUniformLocation;
  private normalMatrixUniformLocation: WebGLUniformLocation;
  private materialDiffuseColorUniformLocation: WebGLUniformLocation;
  private materialSpecularColorUniformLocation: WebGLUniformLocation;
  private materialSpecularExponentUniformLocation: WebGLUniformLocation;

  constructor() {
    this.renderingInfo = new Map<number, NodeRenderingInfo>();
  }

  public async init(): Promise<void> {
    const gl = GlContext.gl;

    this.shader = ShaderFactory.createShader(
      CharacterNodeRenderer.VERTEX_SHADER,
      CharacterNodeRenderer.FRAGMENT_SHADER,
      CharacterNodeRenderer.SHADER_LIGHT_SETTINGS,
      gl,
    );
    [
      this.viewMatrixUniformLocation,
      this.modelViewMatrixUniformLocation,
      this.projectionMatrixUniformLocation,
      this.normalMatrixUniformLocation,
      this.materialDiffuseColorUniformLocation,
      this.materialSpecularColorUniformLocation,
      this.materialSpecularExponentUniformLocation,
    ] = Shaders.getUniformLocations(
      this.shader,
      gl,
      "u_ViewMatrix",
      "u_ModelViewMatrix",
      "u_ProjectionMatrix",
      "u_NormalMatrix",
      "u_MaterialDiffuseColor",
      "u_MaterialSpecularColor",
      "u_MaterialSpecularExponent",
    );
    const [positionAttributeLocation, normalAttributeLocation] =
      Shaders.getAttributeLocations(this.shader, gl, "a_Position", "a_Normal");

    for (
      let numSphereDivisions = CharacterNodeRenderer.MIN_SPHERE_DIVISIONS;
      numSphereDivisions <= CharacterNodeRenderer.MAX_SPHERE_DIVISIONS;
      numSphereDivisions++
    ) {
      const sphereMesh = SphereMesh.generate(
        1,
        2 * numSphereDivisions,
        numSphereDivisions,
      );

      const vertexArray = GlUtil.createAndBindVertexArray(gl);
      GlUtil.bindPositions(sphereMesh.vertices, positionAttributeLocation, gl);
      GlUtil.bindIndices(sphereMesh.indices, gl);
      GlUtil.bindNormals(sphereMesh.normals, normalAttributeLocation, gl);

      this.renderingInfo.set(numSphereDivisions, {
        numIndices: sphereMesh.indices.length,
        vertexArray,
      } as NodeRenderingInfo);
    }
  }

  public prepareDrawing(): void {
    const gl = GlContext.gl;

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

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
  }

  public draw(node: CharacterNode): void {
    if (!node.isVisible || !node.material || !node.numSphereDivisions) {
      return;
    }

    const renderingInfo = this.renderingInfo.get(
      node.numSphereDivisions,
    ) as NodeRenderingInfo;

    const gl = GlContext.gl;

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
    gl.uniform3fv(
      this.materialDiffuseColorUniformLocation,
      node.material.diffuseColor,
    );
    gl.uniform3fv(
      this.materialSpecularColorUniformLocation,
      node.material.specularColor,
    );
    gl.uniform1f(
      this.materialSpecularExponentUniformLocation,
      node.material.specularExponent,
    );

    gl.bindVertexArray(renderingInfo.vertexArray);
    gl.drawElements(
      gl.TRIANGLE_STRIP,
      renderingInfo.numIndices,
      gl.UNSIGNED_SHORT,
      0,
    );
  }
}

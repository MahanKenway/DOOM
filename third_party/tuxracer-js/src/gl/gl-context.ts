import { MatrixStack } from "./matrix-stack.ts";
import { Matrix4 } from "../math/matrices.ts";
import { Vector3 } from "../math/vectors.ts";

export namespace GlContext {
  export let gl: WebGL2RenderingContext;
  export let modelViewMatrix: MatrixStack;
  export let viewMatrix: Matrix4;
  export let perspectiveMatrix: Matrix4;
  export let cameraPosition: Vector3;
}

import { MathUtil } from "./math-util.ts";
import { Matrix4 } from "./matrices.ts";
import { Quaternion } from "./quaternions.ts";

export type Vector3 = [number, number, number];

export namespace Vectors {
  export const X_UNIT: Vector3 = [1, 0, 0];
  export const Y_UNIT: Vector3 = [0, 1, 0];
  export const Z_UNIT: Vector3 = [0, 0, 1];
  export const NEGATIVE_X_UNIT: Vector3 = [-1, 0, 0];
  export const NEGATIVE_Y_UNIT: Vector3 = [0, -1, 0];
  export const NEGATIVE_Z_UNIT: Vector3 = [0, 0, -1];
  export const ZERO: Vector3 = [0, 0, 0];

  export function computeDotProduct(
    vector1: Vector3,
    vector2: Vector3,
  ): number {
    return (
      vector1[0] * vector2[0] +
      vector1[1] * vector2[1] +
      vector1[2] * vector2[2]
    );
  }

  export function computeLength(vector: Vector3): number {
    return Math.hypot(...vector);
  }

  export function negate(vector: Vector3): Vector3 {
    return [-vector[0], -vector[1], -vector[2]];
  }

  export function multiply(scalar: number, vector: Vector3): Vector3 {
    return [scalar * vector[0], scalar * vector[1], scalar * vector[2]];
  }

  export function normalize(vector: Vector3): Vector3 {
    const length = computeLength(vector);
    if (length == 0) {
      return ZERO;
    }
    return multiply(1 / length, vector);
  }

  export function subtract(vector1: Vector3, vector2: Vector3): Vector3 {
    return [
      vector1[0] - vector2[0],
      vector1[1] - vector2[1],
      vector1[2] - vector2[2],
    ];
  }

  export function add(vector1: Vector3, vector2: Vector3): Vector3 {
    return [
      vector1[0] + vector2[0],
      vector1[1] + vector2[1],
      vector1[2] + vector2[2],
    ];
  }

  export function addAll(...vectors: Vector3[]): Vector3 {
    const result: Vector3 = [0, 0, 0];
    vectors.forEach((vector) => {
      result[0] += vector[0];
      result[1] += vector[1];
      result[2] += vector[2];
    });
    return result;
  }

  export function projectToPlane(
    planeNormal: Vector3,
    vector: Vector3,
  ): Vector3 {
    const dotProduct = computeDotProduct(planeNormal, vector);
    return subtract(vector, multiply(dotProduct, planeNormal));
  }

  export function computeCrossProduct(
    vector1: Vector3,
    vector2: Vector3,
  ): Vector3 {
    const [x1, y1, z1] = vector1;
    const [x2, y2, z2] = vector2;
    return [y1 * z2 - z1 * y2, z1 * x2 - x1 * z2, x1 * y2 - y1 * x2];
  }

  export function interpolate(
    fraction: number,
    vector1: Vector3,
    vector2: Vector3,
  ): Vector3 {
    return [
      MathUtil.interpolate(fraction, vector1[0], vector2[0]),
      MathUtil.interpolate(fraction, vector1[1], vector2[1]),
      MathUtil.interpolate(fraction, vector1[2], vector2[2]),
    ];
  }

  export function transformPoint(
    transformation: Matrix4,
    point: Vector3,
  ): Vector3 {
    const [m00, m01, m02, , m10, m11, m12, , m20, m21, m22, , m30, m31, m32] =
      transformation;
    const [x, y, z] = point;
    return [
      x * m00 + y * m10 + z * m20 + m30,
      x * m01 + y * m11 + z * m21 + m31,
      x * m02 + y * m12 + z * m22 + m32,
    ];
  }

  export function transformVector(
    transformation: Matrix4,
    vector: Vector3,
  ): Vector3 {
    const [m00, m01, m02, , m10, m11, m12, , m20, m21, m22] = transformation;
    const [x, y, z] = vector;
    return [
      x * m00 + y * m10 + z * m20,
      x * m01 + y * m11 + z * m21,
      x * m02 + y * m12 + z * m22,
    ];
  }

  export function rotateVector(
    quaternion: Quaternion,
    vector: Vector3,
  ): Vector3 {
    const qVector: Vector3 = [quaternion[0], quaternion[1], quaternion[2]];
    const scalar = quaternion[3];

    const t = Vectors.multiply(2, Vectors.computeCrossProduct(qVector, vector));
    return Vectors.add(
      Vectors.add(vector, Vectors.multiply(scalar, t)),
      Vectors.computeCrossProduct(qVector, t),
    );
  }
}

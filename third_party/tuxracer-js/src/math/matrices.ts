import { Axis } from "./axis.ts";
import { MathUtil } from "./math-util.ts";
import { Vector3 } from "./vectors.ts";
import { Quaternion } from "./quaternions.ts";

export type Matrix4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export namespace Matrices {
  export const I0J0: number = 0;
  export const I0J1: number = 1;
  export const I0J2: number = 2;
  export const I0J3: number = 3;
  export const I1J0: number = 4;
  export const I1J1: number = 5;
  export const I1J2: number = 6;
  export const I1J3: number = 7;
  export const I2J0: number = 8;
  export const I2J1: number = 9;
  export const I2J2: number = 10;
  export const I2J3: number = 11;
  export const I3J0: number = 12;
  export const I3J1: number = 13;
  export const I3J2: number = 14;
  export const I3J3: number = 15;

  export function createIdentity(): Matrix4 {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  export function createFromVectors(
    vector1: Vector3,
    vector2: Vector3,
    vector3: Vector3,
  ): Matrix4 {
    const matrix = createIdentity();
    matrix[I0J0] = vector1[0];
    matrix[I0J1] = vector1[1];
    matrix[I0J2] = vector1[2];

    matrix[I1J0] = vector2[0];
    matrix[I1J1] = vector2[1];
    matrix[I1J2] = vector2[2];

    matrix[I2J0] = vector3[0];
    matrix[I2J1] = vector3[1];
    matrix[I2J2] = vector3[2];
    return matrix;
  }

  export function createFromQuaternion(quaternion: Quaternion): Matrix4 {
    const [x, y, z, w] = quaternion;

    const wx = w * x;
    const wy = w * y;
    const wz = w * z;
    const xx = x * x;
    const xy = x * y;
    const xz = x * z;
    const yy = y * y;
    const yz = y * z;
    const zz = z * z;

    const matrix = createIdentity();
    matrix[I0J0] = 1 - 2 * (yy + zz);
    matrix[I0J1] = 2 * (xy - wz);
    matrix[I0J2] = 2 * (xz + wy);

    matrix[I1J0] = 2 * (xy + wz);
    matrix[I1J1] = 1 - 2 * (xx + zz);
    matrix[I1J2] = 2 * (yz - wx);

    matrix[I2J0] = 2 * (xz - wy);
    matrix[I2J1] = 2 * (yz + wx);
    matrix[I2J2] = 1 - 2 * (xx + yy);
    return matrix;
  }

  export function createTranslation(x: number, y: number, z: number): Matrix4 {
    const matrix = createIdentity();
    matrix[I3J0] = x;
    matrix[I3J1] = y;
    matrix[I3J2] = z;
    return matrix;
  }

  export function createScaling(x: number, y: number, z: number): Matrix4 {
    const matrix = createIdentity();
    matrix[I0J0] = x;
    matrix[I1J1] = y;
    matrix[I2J2] = z;
    return matrix;
  }

  export function createRotation(angle: number, axis: Axis): Matrix4 {
    const radians = MathUtil.toRadians(angle);
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);

    const matrix = createIdentity();

    switch (axis) {
      case Axis.X:
        matrix[I1J1] = cos;
        matrix[I2J1] = -sin;
        matrix[I1J2] = sin;
        matrix[I2J2] = cos;
        break;

      case Axis.Y:
        matrix[I0J0] = cos;
        matrix[I2J0] = sin;
        matrix[I0J2] = -sin;
        matrix[I2J2] = cos;
        break;

      case Axis.Z:
        matrix[I0J0] = cos;
        matrix[I1J0] = -sin;
        matrix[I0J1] = sin;
        matrix[I1J1] = cos;
        break;
    }

    return matrix;
  }

  export function multiply(matrix1: Matrix4, matrix2: Matrix4): Matrix4 {
    const [
      m00_1,
      m01_1,
      m02_1,
      m03_1,
      m10_1,
      m11_1,
      m12_1,
      m13_1,
      m20_1,
      m21_1,
      m22_1,
      m23_1,
      m30_1,
      m31_1,
      m32_1,
      m33_1,
    ] = matrix1;
    const [
      m00_2,
      m01_2,
      m02_2,
      m03_2,
      m10_2,
      m11_2,
      m12_2,
      m13_2,
      m20_2,
      m21_2,
      m22_2,
      m23_2,
      m30_2,
      m31_2,
      m32_2,
      m33_2,
    ] = matrix2;

    const matrix = createIdentity();
    matrix[I0J0] =
      m00_1 * m00_2 + m01_1 * m10_2 + m02_1 * m20_2 + m03_1 * m30_2;
    matrix[I0J1] =
      m00_1 * m01_2 + m01_1 * m11_2 + m02_1 * m21_2 + m03_1 * m31_2;
    matrix[I0J2] =
      m00_1 * m02_2 + m01_1 * m12_2 + m02_1 * m22_2 + m03_1 * m32_2;
    matrix[I0J3] =
      m00_1 * m03_2 + m01_1 * m13_2 + m02_1 * m23_2 + m03_1 * m33_2;

    matrix[I1J0] =
      m10_1 * m00_2 + m11_1 * m10_2 + m12_1 * m20_2 + m13_1 * m30_2;
    matrix[I1J1] =
      m10_1 * m01_2 + m11_1 * m11_2 + m12_1 * m21_2 + m13_1 * m31_2;
    matrix[I1J2] =
      m10_1 * m02_2 + m11_1 * m12_2 + m12_1 * m22_2 + m13_1 * m32_2;
    matrix[I1J3] =
      m10_1 * m03_2 + m11_1 * m13_2 + m12_1 * m23_2 + m13_1 * m33_2;

    matrix[I2J0] =
      m20_1 * m00_2 + m21_1 * m10_2 + m22_1 * m20_2 + m23_1 * m30_2;
    matrix[I2J1] =
      m20_1 * m01_2 + m21_1 * m11_2 + m22_1 * m21_2 + m23_1 * m31_2;
    matrix[I2J2] =
      m20_1 * m02_2 + m21_1 * m12_2 + m22_1 * m22_2 + m23_1 * m32_2;
    matrix[I2J3] =
      m20_1 * m03_2 + m21_1 * m13_2 + m22_1 * m23_2 + m23_1 * m33_2;

    matrix[I3J0] =
      m30_1 * m00_2 + m31_1 * m10_2 + m32_1 * m20_2 + m33_1 * m30_2;
    matrix[I3J1] =
      m30_1 * m01_2 + m31_1 * m11_2 + m32_1 * m21_2 + m33_1 * m31_2;
    matrix[I3J2] =
      m30_1 * m02_2 + m31_1 * m12_2 + m32_1 * m22_2 + m33_1 * m32_2;
    matrix[I3J3] =
      m30_1 * m03_2 + m31_1 * m13_2 + m32_1 * m23_2 + m33_1 * m33_2;
    return matrix;
  }

  export function transpose(matrix: Matrix4): Matrix4 {
    return [
      matrix[I0J0],
      matrix[I1J0],
      matrix[I2J0],
      matrix[I3J0],
      matrix[I0J1],
      matrix[I1J1],
      matrix[I2J1],
      matrix[I3J1],
      matrix[I0J2],
      matrix[I1J2],
      matrix[I2J2],
      matrix[I3J2],
      matrix[I0J3],
      matrix[I1J3],
      matrix[I2J3],
      matrix[I3J3],
    ];
  }

  export function invert(matrix: Matrix4): Matrix4 | undefined {
    const [
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
    ] = matrix;

    const b00 = m00 * m11 - m01 * m10;
    const b01 = m00 * m12 - m02 * m10;
    const b02 = m00 * m13 - m03 * m10;
    const b03 = m01 * m12 - m02 * m11;
    const b04 = m01 * m13 - m03 * m11;
    const b05 = m02 * m13 - m03 * m12;
    const b06 = m20 * m31 - m21 * m30;
    const b07 = m20 * m32 - m22 * m30;
    const b08 = m20 * m33 - m23 * m30;
    const b09 = m21 * m32 - m22 * m31;
    const b10 = m21 * m33 - m23 * m31;
    const b11 = m22 * m33 - m23 * m32;

    const det =
      b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (det === 0) {
      return undefined;
    }

    const invDet = 1 / det;

    return [
      (m11 * b11 - m12 * b10 + m13 * b09) * invDet,
      (-m01 * b11 + m02 * b10 - m03 * b09) * invDet,
      (m31 * b05 - m32 * b04 + m33 * b03) * invDet,
      (-m21 * b05 + m22 * b04 - m23 * b03) * invDet,

      (-m10 * b11 + m12 * b08 - m13 * b07) * invDet,
      (m00 * b11 - m02 * b08 + m03 * b07) * invDet,
      (-m30 * b05 + m32 * b02 - m33 * b01) * invDet,
      (m20 * b05 - m22 * b02 + m23 * b01) * invDet,

      (m10 * b10 - m11 * b08 + m13 * b06) * invDet,
      (-m00 * b10 + m01 * b08 - m03 * b06) * invDet,
      (m30 * b04 - m31 * b02 + m33 * b00) * invDet,
      (-m20 * b04 + m21 * b02 - m23 * b00) * invDet,

      (-m10 * b09 + m11 * b07 - m12 * b06) * invDet,
      (m00 * b09 - m01 * b07 + m02 * b06) * invDet,
      (-m30 * b03 + m31 * b01 - m32 * b00) * invDet,
      (m20 * b03 - m21 * b01 + m22 * b00) * invDet,
    ];
  }

  export function createRotationAroundVector(
    angle: number,
    vector: Vector3,
  ): Matrix4 {
    const x = -vector[0];
    const y = -vector[1];
    const z = -vector[2];

    const radians = MathUtil.toRadians(angle);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const oneMinusCos = 1 - cos;

    const matrix = createIdentity();
    matrix[I0J0] = cos + x * x * oneMinusCos;
    matrix[I0J1] = x * y * oneMinusCos - z * sin;
    matrix[I0J2] = x * z * oneMinusCos + y * sin;

    matrix[I1J0] = y * x * oneMinusCos + z * sin;
    matrix[I1J1] = cos + y * y * oneMinusCos;
    matrix[I1J2] = y * z * oneMinusCos - x * sin;

    matrix[I2J0] = z * x * oneMinusCos - y * sin;
    matrix[I2J1] = z * y * oneMinusCos + x * sin;
    matrix[I2J2] = cos + z * z * oneMinusCos;
    return matrix;
  }

  export function createPerspectiveMatrix(
    fieldOfView: number,
    aspect: number,
    zNear: number,
    zFar: number,
  ): Matrix4 {
    const f = Math.tan(MathUtil.PI_0_5 - 0.5 * MathUtil.toRadians(fieldOfView));
    const rangeInv = 1.0 / (zNear - zFar);
    return [
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (zFar + zNear) * rangeInv,
      -1,
      0,
      0,
      2 * zFar * zNear * rangeInv,
      0,
    ];
  }
}

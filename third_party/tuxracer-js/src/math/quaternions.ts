import { Matrices, Matrix4 } from "./matrices.ts";
import { Vector3, Vectors } from "./vectors.ts";

export type Quaternion = [number, number, number, number];

export namespace Quaternions {
  export function createFromRotationMatrix(matrix: Matrix4): Quaternion {
    const [m00, m01, m02, , m10, m11, m12, , m20, m21, m22, , ,] = matrix;

    const trace = m00 + m11 + m22;
    let x, y, z, w;

    if (trace > 0) {
      const s = Math.sqrt(trace + 1.0) * 2; // S = 4 * w
      w = 0.25 * s;
      x = (m21 - m12) / s;
      y = (m02 - m20) / s;
      z = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
      const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2; // S = 4 * x
      w = (m21 - m12) / s;
      x = 0.25 * s;
      y = (m01 + m10) / s;
      z = (m02 + m20) / s;
    } else if (m11 > m22) {
      const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2; // S = 4 * y
      w = (m02 - m20) / s;
      x = (m01 + m10) / s;
      y = 0.25 * s;
      z = (m12 + m21) / s;
    } else {
      const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2; // S = 4 * z
      w = (m10 - m01) / s;
      x = (m02 + m20) / s;
      y = (m12 + m21) / s;
      z = 0.25 * s;
    }

    return [x, y, z, w] as Quaternion;
  }

  export function createFromVectors(s: Vector3, t: Vector3): Quaternion {
    const u = Vectors.computeCrossProduct(s, t);
    const sin2Phi = Vectors.computeLength(u);
    if (sin2Phi < Number.EPSILON) {
      return [0, 0, 0, 1];
    } else {
      const cos2Phi = Vectors.computeDotProduct(s, t);
      const sinPhi = Math.sqrt((1 - cos2Phi) / 2);
      const cosPhi = Math.sqrt((1 + cos2Phi) / 2);
      return [sinPhi * u[0], sinPhi * u[1], sinPhi * u[2], cosPhi];
    }
  }

  export function createLookRotationFromDirection(
    direction: Vector3,
  ): Quaternion {
    const z = Vectors.normalize(Vectors.negate(direction));
    const y = Vectors.normalize(Vectors.projectToPlane(z, Vectors.Y_UNIT));
    const x = Vectors.computeCrossProduct(y, z);
    return Quaternions.createFromRotationMatrix(
      Matrices.createFromVectors(x, y, z),
    );
  }

  export function interpolate(
    quaternion1: Quaternion,
    quaternion2: Quaternion,
    t: number,
  ): Quaternion {
    let dotProduct = computeDotProduct(quaternion1, quaternion2);
    if (dotProduct < 0) {
      dotProduct = -dotProduct;
      quaternion2 = negate(quaternion2);
    }

    let scale0, scale1;
    if (1 - dotProduct > Number.EPSILON) {
      const phi = Math.acos(dotProduct);
      const sinPhi = Math.sin(phi);
      scale0 = Math.sin(phi * (1 - t)) / sinPhi;
      scale1 = Math.sin(phi * t) / sinPhi;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }

    return [
      scale0 * quaternion1[0] + scale1 * quaternion2[0],
      scale0 * quaternion1[1] + scale1 * quaternion2[1],
      scale0 * quaternion1[2] + scale1 * quaternion2[2],
      scale0 * quaternion1[3] + scale1 * quaternion2[3],
    ];
  }

  export function conjugate(quaternion: Quaternion): Quaternion {
    return [-quaternion[0], -quaternion[1], -quaternion[2], quaternion[3]];
  }

  function computeDotProduct(
    quaternion1: Quaternion,
    quaternion2: Quaternion,
  ): number {
    return (
      quaternion1[0] * quaternion2[0] +
      quaternion1[1] * quaternion2[1] +
      quaternion1[2] * quaternion2[2] +
      quaternion1[3] * quaternion2[3]
    );
  }

  function negate(quaternion: Quaternion): Quaternion {
    return [-quaternion[0], -quaternion[1], -quaternion[2], -quaternion[3]];
  }
}

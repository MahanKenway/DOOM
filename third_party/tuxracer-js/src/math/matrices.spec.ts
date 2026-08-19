import { describe, it } from "vitest";
import { Axis } from "./axis.ts";
import { Vectors } from "./vectors.ts";
import { TestUtil } from "../util/test-util.ts";
import { Matrices, Matrix4 } from "./matrices.ts";
import { Quaternions } from "./quaternions.ts";

const MATRIX: Matrix4 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6];

describe("matrices", () => {
  it("should preserve matrix when multiplying with identity", () => {
    const identity = Matrices.createIdentity();
    const result = Matrices.multiply(MATRIX, identity);
    TestUtil.expectArrayToBeCloseTo(MATRIX, result);
  });

  it("should preserve matrix when transposing twice", () => {
    const result = Matrices.transpose(Matrices.transpose(MATRIX));
    TestUtil.expectArrayToBeCloseTo(MATRIX, result);
  });

  it("should rotate around x axis consistently", () => {
    const simpleRotation = Matrices.createRotation(30, Axis.X);
    const complexRotation = Matrices.createRotationAroundVector(
      30,
      Vectors.X_UNIT,
    );
    TestUtil.expectArrayToBeCloseTo(simpleRotation, complexRotation);
  });

  it("should rotate around y axis consistently", () => {
    const simpleRotation = Matrices.createRotation(-30, Axis.Y);
    const complexRotation = Matrices.createRotationAroundVector(
      -30,
      Vectors.Y_UNIT,
    );
    TestUtil.expectArrayToBeCloseTo(simpleRotation, complexRotation);
  });

  it("should rotate around z axis consistently", () => {
    const simpleRotation = Matrices.createRotation(390, Axis.Z);
    const complexRotation = Matrices.createRotationAroundVector(
      390,
      Vectors.Z_UNIT,
    );
    TestUtil.expectArrayToBeCloseTo(simpleRotation, complexRotation);
  });

  it("should preserve rotation matrix when converting to a quaternion and back", () => {
    const initialMatrix = Matrices.createRotation(90, Axis.X);
    const quaternion = Quaternions.createFromRotationMatrix(initialMatrix);
    const finalMatrix = Matrices.createFromQuaternion(quaternion);
    TestUtil.expectArrayToBeCloseTo(initialMatrix, finalMatrix);
  });

  it("should multiply", () => {
    const matrix1: Matrix4 = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ];
    const matrix2: Matrix4 = [
      17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    ];
    TestUtil.expectArrayToBeCloseTo(
      [
        250, 260, 270, 280, 618, 644, 670, 696, 986, 1028, 1070, 1112, 1354,
        1412, 1470, 1528,
      ],
      Matrices.multiply(matrix1, matrix2),
    );
  });
});

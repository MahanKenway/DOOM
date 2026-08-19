import { describe, it } from "vitest";
import { Vector3, Vectors } from "./vectors.ts";
import { TestUtil } from "../util/test-util.ts";
import { Matrices } from "./matrices.ts";
import { Quaternion } from "./quaternions.ts";

describe("vectors", () => {
  it("should normalize", () => {
    const vector: Vector3 = [5, 4, 3];
    TestUtil.expectArrayToBeCloseTo(
      [0.71, 0.57, 0.42],
      Vectors.normalize(vector),
    );
  });

  it("should compute cross product", () => {
    const crossProduct = Vectors.computeCrossProduct([3, -3, 1], [4, 9, 2]);
    TestUtil.expectArrayToBeCloseTo([-15, -2, 39], crossProduct);
  });

  it("should interpolate", () => {
    const vector = Vectors.interpolate(0.5, [1, 0, 0], [0, 1, 1]);
    TestUtil.expectArrayToBeCloseTo([0.5, 0.5, 0.5], vector);
  });

  it("should transform point", () => {
    const translation = Matrices.createTranslation(1, 2, 3);
    const translatedPoint = Vectors.transformPoint(translation, [3, 2, 1]);
    TestUtil.expectArrayToBeCloseTo([4, 4, 4], translatedPoint);
  });

  it("should transform vector", () => {
    const translation = Matrices.createScaling(2, 2, 2);
    const translatedVector = Vectors.transformVector(translation, [1, 1, 1]);
    TestUtil.expectArrayToBeCloseTo([2, 2, 2], translatedVector);
  });

  it("should rotate vector", () => {
    const quaternion: Quaternion = [0.707, 0, 0, 0.707]; // rotate on x axis by 90 degrees
    const rotated = Vectors.rotateVector(quaternion, [0, 1, 0]);
    TestUtil.expectArrayToBeCloseTo([0, 0, 1], rotated);
  });
});

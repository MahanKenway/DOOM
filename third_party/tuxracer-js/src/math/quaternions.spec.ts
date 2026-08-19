import { describe, it } from "vitest";
import { Quaternion, Quaternions } from "./quaternions.ts";
import { Vectors } from "./vectors.ts";
import { TestUtil } from "../util/test-util.ts";

describe("quaternions", () => {
  it("should interpolate", () => {
    const quaternion1: Quaternion = [0.382, 0, 0, 0.924]; // rotate on x axis by 45 degrees
    const quaternion2: Quaternion = [0.924, 0, 0, 0.383]; // rotate on x axis by 135 degrees
    const interpolated = Quaternions.interpolate(quaternion1, quaternion2, 0.5);
    const rotated = Vectors.rotateVector(interpolated, [0, 1, 0]);
    TestUtil.expectArrayToBeCloseTo([0, 0, 1], rotated);
  });
});

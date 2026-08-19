import { describe, expect, it } from "vitest";
import { MathUtil } from "./math-util.ts";

describe("math utils", () => {
  it("should convert degrees to radians", () => {
    expect(MathUtil.toRadians(0)).toBeCloseTo(0);
    expect(MathUtil.toRadians(90)).toBeCloseTo(Math.PI * 0.5);
    expect(MathUtil.toRadians(180)).toBeCloseTo(Math.PI);
    expect(MathUtil.toRadians(270)).toBeCloseTo(Math.PI * 1.5);
  });

  it("should convert degrees to radians", () => {
    expect(MathUtil.toDegrees(0)).toBeCloseTo(0);
    expect(MathUtil.toDegrees(Math.PI * 0.5)).toBeCloseTo(90);
    expect(MathUtil.toDegrees(Math.PI)).toBeCloseTo(180);
    expect(MathUtil.toDegrees(Math.PI * 1.5)).toBeCloseTo(270);
  });

  it("should interpolate", () => {
    expect(MathUtil.interpolate(0.5, 50, 100)).toBeCloseTo(75);
  });

  it("should clamp values", () => {
    expect(MathUtil.clamp(5, 50, 100)).toBeCloseTo(50);
    expect(MathUtil.clamp(5, -50, 100)).toBeCloseTo(5);
    expect(MathUtil.clamp(5, 5000, 100)).toBeCloseTo(100);
  });
});

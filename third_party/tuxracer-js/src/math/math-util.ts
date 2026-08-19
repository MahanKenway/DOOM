const ONE_DEGREE_IN_RADIANS: number = Math.PI / 180;
const ONE_RADIAN_IN_DEGREE: number = 180.0 / Math.PI;

export namespace MathUtil {
  export const PI_0_25 = 0.25 * Math.PI;
  export const PI_0_5 = 0.5 * Math.PI;
  export const PI_0_75 = 0.75 * Math.PI;
  export const PI_1_25 = 1.25 * Math.PI;
  export const PI_1_5 = 1.5 * Math.PI;
  export const PI_1_75 = 1.75 * Math.PI;
  export const PI_2 = 2 * Math.PI;

  export function toRadians(degrees: number): number {
    return degrees * ONE_DEGREE_IN_RADIANS;
  }

  export function toDegrees(radians: number): number {
    return ONE_RADIAN_IN_DEGREE * radians;
  }

  export function interpolate(
    fraction: number,
    value1: number,
    value2: number,
  ): number {
    return fraction * value1 + (1 - fraction) * value2;
  }

  export function clamp(min: number, value: number, max: number): number {
    return Math.max(Math.min(value, max), min);
  }

  export function interpolateLinear(
    xValues: number[],
    yValues: number[],
    target: number,
  ): number {
    if (xValues.length < 2 || yValues.length < 2) {
      throw new Error("Arrays must contain at least two points.");
    }
    const n = xValues.length;

    let segmentIndex: number;
    if (target < xValues[0]) {
      segmentIndex = 0;
    } else if (target >= xValues[n - 1]) {
      segmentIndex = n - 2;
    } else {
      for (segmentIndex = 0; segmentIndex < n - 1; segmentIndex++) {
        if (target < xValues[segmentIndex + 1]) {
          break;
        }
      }
    }

    const slope =
      (yValues[segmentIndex + 1] - yValues[segmentIndex]) /
      (xValues[segmentIndex + 1] - xValues[segmentIndex]);
    const intercept = yValues[segmentIndex] - slope * xValues[segmentIndex];
    return slope * target + intercept;
  }
}

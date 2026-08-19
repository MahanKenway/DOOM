import { expect } from "vitest";
import { Matrix4 } from "../math/matrices.ts";

export namespace TestUtil {
  export function expectArrayToBeCloseTo(
    expected: number[],
    actual: number[],
    precision: number = 2,
  ): void {
    expected.forEach((value, index) => {
      expect(actual[index]).toBeCloseTo(value, precision);
    });
  }

  export function printMatrix(matrix: Matrix4): void {
    for (let i = 0; i < 4; i++) {
      const values = [];
      for (let j = 0; j < 4; j++) {
        const value = matrix[i * 4 + j];
        values.push(value.toFixed(2));
      }
      console.log(values.join(", "));
    }
  }
}

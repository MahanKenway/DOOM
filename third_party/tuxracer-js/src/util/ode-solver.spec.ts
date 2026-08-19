import { describe, expect, it } from "vitest";
import { ODESolver } from "./ode-solver.ts";

describe("ODESolver", () => {
  it("should update estimates correctly", () => {
    const initialValue = 1.0;
    const h = 0.1;
    const solver = new ODESolver(initialValue, h);

    // Suppose the derivative at step 0 is 2.0
    solver.updateEstimate(0, 2.0);
    // The internal k[0] is now 0.1 * 2.0 = 0.2

    // Let's do step 1 with a derivative = 3.0
    solver.updateEstimate(1, 3.0);
    // k[1] should be 0.1 * 3.0 = 0.3

    // computeNextValue(1) uses COEFFICIENTS[0][1] * k[0] = 0.5 * 0.2 = 0.1
    // plus the initialValue = 1.0
    // so it should be 1.0 + 0.1 = 1.1
    const nextValueStep1 = solver.computeNextValue(1);
    expect(nextValueStep1).toBeCloseTo(1.1, 6); // 6-digit precision

    // computeNextValue(2) uses:
    // from step 0: COEFFICIENTS[0][2] = 0.0 => 0.0 * 0.2 = 0.0
    // from step 1: COEFFICIENTS[1][2] = 0.75 => 0.75 * 0.3 = 0.225
    // plus initialValue (1.0)
    // total = 1.0 + 0.0 + 0.225 = 1.225
    const nextValueStep2 = solver.computeNextValue(2);
    expect(nextValueStep2).toBeCloseTo(1.225, 6);
  });

  it("should compute the final estimate (step 3) correctly", () => {
    const initialValue = 2.0;
    const h = 0.1;
    const solver = new ODESolver(initialValue, h);

    // Let's update estimates as if the derivative at each step were constant = 2.0
    solver.updateEstimate(0, 2.0); // k[0] = 0.2
    solver.updateEstimate(1, 2.0); // k[1] = 0.2
    solver.updateEstimate(2, 2.0); // k[2] = 0.2
    solver.updateEstimate(3, 2.0); // k[3] = 0.2

    // computeFinalEstimate() is just computeNextValue(3)
    // For step=3, we sum:
    //   v_3 = initialValue
    //         + COEFFICIENTS[0][3] * k[0] = (2/9)   * 0.2 = 0.044444...
    //         + COEFFICIENTS[1][3] * k[1] = (1/3)   * 0.2 = 0.066666...
    //         + COEFFICIENTS[2][3] * k[2] = (4/9)   * 0.2 = 0.088888...
    // total = 2.0 + 0.0444444 + 0.0666667 + 0.0888889 ≈ 2.2
    const finalEstimate = solver.computeFinalEstimate();
    expect(finalEstimate).toBeCloseTo(2.2, 4);
  });

  it("should estimate error correctly", () => {
    const initialValue = 0.0;
    const h = 0.1;
    const solver = new ODESolver(initialValue, h);

    // Assign some dummy derivative values
    solver.updateEstimate(0, 1.0); // k[0] = 0.1
    solver.updateEstimate(1, 2.0); // k[1] = 0.2
    solver.updateEstimate(2, -1.0); // k[2] = -0.1
    solver.updateEstimate(3, 0.5); // k[3] = 0.05

    // error = abs(
    //  (-5/72)*k[0] + (1/12)*k[1] + (1/9)*k[2] + (-1/8)*k[3]
    // )
    // Plugging in:
    //  = abs(
    //    (-5/72)*0.1 + (1/12)*0.2 + (1/9)*(-0.1) + (-1/8)*0.05
    //  )
    // Let's compute that step by step:
    // (-5/72)*0.1   = -5/720 = -0.00694444...
    // (1/12)*0.2    = 0.2/12 = 0.01666667
    // (1/9)*(-0.1)  = -0.1/9 = -0.01111111...
    // (-1/8)*0.05   = -0.05/8 = -0.00625
    // Sum = -0.00694444 + 0.01666667 - 0.01111111 - 0.00625
    //     = -0.00763888...
    // Absolute value ≈ 0.00763888
    const error = solver.estimateError();
    expect(error).toBeCloseTo(0.00764, 5);
  });

  it("should compute the correct next times for each step", () => {
    const solver = new ODESolver(1.0, 0.2);

    // step=0 => TIME_STEPS[0] * h = 0 * 0.2 = 0
    expect(solver.computeNextTime(0)).toBeCloseTo(0.0, 6);
    // step=1 => 0.5 * 0.2 = 0.1
    expect(solver.computeNextTime(1)).toBeCloseTo(0.1, 6);
    // step=2 => 0.75 * 0.2 = 0.15
    expect(solver.computeNextTime(2)).toBeCloseTo(0.15, 6);
    // step=3 => 1.0 * 0.2 = 0.2
    expect(solver.computeNextTime(3)).toBeCloseTo(0.2, 6);
  });
});

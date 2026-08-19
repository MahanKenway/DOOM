export class ODESolver {
  public static readonly MIN_TIME_STEP = 0.01;
  public static readonly MAX_TIME_STEP = 0.1;
  public static readonly MAX_TIME_STEP_DISTRIBUTION = 0.2;
  public static readonly NUM_ESTIMATES = 4;
  public static readonly TIME_STEP_EXPONENT = 1.0 / 3.0;

  private static readonly TIME_STEPS: number[] = [0, 0.5, 0.75, 1];
  private static readonly COEFFICIENTS: number[][] = [
    [0, 0.5, 0.0, 2.0 / 9.0],
    [0, 0.0, 0.75, 1.0 / 3.0],
    [0, 0.0, 0.0, 4.0 / 9.0],
    [0, 0.0, 0.0, 0.0],
  ];
  private static readonly ERRORS: number[] = [
    -5.0 / 72.0,
    1.0 / 12.0,
    1.0 / 9.0,
    -1.0 / 8.0,
  ];

  private readonly k: number[];
  private readonly initialValue: number;
  private readonly h: number;

  constructor(initialValue: number, h: number) {
    this.initialValue = initialValue;
    this.h = h;
    this.k = new Array<number>(ODESolver.NUM_ESTIMATES).fill(0);
  }

  public updateEstimate(step: number, value: number): void {
    this.k[step] = this.h * value;
  }

  public computeFinalEstimate(): number {
    return this.computeNextValue(ODESolver.NUM_ESTIMATES - 1);
  }

  public estimateError(): number {
    let error = 0;
    for (let i = 0; i < ODESolver.NUM_ESTIMATES; i++) {
      error += ODESolver.ERRORS[i] * this.k[i];
    }
    return Math.abs(error);
  }

  public computeNextValue(step: number): number {
    let v = this.initialValue;
    for (let i = 0; i < step; i++) {
      v += ODESolver.COEFFICIENTS[i][step] * this.k[i];
    }
    return v;
  }

  public computeNextTime(step: number): number {
    return ODESolver.TIME_STEPS[step] * this.h;
  }
}

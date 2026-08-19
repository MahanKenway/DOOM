import { Matrices, Matrix4 } from "../math/matrices.ts";

export class MatrixStack {
  private stack: Matrix4[];
  private index: number;

  constructor() {
    this.stack = [Matrices.createIdentity()];
    this.index = 0;
  }

  get current(): Matrix4 {
    return this.stack[this.index];
  }

  public load(matrix: Matrix4): void {
    this.stack[this.index] = matrix;
  }

  public push(): void {
    const currentMatrix = this.stack[this.index];
    this.stack.push([...currentMatrix]);
    this.index++;
  }

  public pop(): void {
    this.stack.pop();
    this.index--;
  }

  public loadIdentity(): void {
    this.load(Matrices.createIdentity());
  }

  public multiply(matrix: Matrix4): void {
    const currentMatrix = this.stack[this.index];
    this.stack[this.index] = Matrices.multiply(matrix, currentMatrix);
  }
}

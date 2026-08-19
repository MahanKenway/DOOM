import { MathUtil } from "../math/math-util.ts";

export class SphereMesh {
  readonly vertices: number[];
  readonly normals: number[];
  readonly indices: number[];

  private constructor(
    vertices: number[],
    normals: number[],
    indices: number[],
  ) {
    this.vertices = vertices;
    this.normals = normals;
    this.indices = indices;
  }

  public static generate(
    radius: number,
    slices: number,
    stacks: number,
  ): SphereMesh {
    const vertices: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let stack = 0; stack <= stacks; stack++) {
      const stackAngle = (Math.PI / stacks) * stack;
      const sinStack = Math.sin(stackAngle);
      const cosStack = Math.cos(stackAngle);

      for (let slice = 0; slice <= slices; slice++) {
        const sliceAngle = (MathUtil.PI_2 / slices) * slice;
        const sinSlice = Math.sin(sliceAngle);
        const cosSlice = Math.cos(sliceAngle);

        const x = radius * sinStack * cosSlice;
        const y = radius * sinStack * sinSlice;
        const z = radius * cosStack;

        const nx = sinStack * cosSlice;
        const ny = sinStack * sinSlice;
        const nz = cosStack;

        vertices.push(x, y, z);
        normals.push(nx, ny, nz);
      }
    }

    for (let stack = 0; stack < stacks; stack++) {
      for (let slice = 0; slice < slices; slice++) {
        const first = stack * (slices + 1) + slice;
        const second = first + slices + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    return new SphereMesh(vertices, normals, indices);
  }
}

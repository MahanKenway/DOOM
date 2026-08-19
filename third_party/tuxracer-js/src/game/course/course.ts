import { CourseField } from "./course-field.ts";
import { CourseRenderer } from "./course-renderer.ts";
import { Vector3, Vectors } from "../../math/vectors.ts";
import { Plane } from "../../math/planes.ts";
import { MathUtil } from "../../math/math-util.ts";
import { Terrain } from "./terrains.ts";
import { GameContext } from "../game-context.ts";

export class Course {
  private static readonly NORMAL_INTERPOLATION = 0.05;

  public readonly numFieldsX: number;
  public readonly numFieldsY: number;

  private readonly fields: CourseField[];
  private readonly renderer: CourseRenderer;

  constructor(numFieldsX: number, numFieldsY: number, fields: CourseField[]) {
    this.numFieldsX = numFieldsX;
    this.numFieldsY = numFieldsY;
    this.fields = fields;

    this.renderer = new CourseRenderer();
  }

  public async init(): Promise<void> {
    await this.renderer.init(this.numFieldsX, this.numFieldsY, this.fields);
  }

  public draw(): void {
    this.renderer.draw();
  }

  public findYPosition(x: number, z: number): number {
    const pointIndices = this.getIndicesForPoint(x, z);
    const [u, v] = this.findBarycentricCoords(x, z, pointIndices);

    const p0 = this.getVertex(pointIndices[0][0], pointIndices[0][1]);
    const p1 = this.getVertex(pointIndices[1][0], pointIndices[1][1]);
    const p2 = this.getVertex(pointIndices[2][0], pointIndices[2][1]);

    return u * p0[1] + v * p1[1] + (1 - u - v) * p2[1];
  }

  public findNormal(x: number, z: number): Vector3 {
    const pointIndices = this.getIndicesForPoint(x, z);
    const [u, v] = this.findBarycentricCoords(x, z, pointIndices);
    const w = 1 - u - v;

    const n0 = this.getNormal(pointIndices[0][0], pointIndices[0][1]);
    const n1 = this.getNormal(pointIndices[1][0], pointIndices[1][1]);
    const n2 = this.getNormal(pointIndices[2][0], pointIndices[2][1]);

    const p0 = this.getVertex(pointIndices[0][0], pointIndices[0][1]);
    const p1 = this.getVertex(pointIndices[1][0], pointIndices[1][1]);
    const p2 = this.getVertex(pointIndices[2][0], pointIndices[2][1]);

    const smoothNormal = Vectors.add(
      Vectors.multiply(u, n0),
      Vectors.add(Vectors.multiply(v, n1), Vectors.multiply(w, n2)),
    );

    const trigNormal = Vectors.normalize(
      Vectors.computeCrossProduct(
        Vectors.subtract(p1, p0),
        Vectors.subtract(p2, p0),
      ),
    );

    const minBarycentric = Math.min(u, v, w);
    const factor = Math.min(minBarycentric / Course.NORMAL_INTERPOLATION, 1);

    return Vectors.normalize(
      Vectors.add(
        Vectors.multiply(factor, trigNormal),
        Vectors.multiply(1 - factor, smoothNormal),
      ),
    );
  }

  public findPlane(x: number, z: number): Plane {
    const y = this.findYPosition(x, z);
    const normal = this.findNormal(x, z);
    const distance = -Vectors.computeDotProduct(normal, [x, y, z]);
    return { normal, distance };
  }

  public findFrictionAndDepth(x: number, z: number): [number, number] {
    const pointIndices = this.getIndicesForPoint(x, z);
    const [u, v] = this.findBarycentricCoords(x, z, pointIndices);
    const w = 1 - u - v;

    const t0 = this.getTerrain(pointIndices[0][0], pointIndices[0][1]);
    const t1 = this.getTerrain(pointIndices[1][0], pointIndices[1][1]);
    const t2 = this.getTerrain(pointIndices[2][0], pointIndices[2][1]);

    const friction = u * t0.friction + v * t1.friction + w * t2.friction;
    const depth = u * t0.depth + v * t1.depth + w * t2.depth;
    return [friction, depth];
  }

  public findTerrain(x: number, z: number): Terrain {
    const pointIndices = this.getIndicesForPoint(x, z);
    const [u, v] = this.findBarycentricCoords(x, z, pointIndices);
    const w = 1 - u - v;

    if (u >= v && u >= w) {
      return this.getTerrain(pointIndices[0][0], pointIndices[0][1]);
    } else if (v >= u && v >= w) {
      return this.getTerrain(pointIndices[1][0], pointIndices[1][1]);
    } else {
      return this.getTerrain(pointIndices[2][0], pointIndices[2][1]);
    }
  }

  public canHaveTrackMarks(x: number, z: number): boolean {
    const pointIndices = this.getIndicesForPoint(x, z);
    const [u, v] = this.findBarycentricCoords(x, z, pointIndices);

    const t0 = this.getTerrain(pointIndices[0][0], pointIndices[0][1]);
    const t1 = this.getTerrain(pointIndices[1][0], pointIndices[1][1]);
    const t2 = this.getTerrain(pointIndices[2][0], pointIndices[2][1]);

    let hasTrackMarks = t0.hasTrackmarks ? u : 0;
    hasTrackMarks += t1.hasTrackmarks ? v : 0;
    hasTrackMarks += t2.hasTrackmarks ? 1 - u - v : 0;
    return hasTrackMarks >= 0.5;
  }

  private getVertex(x: number, y: number): Vector3 {
    return this.fields[x + this.numFieldsX * y].point;
  }

  private getNormal(x: number, y: number): Vector3 {
    return this.fields[x + this.numFieldsX * y].normal;
  }

  private getTerrain(x: number, y: number): Terrain {
    return this.fields[x + this.numFieldsX * y].terrain;
  }

  private findBarycentricCoords(
    x: number,
    z: number,
    pointIndices: number[][],
  ): [number, number] {
    const xIndex = (x / GameContext.courseConfig.width) * (this.numFieldsX - 1);
    const yIndex =
      (-z / GameContext.courseConfig.length) * (this.numFieldsY - 1);

    const dX = pointIndices[0][0] - pointIndices[2][0];
    const dZ = pointIndices[0][1] - pointIndices[2][1];
    const eX = pointIndices[1][0] - pointIndices[2][0];
    const eZ = pointIndices[1][1] - pointIndices[2][1];
    const qX = xIndex - pointIndices[2][0];
    const qZ = yIndex - pointIndices[2][1];

    const invDet = 1 / (dX * eZ - dZ * eX);
    const u = (qX * eZ - qZ * eX) * invDet;
    const v = (qZ * dX - qX * dZ) * invDet;

    return [u, v];
  }

  private getIndicesForPoint(x: number, z: number): number[][] {
    const xIndex = (x / GameContext.courseConfig.width) * (this.numFieldsX - 1);
    const yIndex =
      (-z / GameContext.courseConfig.length) * (this.numFieldsY - 1);

    const xIndexLimited = MathUtil.clamp(0, xIndex, this.numFieldsX - 1);
    const yIndexLimited = MathUtil.clamp(0, yIndex, this.numFieldsY - 1);

    let x0 = Math.floor(xIndexLimited);
    let x1 = Math.ceil(xIndexLimited);
    let y0 = Math.floor(yIndexLimited);
    let y1 = Math.ceil(yIndexLimited);

    if (x0 === x1) {
      if (x1 < this.numFieldsX - 1) {
        x1++;
      } else {
        x0--;
      }
    }

    if (y0 === y1) {
      if (y1 < this.numFieldsY - 1) {
        y1++;
      } else {
        y0--;
      }
    }

    if ((x0 + y0) % 2 === 0) {
      if (yIndex - y0 < xIndex - x0) {
        return [
          [x0, y0],
          [x1, y0],
          [x1, y1],
        ];
      } else {
        return [
          [x1, y1],
          [x0, y1],
          [x0, y0],
        ];
      }
    } else {
      if (yIndex - y0 + xIndex - x0 < 1) {
        return [
          [x0, y0],
          [x1, y0],
          [x0, y1],
        ];
      } else {
        return [
          [x1, y1],
          [x0, y1],
          [x1, y0],
        ];
      }
    }
  }
}

import { Bitmap } from "../../util/bitmap.ts";
import { MathUtil } from "../../math/math-util.ts";
import { CourseField } from "./course-field.ts";
import { Course } from "./course.ts";
import { Vector3, Vectors } from "../../math/vectors.ts";
import { Terrains } from "./terrains.ts";
import { GameContext } from "../game-context.ts";

export namespace CourseLoader {
  const BASE_HEIGHT = 127;

  export async function load(): Promise<Course> {
    const elevationMap = await Bitmap.loadFromFile(
      `assets/course/${GameContext.courseConfig.key}/elevation.png`,
      true,
    );
    const terrainMap = await Bitmap.loadFromFile(
      `assets/course/${GameContext.courseConfig.key}/terrain.png`,
    );

    const numX = elevationMap.width;
    const numY = elevationMap.height;

    const slope = Math.tan(MathUtil.toRadians(GameContext.courseConfig.angle));

    const fields: CourseField[] = [];

    for (let y = 0; y < numY; y++) {
      for (let x = 0; x < numX; x++) {
        const index = numX - x - 1 + y * numX;
        const elevation =
          ((elevationMap.data[index] - BASE_HEIGHT) / 255) *
          GameContext.courseConfig.scale;
        const elevationWithSlope =
          elevation - (y / numY) * GameContext.courseConfig.length * slope;
        const courseX = (x / (numX - 1)) * GameContext.courseConfig.width;
        const courseZ = (-y / (numY - 1)) * GameContext.courseConfig.length;
        const point = [courseX, elevationWithSlope, courseZ];

        const terrainColor = terrainMap.data[index];
        const terrain = Terrains.findMatchingTerrain(terrainColor);
        fields[x + y * numX] = { point, terrain } as CourseField;
      }
    }

    computeNormals(fields, numX, numY);

    return new Course(numX, numY, fields);
  }

  function computeNormals(
    fields: CourseField[],
    numX: number,
    numY: number,
  ): void {
    for (let y = 0; y < numY; y++) {
      for (let x = 0; x < numX; x++) {
        let normal: Vector3 = Vectors.ZERO;
        const p0 = getPoint(fields, x, y, numX);

        if ((x + y) % 2 === 0) {
          if (x > 0 && y > 0) {
            normal = updateNormal(
              p0,
              getPoint(fields, x, y - 1, numX),
              getPoint(fields, x - 1, y - 1, numX),
              normal,
            );
            normal = updateNormal(
              p0,
              getPoint(fields, x - 1, y - 1, numX),
              getPoint(fields, x - 1, y, numX),
              normal,
            );
          }
          if (x > 0 && y < numY - 1) {
            normal = updateNormal(
              p0,
              getPoint(fields, x - 1, y, numX),
              getPoint(fields, x - 1, y + 1, numX),
              normal,
            );
            normal = updateNormal(
              p0,
              getPoint(fields, x - 1, y + 1, numX),
              getPoint(fields, x, y + 1, numX),
              normal,
            );
          }
          if (x < numX - 1 && y > 0) {
            normal = updateNormal(
              p0,
              getPoint(fields, x + 1, y, numX),
              getPoint(fields, x + 1, y - 1, numX),
              normal,
            );
            normal = updateNormal(
              p0,
              getPoint(fields, x + 1, y - 1, numX),
              getPoint(fields, x, y - 1, numX),
              normal,
            );
          }
          if (x < numX - 1 && y < numY - 1) {
            normal = updateNormal(
              p0,
              getPoint(fields, x + 1, y, numX),
              getPoint(fields, x + 1, y + 1, numX),
              normal,
            );
            normal = updateNormal(
              p0,
              getPoint(fields, x + 1, y + 1, numX),
              getPoint(fields, x, y + 1, numX),
              normal,
            );
          }
        } else {
          if (x > 0 && y > 0) {
            normal = updateNormal(
              p0,
              getPoint(fields, x, y - 1, numX),
              getPoint(fields, x - 1, y, numX),
              normal,
            );
          }
          if (x > 0 && y < numY - 1) {
            normal = updateNormal(
              p0,
              getPoint(fields, x - 1, y, numX),
              getPoint(fields, x, y + 1, numX),
              normal,
            );
          }
          if (x < numX - 1 && y > 0) {
            normal = updateNormal(
              p0,
              getPoint(fields, x + 1, y, numX),
              getPoint(fields, x, y - 1, numX),
              normal,
            );
          }
          if (x < numX - 1 && y < numY - 1) {
            normal = updateNormal(
              p0,
              getPoint(fields, x + 1, y, numX),
              getPoint(fields, x, y + 1, numX),
              normal,
            );
          }
        }

        fields[x + y * numX].normal = Vectors.normalize(normal);
      }
    }
  }

  function updateNormal(
    p0: Vector3,
    p1: Vector3,
    p2: Vector3,
    normal: Vector3,
  ): Vector3 {
    const v1 = Vectors.subtract(p1, p0);
    const v2 = Vectors.subtract(p2, p0);
    const n = Vectors.normalize(Vectors.computeCrossProduct(v2, v1));
    return Vectors.add(normal, n);
  }

  function getPoint(
    fields: CourseField[],
    x: number,
    y: number,
    numX: number,
  ): Vector3 {
    return fields[x + numX * y].point;
  }
}

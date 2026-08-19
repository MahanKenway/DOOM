import { Vector3 } from "../../math/vectors.ts";
import { Terrain } from "./terrains.ts";

export type CourseField = {
  point: Vector3;
  normal: Vector3;
  terrain: Terrain;
};

import { Vector3, Vectors } from "./vectors.ts";

export type Plane = {
  distance: number;
  normal: Vector3;
};

export namespace Planes {
  export function computeDistanceToPlane(plane: Plane, point: Vector3): number {
    return Vectors.computeDotProduct(plane.normal, point) + plane.distance;
  }

  export function projectToPlane(plane: Plane, vector: Vector3): Vector3 {
    return Vectors.projectToPlane(plane.normal, vector);
  }
}

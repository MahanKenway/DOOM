import { Vector3 } from "../../math/vectors.ts";

export type Keyframe = {
  time: number;
  position: Vector3;
  rotation: Vector3;
  neckRotationZ: number;
  headRotationY: number;
  leftShoulderRotationY: number;
  leftShoulderRotationZ: number;
  rightShoulderRotationY: number;
  rightShoulderRotationZ: number;
  leftHipRotationZ: number;
  rightHipRotationZ: number;
  leftKneeRotationZ: number;
  rightKneeRotationZ: number;
  leftAnkleRotationZ: number;
  rightAnkleRotationZ: number;
};

import { CharacterMaterial } from "./character-material.ts";
import { CharacterJoint } from "./character-joint.ts";
import { Matrix4 } from "../../math/matrices.ts";

export type CharacterNode = {
  parent: CharacterNode;
  material: CharacterMaterial | undefined;
  joint: CharacterJoint | undefined;
  isVisible: boolean;
  hasShadow: boolean;
  numSphereDivisions: number | undefined;
  transformation: Matrix4;
};

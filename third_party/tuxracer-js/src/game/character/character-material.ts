import { Color } from "../../util/color.ts";

export type CharacterMaterial = {
  diffuseColor: Color;
  specularColor: Color;
  specularExponent: number;
};

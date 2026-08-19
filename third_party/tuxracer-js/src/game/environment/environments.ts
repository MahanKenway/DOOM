import { Color } from "../../util/color.ts";
import { Vector3 } from "../../math/vectors.ts";

export type Environment = {
  key: string;
  fog: Fog;
  lights: Light[];
  particleColor: Color;
  skyboxTexture: string;
};

export type Light = {
  ambientColor: Color;
  diffuseColor: Color;
  specularColor: Color;
  position: Vector3;
};

export type Fog = {
  start: number;
  end: number;
  color: Color;
};

export namespace Environments {
  export const SUNNY: Environment = {
    key: "sunny",
    fog: {
      start: 40,
      end: 75,
      color: [1.0, 1.0, 1.0, 1.0],
    },
    lights: [
      {
        ambientColor: [0.45, 0.53, 0.75, 1.0],
        diffuseColor: [1.0, 0.9, 1.0, 1.0],
        specularColor: [0.0, 0.0, 0.0, 0.0],
        position: [1.0, 1.0, 0.0],
      },
      {
        ambientColor: [0.0, 0.0, 0.0, 0.0],
        diffuseColor: [0.3, 0.3, 0.3, 1.0],
        specularColor: [0.8, 0.8, 0.8, 1.0],
        position: [-1.0, 1.0, 2.0],
      },
    ],
    particleColor: [0.85, 0.9, 1.0, 1.0],
    skyboxTexture: "sunny.webp",
  };

  export const NIGHT: Environment = {
    key: "night",
    fog: {
      start: 0.0,
      end: 75.0,
      color: [0.0, 0.09, 0.34, 1.0],
    },
    lights: [
      {
        ambientColor: [0.0, 0.09, 0.34, 1.0],
        diffuseColor: [0.39, 0.51, 0.88, 1.0],
        specularColor: [0.1, 0.1, 0.1, 1.0],
        position: [1.0, 1.0, 1.0],
      },
    ],
    particleColor: [0.39, 0.51, 0.88, 1.0],
    skyboxTexture: "night.webp",
  };

  export const CLOUDY: Environment = {
    key: "cloudy",
    fog: {
      start: -10.0,
      end: 80.0,
      color: [0.58, 0.59, 0.65, 1.0],
    },
    lights: [
      {
        ambientColor: [0.39, 0.4, 0.44, 1.0],
        diffuseColor: [0.45, 0.43, 0.47, 1.0],
        specularColor: [0.0, 0.0, 0.0, 0.0],
        position: [1.0, 1.0, 1.0],
      },
      {
        ambientColor: [0.0, 0.0, 0.0, 0.0],
        diffuseColor: [0.0, 0.0, 0.0, 0.0],
        specularColor: [0.5, 0.5, 0.5, 1.0],
        position: [1.0, 1.0, 2.0],
      },
    ],
    particleColor: [0.92, 0.88, 1.0, 1.0],
    skyboxTexture: "cloudy.webp",
  };

  export const ALL: Environment[] = [
    SUNNY, CLOUDY, NIGHT
  ];

  export const BY_KEY: Map<string, Environment> = new Map(ALL.map(environment => [environment.key, environment]));
}

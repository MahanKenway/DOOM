import { Sound } from "../audio/sound.ts";

export type Terrain = {
  texture: string;
  glId: number;
  friction: number;
  depth: number;
  hasTrackmarks: boolean;
  sound: Sound;
};

export namespace Terrains {
  const ice: Terrain = {
    texture: "ice.webp",
    glId: 0,
    friction: 0.2,
    depth: 0.03,
    hasTrackmarks: false,
    sound: Sound.TERRAIN_ICE,
  };

  const snow: Terrain = {
    texture: "snow.webp",
    glId: 2,
    friction: 0.35,
    depth: 0.11,
    hasTrackmarks: true,
    sound: Sound.TERRAIN_SNOW,
  };

  const rock: Terrain = {
    texture: "rock.webp",
    glId: 1,
    friction: 0.7,
    depth: 0.01,
    hasTrackmarks: false,
    sound: Sound.TERRAIN_ROCK,
  };

  export function findMatchingTerrain(color: number): Terrain {
    const r = (color >> 16) & 0xff;
    if (r < 45) {
      return ice;
    } else if (r > 205) {
      return snow;
    } else {
      return rock;
    }
  }
}

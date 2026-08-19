import { Sound } from "./sound.ts";
import { Howl } from "howler";

export class SoundPlayer {
  private readonly sounds: Map<Sound, Howl>;

  constructor() {
    this.sounds = new Map();
  }

  public init(): void {
    this.sounds.set(Sound.PICKUP_1, this.loadSound("pickup1"));
    this.sounds.set(Sound.PICKUP_2, this.loadSound("pickup2"));
    this.sounds.set(Sound.PICKUP_3, this.loadSound("pickup3"));
    this.sounds.set(Sound.TREE_HIT, this.loadSound("tree-hit"));

    this.sounds.set(Sound.TERRAIN_ICE, this.loadSound("terrain-ice", true));
    this.sounds.set(Sound.TERRAIN_ROCK, this.loadSound("terrain-rock", true));
    this.sounds.set(Sound.TERRAIN_SNOW, this.loadSound("terrain-snow", true));

    /*
    this.sounds.set(Sound.TERRAIN_GRASS, this.loadSound("terrain-grass", true));
    this.sounds.set(
      Sound.TERRAIN_LEAVES,
      this.loadSound("terrain-leaves", true),
    );
    this.sounds.set(Sound.TERRAIN_MUD, this.loadSound("terrain-mud", true));
     */
  }

  public playSound(sound: Sound): void {
    this.findHowl(sound).play();
  }

  public stopSound(sound: Sound): void {
    this.findHowl(sound).stop();
  }

  private loadSound(name: string, loop = false): Howl {
    return new Howl({
      src: [`assets/sound/${name}.mp3`],
      loop,
    });
  }

  private findHowl(sound: Sound): Howl {
    const howl = this.sounds.get(sound);
    if (!howl) {
      throw new Error("Unknown sound: " + sound);
    }
    return howl;
  }
}

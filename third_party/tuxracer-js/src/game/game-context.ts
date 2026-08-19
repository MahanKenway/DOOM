import { GameState } from "./game-state.ts";
import { Environment } from "./environment/environments.ts";
import { CourseConfig } from "./course/course-configs.ts";
import { Player } from "./player.ts";
import { Control } from "./control.ts";
import { Items } from "./items/items.ts";
import { Course } from "./course/course.ts";
import { SoundPlayer } from "./audio/sound-player.ts";

export namespace GameContext {
  export let state: GameState;
  export let collectedItems: number;
  export let startTime: number | undefined;
  export let endTime: number | undefined;

  export let environment: Environment;
  export let courseConfig: CourseConfig;

  export let player: Player;
  export let control: Control;
  export let items: Items;
  export let course: Course;
  export let soundPlayer: SoundPlayer;
}

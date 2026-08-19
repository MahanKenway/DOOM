import { Skybox } from "./environment/skybox.ts";
import { GlUtil } from "../gl/gl-util.ts";
import { GlContext } from "../gl/gl-context.ts";
import { Color } from "../util/color.ts";
import { Camera } from "./camera/camera.ts";
import { CourseLoader } from "./course/course-loader.ts";
import { CourseConfig } from "./course/course-configs.ts";
import { Character } from "./character/character.ts";
import { CharacterLoader } from "./character/character-loader.ts";
import { Animation } from "./animation/animation.ts";
import { AnimationLoader } from "./animation/animation-loader.ts";
import { Player } from "./player.ts";
import { CharacterJoint } from "./character/character-joint.ts";
import { Matrix4 } from "../math/matrices.ts";
import { KeyState } from "../input/key-state.ts";
import { Control } from "./control.ts";
import { ItemsLoader } from "./items/items-loader.ts";
import { TrackMarks } from "./track-marks.ts";
import { Environment } from "./environment/environments.ts";
import { FogPanel } from "./environment/fog-panel.ts";
import { ViewMode } from "./camera/view-mode.ts";
import { GameState } from "./game-state.ts";
import { GameContext } from "./game-context.ts";
import { MusicPlayer } from "./audio/music-player.ts";
import { SoundPlayer } from "./audio/sound-player.ts";
import { Terrain } from "./course/terrains.ts";
import { TouchState } from "../input/touch-state.ts";
import { CharacterName } from "./character/character-name.ts";
import { AnimationName } from "./animation/animation-name.ts";

export class RacingScene {
  private static readonly BACKGROUND_COLOR: Color = [0.4, 0.6, 0.8, 1];
  private static readonly BREAKING_TARGET_SPEED = 3;

  private skybox: Skybox;
  private fogPanel: FogPanel;
  private camera: Camera;
  private trackMarks: TrackMarks;
  private character: Character;
  private musicPlayer: MusicPlayer;

  private introAnimation: Animation;
  private outroAnimation: Animation;

  private currentTerrain: Terrain | undefined;

  public async init(
    courseConfig: CourseConfig,
    environment: Environment,
  ): Promise<void> {
    GameContext.environment = environment;
    GameContext.courseConfig = courseConfig;

    GameContext.state = GameState.INTRO;
    GameContext.collectedItems = 0;

    GameContext.course = await CourseLoader.load();
    await GameContext.course.init();

    GameContext.items = await ItemsLoader.load();
    await GameContext.items.init();

    GameContext.player = new Player();
    GameContext.player.init();

    GameContext.control = new Control();

    GameContext.soundPlayer = new SoundPlayer();
    GameContext.soundPlayer.init();

    this.skybox = new Skybox();
    await this.skybox.init();

    this.fogPanel = new FogPanel();
    await this.fogPanel.init();

    this.camera = new Camera();
    this.camera.init();

    this.character = await CharacterLoader.load(CharacterName.TUX);
    await this.character.init();

    this.trackMarks = new TrackMarks();
    await this.trackMarks.init();

    this.musicPlayer = new MusicPlayer();
    this.musicPlayer.init();
    this.musicPlayer.playRacingMusic();

    this.introAnimation = await AnimationLoader.load(
      CharacterName.TUX,
      AnimationName.INTRO,
    );
    this.introAnimation.start();

    this.outroAnimation = await AnimationLoader.load(
      CharacterName.TUX,
      AnimationName.OUTRO_WIN,
    );
  }

  public update(
    timeStep: number,
    keyState: KeyState,
    touchState: TouchState,
  ): void {
    GameContext.control.update(keyState, touchState);
    const transitions = this.updateGameState(timeStep);
    this.camera.update(timeStep);
    this.draw(transitions);
  }

  private draw(transitions: Map<CharacterJoint, Matrix4>) {
    GlUtil.clearRenderContext(RacingScene.BACKGROUND_COLOR, GlContext.gl);
    this.skybox.draw();
    this.fogPanel.draw();
    GameContext.course.draw();
    this.trackMarks.draw();
    GameContext.items.draw();
    this.character.draw(transitions);
  }

  private updateGameState(timeStep: number): Map<CharacterJoint, Matrix4> {
    switch (GameContext.state) {
      case GameState.INTRO:
        this.introAnimation.update(timeStep);
        if (!this.introAnimation.active) {
          GameContext.state = GameState.RACING;
          GameContext.startTime = Date.now();
          this.camera.viewMode = ViewMode.FOLLOWING;
        }
        return this.introAnimation.transitions;

      case GameState.RACING:
        GameContext.player.update(timeStep);
        this.updateTerrainSound();
        this.trackMarks.update();
        GameContext.collectedItems += GameContext.items.handleItemCollection();
        if (
          -GameContext.player.position[2] >= GameContext.courseConfig.playLength
        ) {
          GameContext.endTime = Date.now();
          if (GameContext.courseConfig.showOutro) {
            GameContext.player.saveFinishSpeed();
            GameContext.state = GameState.BREAKING;
          } else {
            this.musicPlayer.fadeOut(500);
            GameContext.state = GameState.TERMINATED;
          }
        }
        return GameContext.player.transitions;

      case GameState.BREAKING:
        GameContext.player.update(timeStep);
        this.updateTerrainSound();
        this.trackMarks.update();
        this.camera.incrementCameraDistance(timeStep);
        if (GameContext.player.speed < RacingScene.BREAKING_TARGET_SPEED) {
          this.outroAnimation.start();
          if (this.currentTerrain) {
            GameContext.soundPlayer.stopSound(this.currentTerrain?.sound);
          }
          this.musicPlayer.playWinningMusic();
          GameContext.state = GameState.OUTRO;
        }
        return GameContext.player.transitions;

      case GameState.OUTRO:
        this.outroAnimation.update(timeStep);
        if (!this.outroAnimation.active) {
          this.musicPlayer.fadeOut(500);
          GameContext.state = GameState.TERMINATED;
        }
        return this.outroAnimation.transitions;

      default:
        throw new Error("Unexpected game state: " + GameContext.state);
    }
  }

  private updateTerrainSound(): void {
    if (GameContext.player.isAirborne) {
      if (this.currentTerrain) {
        GameContext.soundPlayer.stopSound(this.currentTerrain.sound);
        delete this.currentTerrain;
      }
      return;
    }

    const position = GameContext.player.position;
    const terrain = GameContext.course.findTerrain(position[0], position[2]);

    if (this.currentTerrain !== terrain) {
      if (this.currentTerrain?.sound) {
        GameContext.soundPlayer.stopSound(this.currentTerrain.sound);
      }
      if (terrain.sound) {
        GameContext.soundPlayer.playSound(terrain.sound);
      }
      this.currentTerrain = terrain;
    }
  }
}

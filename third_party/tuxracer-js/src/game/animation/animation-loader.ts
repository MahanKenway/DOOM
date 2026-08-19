import { Vector3, Vectors } from "../../math/vectors.ts";
import { Keyframe } from "./keyframe.ts";
import { Animation } from "./animation.ts";
import { CharacterName } from "../character/character-name.ts";
import { AnimationName } from "./animation-name.ts";

export namespace AnimationLoader {
  type AnimationDto = {
    keyframes: KeyframeDto[];
  };

  type KeyframeDto = {
    time: number;
    position: Vector3 | undefined;
    rotation: Vector3 | undefined;
    neckRotationZ: number | undefined;
    headRotationY: number | undefined;
    leftShoulderRotationY: number | undefined;
    leftShoulderRotationZ: number | undefined;
    rightShoulderRotationY: number | undefined;
    rightShoulderRotationZ: number | undefined;
    leftHipRotationZ: number | undefined;
    rightHipRotationZ: number | undefined;
    leftKneeRotationZ: number | undefined;
    rightKneeRotationZ: number | undefined;
    leftAnkleRotationZ: number | undefined;
    rightAnkleRotationZ: number | undefined;
  };

  export async function load(
    characterName: CharacterName,
    animationName: AnimationName,
  ): Promise<Animation> {
    const response = await fetch(
      `assets/character/${characterName}/animation/${animationName}.json`,
    );
    const animationDto = (await response.json()) as AnimationDto;

    const keyframes = animationDto.keyframes.map((keyframeDto) =>
      mapToKeyframe(keyframeDto),
    );
    return new Animation(keyframes);
  }

  function mapToKeyframe(dto: KeyframeDto): Keyframe {
    return {
      time: dto.time,
      position: dto.position ?? Vectors.ZERO,
      rotation: dto.rotation ?? Vectors.ZERO,
      neckRotationZ: dto.neckRotationZ ?? 0,
      headRotationY: dto.headRotationY ?? 0,
      leftShoulderRotationY: dto.leftShoulderRotationY ?? 0,
      leftShoulderRotationZ: dto.leftShoulderRotationZ ?? 0,
      rightShoulderRotationY: dto.rightShoulderRotationY ?? 0,
      rightShoulderRotationZ: dto.rightShoulderRotationZ ?? 0,
      leftHipRotationZ: dto.leftHipRotationZ ?? 0,
      rightHipRotationZ: dto.rightHipRotationZ ?? 0,
      leftKneeRotationZ: dto.leftKneeRotationZ ?? 0,
      rightKneeRotationZ: dto.rightKneeRotationZ ?? 0,
      leftAnkleRotationZ: dto.leftAnkleRotationZ ?? 0,
      rightAnkleRotationZ: dto.rightAnkleRotationZ ?? 0,
    };
  }
}

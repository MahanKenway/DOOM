import { Keyframe } from "./keyframe.ts";
import { Vector3, Vectors } from "../../math/vectors.ts";
import { CharacterJoint } from "../character/character-joint.ts";
import { Matrices, Matrix4 } from "../../math/matrices.ts";
import { Axis } from "../../math/axis.ts";
import { MathUtil } from "../../math/math-util.ts";
import { GameContext } from "../game-context.ts";

export class Animation {
  private static readonly POSITION_Y_CORRECTION = 0.31;

  private readonly keyframes: Keyframe[];

  private keyframeTime: number;
  private keyframeIndex: number;
  private referencePosition: Vector3;

  readonly transitions: Map<CharacterJoint, Matrix4>;
  active: boolean;

  constructor(keyframes: Keyframe[]) {
    this.keyframes = keyframes;
    this.transitions = new Map<CharacterJoint, Matrix4>();
    this.active = false;
  }

  public start(): void {
    this.active = true;
    this.keyframeTime = 0;
    this.keyframeIndex = 0;
    this.referencePosition = GameContext.player.position;
    this.transitions.clear();
  }

  public update(timeStep: number): void {
    if (!this.active) {
      return;
    }

    this.keyframeTime += timeStep;
    if (this.keyframeTime >= this.keyframes[this.keyframeIndex].time) {
      this.keyframeIndex++;
      this.keyframeTime = 0;

      if (this.keyframeIndex >= this.keyframes.length - 1) {
        this.active = false;
        return;
      }
    }

    const keyframe = this.keyframes[this.keyframeIndex];
    const nextKeyframe = this.keyframes[this.keyframeIndex + 1];
    const fraction = (keyframe.time - this.keyframeTime) / keyframe.time;

    this.transitions.clear();
    this.updateRootPosition(keyframe, nextKeyframe, fraction);
    this.interpolate(keyframe, nextKeyframe, fraction);
  }

  private updateRootPosition(
    keyframe: Keyframe,
    nextKeyframe: Keyframe,
    fraction: number,
  ): void {
    const animationPosition = Vectors.interpolate(
      fraction,
      keyframe.position,
      nextKeyframe.position,
    );
    const playerX = animationPosition[0] + this.referencePosition[0];
    const playerZ = animationPosition[2] + this.referencePosition[2];
    const playerY =
      animationPosition[1] + GameContext.course.findYPosition(playerX, playerZ);

    GameContext.player.position = [playerX, playerY, playerZ];
    this.applyTransition(
      CharacterJoint.ROOT,
      Matrices.createTranslation(
        playerX,
        playerY + Animation.POSITION_Y_CORRECTION,
        playerZ,
      ),
    );
  }

  private interpolate(
    keyframe: Keyframe,
    nextKeyframe: Keyframe,
    fraction: number,
  ): void {
    const rotation = Vectors.interpolate(
      fraction,
      keyframe.rotation,
      nextKeyframe.rotation,
    );
    this.applyTransition(
      CharacterJoint.ROOT,
      Matrices.createRotation(rotation[1], Axis.Y),
    );
    this.applyTransition(
      CharacterJoint.ROOT,
      Matrices.createRotation(rotation[0], Axis.X),
    );
    this.applyTransition(
      CharacterJoint.ROOT,
      Matrices.createRotation(rotation[2], Axis.Z),
    );

    const neckRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.neckRotationZ,
      nextKeyframe.neckRotationZ,
    );
    this.applyTransition(
      CharacterJoint.NECK,
      Matrices.createRotation(neckRotationZ, Axis.Z),
    );

    const headRotationY = MathUtil.interpolate(
      fraction,
      keyframe.headRotationY,
      nextKeyframe.headRotationY,
    );
    this.applyTransition(
      CharacterJoint.HEAD,
      Matrices.createRotation(headRotationY, Axis.Y),
    );

    const leftShoulderRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.leftShoulderRotationZ,
      nextKeyframe.leftShoulderRotationZ,
    );
    this.applyTransition(
      CharacterJoint.LEFT_SHOULDER,
      Matrices.createRotation(leftShoulderRotationZ, Axis.Z),
    );

    const rightShoulderRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.rightShoulderRotationZ,
      nextKeyframe.rightShoulderRotationZ,
    );
    this.applyTransition(
      CharacterJoint.RIGHT_SHOULDER,
      Matrices.createRotation(rightShoulderRotationZ, Axis.Z),
    );

    const leftShoulderRotationY = MathUtil.interpolate(
      fraction,
      keyframe.leftShoulderRotationY,
      nextKeyframe.leftShoulderRotationY,
    );
    this.applyTransition(
      CharacterJoint.LEFT_SHOULDER,
      Matrices.createRotation(leftShoulderRotationY, Axis.Y),
    );

    const rightShoulderRotationY = MathUtil.interpolate(
      fraction,
      keyframe.rightShoulderRotationY,
      nextKeyframe.rightShoulderRotationY,
    );
    this.applyTransition(
      CharacterJoint.RIGHT_SHOULDER,
      Matrices.createRotation(rightShoulderRotationY, Axis.Y),
    );

    const leftHipRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.leftHipRotationZ,
      nextKeyframe.leftHipRotationZ,
    );
    this.applyTransition(
      CharacterJoint.LEFT_HIP,
      Matrices.createRotation(leftHipRotationZ, Axis.Z),
    );

    const rightHipRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.rightHipRotationZ,
      nextKeyframe.rightHipRotationZ,
    );
    this.applyTransition(
      CharacterJoint.RIGHT_HIP,
      Matrices.createRotation(rightHipRotationZ, Axis.Z),
    );

    const leftKneeRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.leftKneeRotationZ,
      nextKeyframe.leftKneeRotationZ,
    );
    this.applyTransition(
      CharacterJoint.LEFT_KNEE,
      Matrices.createRotation(leftKneeRotationZ, Axis.Z),
    );

    const rightKneeRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.rightKneeRotationZ,
      nextKeyframe.rightKneeRotationZ,
    );
    this.applyTransition(
      CharacterJoint.RIGHT_KNEE,
      Matrices.createRotation(rightKneeRotationZ, Axis.Z),
    );

    const leftAnkleRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.leftAnkleRotationZ,
      nextKeyframe.leftAnkleRotationZ,
    );
    this.applyTransition(
      CharacterJoint.LEFT_ANKLE,
      Matrices.createRotation(leftAnkleRotationZ, Axis.Z),
    );

    const rightAnkleRotationZ = MathUtil.interpolate(
      fraction,
      keyframe.rightAnkleRotationZ,
      nextKeyframe.rightAnkleRotationZ,
    );
    this.applyTransition(
      CharacterJoint.RIGHT_ANKLE,
      Matrices.createRotation(rightAnkleRotationZ, Axis.Z),
    );
  }

  private applyTransition(joint: CharacterJoint, transition: Matrix4): void {
    if (!this.transitions.has(joint)) {
      this.transitions.set(joint, transition);
    } else {
      const oldTransition = this.transitions.get(joint) as Matrix4;
      const newTransition = Matrices.multiply(transition, oldTransition);
      this.transitions.set(joint, newTransition);
    }
  }
}

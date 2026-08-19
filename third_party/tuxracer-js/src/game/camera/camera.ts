import { Matrices, Matrix4 } from "../../math/matrices.ts";
import { Vector3, Vectors } from "../../math/vectors.ts";
import { MathUtil } from "../../math/math-util.ts";
import { Axis } from "../../math/axis.ts";
import { GlContext } from "../../gl/gl-context.ts";
import { ViewMode } from "./view-mode.ts";
import { Quaternions } from "../../math/quaternions.ts";
import { GameContext } from "../game-context.ts";

export class Camera {
  private static readonly CAMERA_ANGLE_ABOVE_SLOPE = 10;
  private static readonly PLAYER_ANGLE_IN_CAMERA = 20;
  private static readonly MIN_CAMERA_HEIGHT = 1.5;
  private static readonly ABSOLUTE_MIN_CAMERA_HEIGHT = 0.3;
  private static readonly PLAYER_CAMERA_DISTANCE = 4;
  private static readonly MAX_INTERPOLATION_VALUE = 0.3;
  private static readonly MAX_CAMERA_PITCH = 40;
  private static readonly FOLLOW_ORBIT_TIME_CONSTANT = 0.06;
  private static readonly FOLLOW_ORIENT_TIME_CONSTANT = 0.06;
  private static readonly NO_INTERPOLATION_SPEED = 2.0;
  private static readonly BASELINE_INTERPOLATION_SPEED = 4.5;
  private static readonly CAMERA_DISTANCE_INCREMENT = 2;

  private playerDistance: number;
  private position: Vector3;
  private direction: Vector3;
  private viewVector: Vector3;

  viewMode: ViewMode;

  constructor() {
    this.playerDistance = Camera.PLAYER_CAMERA_DISTANCE;
    this.viewMode = ViewMode.ABOVE;
    this.direction = Vectors.NEGATIVE_Z_UNIT;
    this.position = Vectors.ZERO;
  }

  public init(): void {
    this.viewVector = this.createViewVector();
  }

  public incrementCameraDistance(timeStep: number): void {
    this.playerDistance += timeStep * Camera.CAMERA_DISTANCE_INCREMENT;
  }

  public update(timeStep: number): void {
    if (this.viewMode === ViewMode.ABOVE) {
      this.updateAboveView();
    } else if (this.viewMode === ViewMode.FOLLOWING) {
      this.updateFollowingView(timeStep);
    }

    this.applyViewMatrix();
  }

  private updateFollowingView(timeStep: number): void {
    const velocityDirection = Vectors.normalize(GameContext.player.velocity);
    const projectedVelocity = Vectors.normalize(
      Vectors.projectToPlane(velocityDirection, Vectors.Y_UNIT),
    );
    const rotation = Quaternions.createFromVectors(
      Vectors.NEGATIVE_Z_UNIT,
      projectedVelocity,
    );
    let viewVector = Vectors.rotateVector(rotation, this.viewVector);

    let cameraPosition = Vectors.add(GameContext.player.position, viewVector);

    let courseY = GameContext.course.findYPosition(
      cameraPosition[0],
      cameraPosition[2],
    );
    cameraPosition[1] = Math.max(
      cameraPosition[1],
      courseY + Camera.MIN_CAMERA_HEIGHT,
    );

    const tNorm =
      (GameContext.player.speed - Camera.NO_INTERPOLATION_SPEED) /
      (Camera.BASELINE_INTERPOLATION_SPEED - Camera.NO_INTERPOLATION_SPEED);
    const timeConstant =
      Camera.FOLLOW_ORBIT_TIME_CONSTANT * (1 / MathUtil.clamp(0, tNorm, 1));
    cameraPosition = this.interpolateCameraPosition(
      cameraPosition,
      timeStep,
      timeConstant,
    );
    cameraPosition = this.interpolateCameraPosition(
      cameraPosition,
      timeStep,
      timeConstant,
    );

    courseY = GameContext.course.findYPosition(
      cameraPosition[0],
      cameraPosition[2],
    );
    cameraPosition[1] = Math.max(
      cameraPosition[1],
      courseY + Camera.ABSOLUTE_MIN_CAMERA_HEIGHT,
    );

    viewVector = Vectors.subtract(cameraPosition, GameContext.player.position);
    const axis = Vectors.normalize(
      Vectors.computeCrossProduct(Vectors.Y_UNIT, viewVector),
    );
    const rotationMatrix = Matrices.createRotationAroundVector(
      Camera.PLAYER_ANGLE_IN_CAMERA,
      axis,
    );
    let newDirection = Vectors.negate(
      Vectors.transformVector(rotationMatrix, viewVector),
    );

    newDirection = this.interpolateCameraFrame(newDirection, timeStep);
    newDirection = this.interpolateCameraFrame(newDirection, timeStep);

    this.position = cameraPosition;
    this.direction = newDirection;
  }

  private updateAboveView(): void {
    this.position = Vectors.add(GameContext.player.position, this.viewVector);
    const courseY = GameContext.course.findYPosition(
      this.position[0],
      this.position[2],
    );
    this.position[1] = Math.max(
      this.position[1],
      courseY + Camera.MIN_CAMERA_HEIGHT,
    );

    const offset = Vectors.subtract(this.position, GameContext.player.position);
    const rotationMatrix = Matrices.createRotation(
      Camera.PLAYER_ANGLE_IN_CAMERA,
      Axis.X,
    );
    this.direction = Vectors.negate(
      Vectors.transformVector(rotationMatrix, offset),
    );
  }

  private interpolateCameraFrame(
    direction: Vector3,
    timeStep: number,
  ): Vector3 {
    const currentQuaternion = Quaternions.createLookRotationFromDirection(
      this.direction,
    );
    const targetQuaternion =
      Quaternions.createLookRotationFromDirection(direction);
    const alpha = Math.min(
      Camera.MAX_INTERPOLATION_VALUE,
      1 - Math.exp(-timeStep / Camera.FOLLOW_ORIENT_TIME_CONSTANT),
    );
    const interpolatedQuaternion = Quaternions.interpolate(
      currentQuaternion,
      targetQuaternion,
      alpha,
    );
    const mat = Matrices.createFromQuaternion(interpolatedQuaternion);
    return [-mat[Matrices.I2J0], -mat[Matrices.I2J1], -mat[Matrices.I2J2]];
  }

  private interpolateCameraPosition(
    targetPosition: Vector3,
    timeStep: number,
    timeConstant: number,
  ): Vector3 {
    const lastDirection = GameContext.player.lastPosition
      ? Vectors.normalize(
          Vectors.subtract(this.position, GameContext.player.lastPosition),
        )
      : Vectors.ZERO;
    const newDirection = Vectors.normalize(
      Vectors.subtract(targetPosition, GameContext.player.position),
    );
    const lastQuaternion = Quaternions.createFromVectors(
      Vectors.Y_UNIT,
      lastDirection,
    );
    const newQuaternion = Quaternions.createFromVectors(
      Vectors.Y_UNIT,
      newDirection,
    );
    const alpha = Math.min(
      Camera.MAX_INTERPOLATION_VALUE,
      1 - Math.exp(-timeStep / timeConstant),
    );
    const interpQuaternion = Quaternions.interpolate(
      lastQuaternion,
      newQuaternion,
      alpha,
    );
    let rotated = Vectors.rotateVector(interpQuaternion, Vectors.Y_UNIT);
    const theta = MathUtil.toDegrees(
      MathUtil.PI_0_5 -
        Math.acos(Vectors.computeDotProduct(rotated, Vectors.Y_UNIT)),
    );
    if (theta > Camera.MAX_CAMERA_PITCH) {
      const axis = Vectors.normalize(
        Vectors.computeCrossProduct(Vectors.Y_UNIT, rotated),
      );
      const correction = theta - Camera.MAX_CAMERA_PITCH;
      const correctionMatrix = Matrices.createRotationAroundVector(
        correction,
        axis,
      );
      rotated = Vectors.transformVector(correctionMatrix, rotated);
    }
    return Vectors.add(
      GameContext.player.position,
      Vectors.multiply(this.playerDistance, rotated),
    );
  }

  private applyViewMatrix(): void {
    const forward = Vectors.normalize(Vectors.negate(this.direction));
    const right = Vectors.normalize(
      Vectors.computeCrossProduct(Vectors.Y_UNIT, forward),
    );
    const up = Vectors.computeCrossProduct(forward, right);

    const dotRight = -Vectors.computeDotProduct(this.position, right);
    const dotUp = -Vectors.computeDotProduct(this.position, up);
    const dotForward = -Vectors.computeDotProduct(this.position, forward);

    const viewMatrix: Matrix4 = [
      right[0],
      up[0],
      forward[0],
      0,
      right[1],
      up[1],
      forward[1],
      0,
      right[2],
      up[2],
      forward[2],
      0,
      dotRight,
      dotUp,
      dotForward,
      1,
    ];

    GlContext.modelViewMatrix.load(viewMatrix);
    GlContext.viewMatrix = viewMatrix;
    GlContext.cameraPosition = this.position;
  }

  private createViewVector(): Vector3 {
    const angle =
      GameContext.courseConfig.angle -
      Camera.CAMERA_ANGLE_ABOVE_SLOPE +
      Camera.PLAYER_ANGLE_IN_CAMERA;
    const radians = MathUtil.toRadians(angle);
    return [
      0,
      this.playerDistance * Math.sin(radians),
      this.playerDistance * Math.cos(radians),
    ];
  }
}

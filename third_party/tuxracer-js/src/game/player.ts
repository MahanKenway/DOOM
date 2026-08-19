import { Vector3, Vectors } from "../math/vectors.ts";
import { CharacterJoint } from "./character/character-joint.ts";
import { Matrices, Matrix4 } from "../math/matrices.ts";
import { Quaternion, Quaternions } from "../math/quaternions.ts";
import { Axis } from "../math/axis.ts";
import { MathUtil } from "../math/math-util.ts";
import { ODESolver } from "../util/ode-solver.ts";
import { Plane, Planes } from "../math/planes.ts";
import { Time } from "../util/time.ts";
import { Physics } from "./physics.ts";
import { Item } from "./items/item.ts";
import { GameContext } from "./game-context.ts";
import { Sound } from "./audio/sound.ts";

export class Player {
  private static readonly MAX_POSITION_ERROR = 0.005;
  private static readonly MAX_VELOCITY_ERROR = 0.05;
  private static readonly MIN_TIME_STEP = 0.01;
  private static readonly MAX_SURFACE_PENETRATION = 0.2;
  private static readonly TUX_Y_CORRECTION = 0.36;
  private static readonly MAX_ARM_ANGLE = 30;
  private static readonly MAX_PADDLING_ANGLE = 35;
  private static readonly MAX_EXT_PADDLING_ANGLE = 30;
  private static readonly MAX_KICK_PADDLING_ANGLE = 20;
  private static readonly PADDLING_DURATION = 0.4;
  private static readonly ROLL_DECAY = 0.2;

  private force: Vector3;
  private odeTimeStep: number;
  private turnAnimationState: number;
  private lastCollisionItem: Item | undefined;

  readonly transitions: Map<CharacterJoint, Matrix4>;

  velocity: Vector3;
  speed: number;
  finishSpeed: number;
  position: Vector3;
  lastPosition: Vector3;
  direction: Vector3;
  isAirborne: boolean;
  orientation: Quaternion;

  constructor() {
    this.transitions = new Map<CharacterJoint, Matrix4>();
    this.turnAnimationState = 0;
    this.force = Vectors.ZERO;
    this.odeTimeStep = -1;
    this.isAirborne = false;
  }

  public init(): void {
    this.position = [
      GameContext.courseConfig.startX,
      GameContext.course.findYPosition(
        GameContext.courseConfig.startX,
        GameContext.courseConfig.startY,
      ),
      GameContext.courseConfig.startY,
    ];
    this.velocity = this.computeInitialVelocity();
    this.speed = Vectors.computeLength(this.velocity);
    this.direction = this.velocity;
  }

  public update(timeStep: number): void {
    this.transitions.clear();

    if (timeStep > 2 * Number.EPSILON) {
      this.solveOdeSystem(timeStep);
    }

    const surfPlane = GameContext.course.findPlane(
      this.position[0],
      this.position[2],
    );
    const distanceToSurface = Planes.computeDistanceToPlane(
      surfPlane,
      this.position,
    );
    this.isAirborne = distanceToSurface > 0;

    // adjust velocity
    if (this.speed < Physics.MIN_TUX_SPEED) {
      this.velocity = Vectors.multiply(
        Physics.MIN_TUX_SPEED,
        Vectors.normalize(this.velocity),
      );
    }

    this.adjustPosition(surfPlane, distanceToSurface);
    this.adjustOrientation(timeStep, surfPlane, distanceToSurface);
    this.adjustJoints(timeStep);
  }

  public saveFinishSpeed(): void {
    this.finishSpeed = this.speed;
  }

  private adjustJoints(timeStep: number): void {
    const localForce = Vectors.rotateVector(
      Quaternions.conjugate(this.orientation),
      this.force,
    );

    if (GameContext.control.turnFactor === 0) {
      this.turnAnimationState *= Math.max(0, 1 - timeStep / Player.ROLL_DECAY);
    } else {
      this.turnAnimationState += GameContext.control.turnFactor * 2 * timeStep;
      this.turnAnimationState = MathUtil.clamp(-1, this.turnAnimationState, 1);
    }

    let flapFactor = 0;
    let paddlingFactor = 0;
    if (GameContext.control.isPaddling) {
      const factor =
        (Time.getSeconds() - GameContext.control.paddleStartTime) /
        Player.PADDLING_DURATION;
      if (this.isAirborne) {
        paddlingFactor = 0;
        flapFactor = factor;
      } else {
        paddlingFactor = factor;
        flapFactor = 0;
      }
    }

    const brakingAngle = GameContext.control.isBraking
      ? Player.MAX_ARM_ANGLE
      : 0;

    const paddlingAngle =
      Player.MAX_PADDLING_ANGLE * Math.sin(paddlingFactor * Math.PI);
    const extPaddlingAngle =
      Player.MAX_EXT_PADDLING_ANGLE * Math.sin(paddlingFactor * Math.PI);
    const kickPaddlingAngle =
      Player.MAX_KICK_PADDLING_ANGLE * Math.sin(paddlingFactor * MathUtil.PI_2);

    const turningAngleLeft =
      Math.max(-this.turnAnimationState, 0) * Player.MAX_ARM_ANGLE;
    const turningAngleRight =
      Math.max(this.turnAnimationState, 0) * Player.MAX_ARM_ANGLE;

    const flapAngle =
      Player.MAX_ARM_ANGLE *
      (0.5 + 0.5 * Math.sin(Math.PI * flapFactor * 6 - MathUtil.PI_0_5));
    const forceAngle = MathUtil.clamp(-20, -localForce[2] / 300, 20);
    const turnLegAngle = this.turnAnimationState * 10;

    const leftShoulderZRotation = Matrices.createRotation(
      Math.min(
        brakingAngle + paddlingAngle + turningAngleLeft,
        Player.MAX_ARM_ANGLE,
      ) + flapAngle,
      Axis.Z,
    );
    const leftShoulderYRotation = Matrices.createRotation(
      -extPaddlingAngle,
      Axis.Y,
    );
    this.transitions.set(
      CharacterJoint.LEFT_SHOULDER,
      Matrices.multiply(leftShoulderZRotation, leftShoulderYRotation),
    );

    const rightShoulderZRotation = Matrices.createRotation(
      Math.min(
        brakingAngle + paddlingAngle + turningAngleRight,
        Player.MAX_ARM_ANGLE,
      ) + flapAngle,
      Axis.Z,
    );
    const rightShoulderYRotation = Matrices.createRotation(
      extPaddlingAngle,
      Axis.Y,
    );
    this.transitions.set(
      CharacterJoint.RIGHT_SHOULDER,
      Matrices.multiply(rightShoulderZRotation, rightShoulderYRotation),
    );

    this.transitions.set(
      CharacterJoint.LEFT_HIP,
      Matrices.createRotation(-20 + turnLegAngle + forceAngle, Axis.Z),
    );
    this.transitions.set(
      CharacterJoint.RIGHT_HIP,
      Matrices.createRotation(-20 - turnLegAngle + forceAngle, Axis.Z),
    );

    this.transitions.set(
      CharacterJoint.LEFT_KNEE,
      Matrices.createRotation(
        -10 +
          turnLegAngle -
          Math.min(35, this.speed) +
          kickPaddlingAngle +
          forceAngle,
        Axis.Z,
      ),
    );
    this.transitions.set(
      CharacterJoint.RIGHT_KNEE,
      Matrices.createRotation(
        -10 -
          turnLegAngle -
          Math.min(35, this.speed) -
          kickPaddlingAngle +
          forceAngle,
        Axis.Z,
      ),
    );

    this.transitions.set(
      CharacterJoint.LEFT_ANKLE,
      Matrices.createRotation(-20 + Math.min(50, this.speed), Axis.Z),
    );
    this.transitions.set(
      CharacterJoint.RIGHT_ANKLE,
      Matrices.createRotation(-20 + Math.min(50, this.speed), Axis.Z),
    );

    this.transitions.set(
      CharacterJoint.TAIL,
      Matrices.createRotation(this.turnAnimationState * 20, Axis.Z),
    );
    this.transitions.set(
      CharacterJoint.NECK,
      Matrices.createRotation(-50, Axis.Z),
    );

    const headZRotation = Matrices.createRotation(-30, Axis.Z);
    const headYRotation = Matrices.createRotation(
      -this.turnAnimationState * 70,
      Axis.Y,
    );
    this.transitions.set(
      CharacterJoint.HEAD,
      Matrices.multiply(headZRotation, headYRotation),
    );
  }

  private adjustPosition(surfPlane: Plane, distanceToSurface: number): void {
    if (distanceToSurface < -Player.MAX_SURFACE_PENETRATION) {
      const displace = -Player.MAX_SURFACE_PENETRATION - distanceToSurface;
      this.position = Vectors.add(
        this.position,
        Vectors.multiply(displace, surfPlane.normal),
      );
    }

    // check course boundaries
    const boundaryWidth =
      (GameContext.courseConfig.width - GameContext.courseConfig.playWidth) / 2;
    if (this.position[0] < boundaryWidth) {
      this.position[0] = boundaryWidth;
    }
    if (this.position[0] > GameContext.courseConfig.width - boundaryWidth) {
      this.position[0] = GameContext.courseConfig.width - boundaryWidth;
    }
    if (this.position[2] > 0) {
      this.position[2] = 0;
    }

    this.transitions.set(
      CharacterJoint.ROOT,
      Matrices.createTranslation(
        this.position[0],
        this.position[1] + Player.TUX_Y_CORRECTION,
        this.position[2],
      ),
    );
  }

  // contains some magic numbers - see CCharShape::AdjustOrientation
  private adjustOrientation(
    timeStep: number,
    surfPlane: Plane,
    distanceToSurface: number,
  ): void {
    let newY: Vector3;
    let newZ: Vector3;

    if (distanceToSurface > 0) {
      newY = Vectors.normalize(this.velocity);
      newZ = Vectors.normalize(
        Vectors.projectToPlane(newY, Vectors.NEGATIVE_Y_UNIT),
      );
      newZ = this.adjustRollVector(newZ);
    } else {
      newZ = Vectors.negate(surfPlane.normal);
      newZ = this.adjustRollVector(newZ);
      newY = Vectors.normalize(Planes.projectToPlane(surfPlane, this.velocity));
    }

    const newX = Vectors.computeCrossProduct(newY, newZ);
    const rotationMatrix = Matrices.createFromVectors(newX, newY, newZ);
    const newOrientation = Quaternions.createFromRotationMatrix(rotationMatrix);

    if (!this.orientation) {
      this.orientation = newOrientation;
    }

    const timeConstant = distanceToSurface > 0 ? 0.5 : 0.14;
    this.orientation = Quaternions.interpolate(
      this.orientation,
      newOrientation,
      Math.min(timeStep / timeConstant, 1),
    );
    this.direction = Vectors.rotateVector(this.orientation, Vectors.Z_UNIT);

    const rootTransition = this.transitions.get(CharacterJoint.ROOT) as Matrix4;
    this.transitions.set(
      CharacterJoint.ROOT,
      Matrices.multiply(
        Matrices.createFromQuaternion(this.orientation),
        rootTransition,
      ),
    );
  }

  private adjustRollVector(zVector: Vector3): Vector3 {
    const vector = Vectors.normalize(
      Vectors.projectToPlane(zVector, this.velocity),
    );

    let rotation: Matrix4;
    if (GameContext.control.isBraking) {
      rotation = Matrices.createRotationAroundVector(
        GameContext.control.turnFactor * Physics.BREAKING_ROLL_ANGLE,
        vector,
      );
    } else {
      rotation = Matrices.createRotationAroundVector(
        GameContext.control.turnFactor * Physics.MAX_ROLL_ANGLE,
        vector,
      );
    }

    return Vectors.transformVector(rotation, zVector);
  }

  // contains a lot of magic numbers - see CControl::SolveOdeSystem
  private solveOdeSystem(timeStep: number): void {
    let error;
    let tolerance;

    let h = this.odeTimeStep;
    if (h < 0) {
      h = this.adjustTimeStep(h, this.velocity);
    }

    let t = 0;

    let xSolver: ODESolver;
    let ySolver: ODESolver;
    let zSolver: ODESolver;
    let xVelocitySolver: ODESolver;
    let yVelocitySolver: ODESolver;
    let zVelocitySolver: ODESolver;

    let newPosition = this.position;
    let newVelocity = this.velocity;
    let newForce = this.force;

    let done = false;
    while (!done) {
      if (t >= timeStep) {
        throw new Error("t >= timeStep in ODE solver");
      }
      if (1.1 * h > timeStep - t) {
        h = timeStep - t;
        done = true;
      }

      const savedPosition = newPosition;
      const savedVelocity = newVelocity;
      const savedForce = newForce;

      let failed = false;
      for (;;) {
        xSolver = new ODESolver(newPosition[0], h);
        ySolver = new ODESolver(newPosition[1], h);
        zSolver = new ODESolver(newPosition[2], h);
        xVelocitySolver = new ODESolver(newVelocity[0], h);
        yVelocitySolver = new ODESolver(newVelocity[1], h);
        zVelocitySolver = new ODESolver(newVelocity[2], h);

        xSolver.updateEstimate(0, newVelocity[0]);
        ySolver.updateEstimate(0, newVelocity[1]);
        zSolver.updateEstimate(0, newVelocity[2]);
        xVelocitySolver.updateEstimate(0, newForce[0] / Physics.TUX_MASS);
        yVelocitySolver.updateEstimate(0, newForce[1] / Physics.TUX_MASS);
        zVelocitySolver.updateEstimate(0, newForce[2] / Physics.TUX_MASS);

        for (let step = 1; step < ODESolver.NUM_ESTIMATES; step++) {
          newPosition = [
            xSolver.computeNextValue(step),
            ySolver.computeNextValue(step),
            zSolver.computeNextValue(step),
          ];
          newVelocity = [
            xVelocitySolver.computeNextValue(step),
            yVelocitySolver.computeNextValue(step),
            zVelocitySolver.computeNextValue(step),
          ];
          newForce = Physics.computeForce(newPosition, newVelocity);

          xSolver.updateEstimate(step, newVelocity[0]);
          ySolver.updateEstimate(step, newVelocity[1]);
          zSolver.updateEstimate(step, newVelocity[2]);
          xVelocitySolver.updateEstimate(step, newForce[0] / Physics.TUX_MASS);
          yVelocitySolver.updateEstimate(step, newForce[1] / Physics.TUX_MASS);
          zVelocitySolver.updateEstimate(step, newForce[2] / Physics.TUX_MASS);
        }

        newPosition = [
          xSolver.computeFinalEstimate(),
          ySolver.computeFinalEstimate(),
          zSolver.computeFinalEstimate(),
        ];
        newVelocity = [
          xVelocitySolver.computeFinalEstimate(),
          yVelocitySolver.computeFinalEstimate(),
          zVelocitySolver.computeFinalEstimate(),
        ];

        const positionError = this.computeSolverError(
          xSolver,
          ySolver,
          zSolver,
        );
        const velocityError = this.computeSolverError(
          xVelocitySolver,
          yVelocitySolver,
          zVelocitySolver,
        );

        if (
          positionError / Player.MAX_POSITION_ERROR >
          velocityError / Player.MAX_VELOCITY_ERROR
        ) {
          error = positionError;
          tolerance = Player.MAX_POSITION_ERROR;
        } else {
          error = velocityError;
          tolerance = Player.MAX_VELOCITY_ERROR;
        }

        if (error > tolerance && h > Player.MIN_TIME_STEP + Number.EPSILON) {
          done = false;
          if (!failed) {
            failed = true;
            h *= Math.max(
              0.5,
              0.8 * Math.pow(tolerance / error, ODESolver.TIME_STEP_EXPONENT),
            );
          } else {
            h *= 0.5;
          }

          h = this.adjustTimeStep(h, savedVelocity);
          newPosition = savedPosition;
          newVelocity = savedVelocity;
          newForce = savedForce;
        } else {
          break;
        }
      }

      t += h;

      newForce = Physics.computeForce(newPosition, newVelocity);

      if (!failed) {
        const temp =
          1.25 * Math.pow(error / tolerance, ODESolver.TIME_STEP_EXPONENT);
        if (temp > 0.2) {
          h /= temp;
        } else {
          h *= 5;
        }
      }
      h = this.adjustTimeStep(h, newVelocity);

      newVelocity = this.computeVelocityOnItemCollision(
        newPosition,
        newVelocity,
      );
    }

    this.odeTimeStep = h;

    this.force = newForce;
    this.velocity = newVelocity;
    this.speed = Vectors.computeLength(this.velocity);
    this.lastPosition = this.position;
    this.position = newPosition;
  }

  private computeVelocityOnItemCollision(
    position: Vector3,
    velocity: Vector3,
  ): Vector3 {
    const collisionItem = GameContext.items.findCollidingItem(
      position,
      this.position,
    );
    if (!collisionItem) {
      delete this.lastCollisionItem;
      return velocity;
    }

    if (this.lastCollisionItem === collisionItem) {
      return velocity;
    }
    this.lastCollisionItem = collisionItem;

    GameContext.soundPlayer.playSound(Sound.TREE_HIT);

    let itemNormal = Vectors.subtract(position, collisionItem.position);
    itemNormal[1] = 0;
    itemNormal = Vectors.normalize(itemNormal);

    let newVelocity = Vectors.normalize(velocity);
    const cosTheta = Vectors.computeDotProduct(newVelocity, itemNormal);
    if (cosTheta < 0) {
      const factor = this.isAirborne ? 0.5 : 1.5;
      newVelocity = Vectors.normalize(
        Vectors.add(
          newVelocity,
          Vectors.multiply(-factor * cosTheta, itemNormal),
        ),
      );
    }

    const newSpeed = Math.max(
      Vectors.computeLength(velocity) * 0.8,
      Physics.MIN_TUX_SPEED,
    );
    return Vectors.multiply(newSpeed, newVelocity);
  }

  private computeSolverError(
    solver1: ODESolver,
    solver2: ODESolver,
    solver3: ODESolver,
  ): number {
    return Vectors.computeLength([
      solver1.estimateError(),
      solver2.estimateError(),
      solver3.estimateError(),
    ]);
  }

  private adjustTimeStep(h: number, velocity: Vector3): number {
    const speed = Vectors.computeLength(velocity);
    h = MathUtil.clamp(
      ODESolver.MIN_TIME_STEP,
      h,
      ODESolver.MAX_TIME_STEP_DISTRIBUTION / speed,
    );
    return Math.min(h, ODESolver.MAX_TIME_STEP);
  }

  private computeInitialVelocity(): Vector3 {
    const normal = GameContext.course.findNormal(
      GameContext.courseConfig.startX,
      GameContext.courseConfig.startY,
    );
    const rotation = Matrices.createRotation(-90, Axis.X);
    return Vectors.multiply(
      Physics.INITIAL_TUX_SPEED,
      Vectors.transformVector(rotation, normal),
    );
  }
}

import { Vector3, Vectors } from "../math/vectors.ts";
import { Plane, Planes } from "../math/planes.ts";
import { MathUtil } from "../math/math-util.ts";
import { Matrices } from "../math/matrices.ts";
import { GameContext } from "./game-context.ts";
import { GameState } from "./game-state.ts";

export namespace Physics {
  export const TUX_MASS = 20;
  export const MIN_TUX_SPEED = 1.4;
  export const INITIAL_TUX_SPEED = 3;
  export const BREAKING_ROLL_ANGLE = 55;
  export const MAX_ROLL_ANGLE = 30;

  const EARTH_GRAVITY = 9.81;
  const REYNOLDS_NUMBER_SCALING = 34600;
  const MAX_PADDLE_FORCE = 122.5;
  const MAX_PADDLE_SPEED = 60 / 3.6;
  const IDEAL_PADDLE_FRICTION = 0.35;
  const MIN_FRICTION_SPEED = 2.8;
  const MAX_FRICTION_FORCE = 800;
  const BRAKE_FORCE = 200;
  const FINISH_AIR_BRAKE_FORCE = 20;
  const MAX_TURN_ANGLE = 45;
  const MAX_TURN_PERP = 400;
  const MAX_TURN_PEN = 0.15;
  const IDEAL_ROLL_SPEED = 6;
  const IDEAL_ROLL_FRICTION = 0.35;
  const GRAVITATION_FORCE: Vector3 = [0, -EARTH_GRAVITY * TUX_MASS, 0];
  const AIRBORNE_PADDLE_FORCE: Vector3 = [
    0,
    0,
    (-TUX_MASS * EARTH_GRAVITY) / 4.0,
  ];
  const AIR_LOG = [-1, 0, 1, 2, 3, 4, 5, 6];
  const AIR_DRAG = [2.25, 1.35, 0.6, 0, -0.35, -0.45, -0.33, -0.9];

  export function computeForce(
    newPosition: Vector3,
    newVelocity: Vector3,
  ): Vector3 {
    const speed = Vectors.computeLength(newVelocity);

    const [terrainFriction, terrainDepth] =
      GameContext.course.findFrictionAndDepth(newPosition[0], newPosition[2]);
    const surfPlane = GameContext.course.findPlane(
      newPosition[0],
      newPosition[2],
    );
    const surfDistance = Planes.computeDistanceToPlane(surfPlane, newPosition);
    const isAirborne = surfDistance > 0;
    const rollNormal = computeRollNormal(
      speed,
      surfPlane,
      newVelocity,
      terrainFriction,
    );
    const frictionDirection = Vectors.negate(Vectors.normalize(newVelocity));

    const normalForce = computeNormalForce(
      surfDistance,
      terrainDepth,
      newVelocity,
      rollNormal,
    );
    const frictionForce = computeFrictionForce(
      terrainFriction,
      frictionDirection,
      speed,
      normalForce,
      surfPlane,
      isAirborne,
    );
    const airForce = computeAirForce(newVelocity);
    const brakeForce = computeBrakeForce(
      speed,
      terrainFriction,
      frictionDirection,
      isAirborne,
    );
    const paddleForce = computePaddleForce(
      speed,
      isAirborne,
      terrainFriction,
      frictionDirection,
    );

    return Vectors.addAll(
      GRAVITATION_FORCE,
      normalForce,
      frictionForce,
      airForce,
      brakeForce,
      paddleForce,
    );
  }

  // contains some magic numbers - see CControl::CalcAirForce
  function computeAirForce(velocity: Vector3): Vector3 {
    const wind = Vectors.negate(velocity);
    const windSpeed = Vectors.computeLength(wind);
    const reynoldsNumber = REYNOLDS_NUMBER_SCALING * windSpeed;
    const interpolation = MathUtil.interpolateLinear(
      AIR_LOG,
      AIR_DRAG,
      Math.log10(reynoldsNumber),
    );
    const dragCoefficient = Math.pow(10, interpolation);
    const airFactor = 0.104 * dragCoefficient * windSpeed;
    return Vectors.multiply(airFactor, wind);
  }

  function computePaddleForce(
    speed: number,
    isAirborne: boolean,
    terrainFriction: number,
    frictionDirection: Vector3,
  ): Vector3 {
    if (GameContext.control.isPaddling && GameContext.player.orientation) {
      let paddleForce: Vector3;
      if (isAirborne) {
        paddleForce = Vectors.rotateVector(
          GameContext.player.orientation,
          AIRBORNE_PADDLE_FORCE,
        );
      } else {
        const factor = -Math.min(
          MAX_PADDLE_FORCE,
          ((MAX_PADDLE_FORCE * (MAX_PADDLE_SPEED - speed)) / MAX_PADDLE_SPEED) *
            Math.min(1, terrainFriction / IDEAL_PADDLE_FRICTION),
        );
        paddleForce = Vectors.multiply(factor, frictionDirection);
      }
      return paddleForce;
    }

    return Vectors.ZERO;
  }

  function computeBrakeForce(
    speed: number,
    terrainFriction: number,
    frictionDirection: Vector3,
    isAirborne: boolean,
  ): Vector3 {
    if (GameContext.state !== GameState.BREAKING) {
      if (
        GameContext.control.isBraking &&
        !isAirborne &&
        speed > MIN_FRICTION_SPEED &&
        speed > MIN_TUX_SPEED
      ) {
        return Vectors.multiply(
          BRAKE_FORCE + terrainFriction,
          frictionDirection,
        );
      }
    } else {
      const breakForce = isAirborne
        ? FINISH_AIR_BRAKE_FORCE
        : GameContext.courseConfig.finishBrake;
      return Vectors.multiply(
        GameContext.player.finishSpeed * breakForce,
        frictionDirection,
      );
    }

    return Vectors.ZERO;
  }

  // contains a lot of magic numbers - see CControl::CalcSpringForce
  function computeNormalForce(
    surfDistance: number,
    terrainDepth: number,
    velocity: Vector3,
    rollNormal: Vector3,
  ): Vector3 {
    if (surfDistance > -terrainDepth) {
      return Vectors.ZERO;
    }

    const springVelocity = Vectors.computeDotProduct(velocity, rollNormal);
    const compression = -surfDistance - terrainDepth;
    let springFactor = Math.min(compression, 0.05) * 1500;
    springFactor += MathUtil.clamp(0.0, compression - 0.05, 0.12) * 3000;
    springFactor += Math.max(0, compression - 0.12 - 0.05) * 10000;
    springFactor -= springVelocity * (compression <= 0.05 ? 1500 : 500);
    springFactor = MathUtil.clamp(0.0, springFactor, 3000);
    return Vectors.multiply(springFactor, rollNormal);
  }

  function computeFrictionForce(
    terrainFriction: number,
    frictionDirection: Vector3,
    speed: number,
    normalForce: Vector3,
    surfPlane: Plane,
    isAirborne: boolean,
  ): Vector3 {
    if (
      (!isAirborne && speed > MIN_FRICTION_SPEED) ||
      GameContext.state === GameState.BREAKING
    ) {
      const frictionMagnitude = Math.min(
        Vectors.computeLength(normalForce) * terrainFriction,
        MAX_FRICTION_FORCE,
      );
      let friction = Vectors.multiply(frictionMagnitude, frictionDirection);

      let steeringAngle = GameContext.control.turnFactor * MAX_TURN_ANGLE;
      if (
        Math.abs(
          frictionMagnitude * Math.sin(MathUtil.toRadians(steeringAngle)),
        ) > MAX_TURN_PERP
      ) {
        steeringAngle =
          (MathUtil.toDegrees(Math.asin(MAX_TURN_PERP / frictionMagnitude)) *
            GameContext.control.turnFactor) /
          Math.abs(GameContext.control.turnFactor);
      }

      const rotationMatrix = Matrices.createRotationAroundVector(
        steeringAngle,
        surfPlane.normal,
      );
      friction = Vectors.transformVector(rotationMatrix, friction);
      return Vectors.multiply(1 + MAX_TURN_PEN, friction);
    }

    return Vectors.ZERO;
  }

  function computeRollNormal(
    speed: number,
    surfPlane: Plane,
    velocity: Vector3,
    terrainFriction: number,
  ): Vector3 {
    const projectedVelocity = Vectors.normalize(
      Planes.projectToPlane(surfPlane, velocity),
    );

    const rollAngle = GameContext.control.isBraking
      ? BREAKING_ROLL_ANGLE
      : MAX_ROLL_ANGLE;
    const angle =
      GameContext.control.turnFactor *
      rollAngle *
      Math.min(1, Math.max(0, terrainFriction) / IDEAL_ROLL_FRICTION) *
      Math.min(
        1.0,
        Math.max(0.0, speed - MIN_TUX_SPEED) /
          (IDEAL_ROLL_SPEED - MIN_TUX_SPEED),
      );
    const rotationMatrix = Matrices.createRotationAroundVector(
      angle,
      projectedVelocity,
    );

    return Vectors.transformVector(rotationMatrix, surfPlane.normal);
  }
}

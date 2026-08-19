import { KeyState } from "../input/key-state.ts";
import { Time } from "../util/time.ts";
import { GameState } from "./game-state.ts";
import { GameContext } from "./game-context.ts";
import { TouchState } from "../input/touch-state.ts";

export class Control {
  private static readonly PADDLING_DURATION = 0.4;

  turnFactor: number;
  isBraking: boolean;
  isPaddling: boolean;

  paddleStartTime: number;

  constructor() {
    this.turnFactor = 0;
    this.isBraking = false;
    this.isPaddling = false;

    this.paddleStartTime = 0;
  }

  public update(keyState: KeyState, touchState: TouchState): void {
    this.turnFactor = 0;

    let shouldBrake: boolean;
    let shouldPaddle: boolean;

    if (GameContext.state === GameState.BREAKING) {
      shouldBrake = true;
      shouldPaddle = false;
    } else if (touchState.stickAngle) {
      this.turnFactor = Math.sin(touchState.stickAngle);

      shouldBrake = touchState.isPointingBackward;
      shouldPaddle = touchState.isPointingForward;
    } else {
      const shouldTurnLeft = keyState.keyboardA || keyState.keyboardArrowLeft;
      const shouldTurnRight = keyState.keyboardD || keyState.keyboardArrowRight;
      if (shouldTurnLeft !== shouldTurnRight) {
        this.turnFactor = shouldTurnRight ? 1 : -1;
      }

      shouldBrake = keyState.keyboardS || keyState.keyboardArrowDown;
      shouldPaddle = keyState.keyboardW || keyState.keyboardArrowUp;
    }

    if (shouldPaddle !== shouldBrake) {
      this.isBraking = shouldBrake;

      if (shouldPaddle && !this.isPaddling) {
        this.isPaddling = true;
        this.paddleStartTime = Time.getSeconds();
      }
    } else {
      this.isBraking = false;
    }

    if (
      this.isPaddling &&
      !shouldPaddle &&
      Time.getSeconds() - this.paddleStartTime > Control.PADDLING_DURATION
    ) {
      this.isPaddling = false;
    }
  }
}

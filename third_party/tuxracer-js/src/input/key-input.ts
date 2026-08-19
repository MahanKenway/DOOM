import { KeyState } from "./key-state.ts";

export class KeyInput {
  public readonly keyState: KeyState;

  constructor() {
    this.keyState = {
      keyboardA: false,
      keyboardD: false,
      keyboardW: false,
      keyboardS: false,

      keyboardArrowLeft: false,
      keyboardArrowRight: false,
      keyboardArrowUp: false,
      keyboardArrowDown: false,
    };

    document.addEventListener("keydown", (event: KeyboardEvent) => {
      this.setKeyState(event.key, true);
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
      this.setKeyState(event.key, false);
    });
  }

  private setKeyState(key: string, pressed: boolean): void {
    switch (key.toLowerCase()) {
      case "a":
        this.keyState.keyboardA = pressed;
        break;

      case "d":
        this.keyState.keyboardD = pressed;
        break;

      case "w":
        this.keyState.keyboardW = pressed;
        break;

      case "s":
        this.keyState.keyboardS = pressed;
        break;

      case "arrowup":
        this.keyState.keyboardArrowUp = pressed;
        break;

      case "arrowdown":
        this.keyState.keyboardArrowDown = pressed;
        break;

      case "arrowleft":
        this.keyState.keyboardArrowLeft = pressed;
        break;

      case "arrowright":
        this.keyState.keyboardArrowRight = pressed;
        break;
    }
  }
}

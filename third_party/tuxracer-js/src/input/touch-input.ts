import { TouchState } from "./touch-state.ts";
import { MathUtil } from "../math/math-util.ts";

export class TouchInput {
  private static readonly INNER_RADIUS = 42 * window.devicePixelRatio;
  private static readonly OUTER_RADIUS = 59 * window.devicePixelRatio;
  private static readonly KNOB_RADIUS = 25 * window.devicePixelRatio;

  private static readonly COLOR_BLACK = "#00000090";
  private static readonly COLOR_GREEN = "#00800090";
  private static readonly COLOR_RED = "#ff000090";

  private readonly canvasElement: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private readonly borderImage: ImageBitmap;

  private isTouchActive = false;
  private centerX: number;
  private centerY: number;
  private pointerX: number;
  private pointerY: number;

  public readonly touchState: TouchState;

  constructor() {
    this.canvasElement = document.getElementById(
      "game-touch-stick-canvas",
    ) as HTMLCanvasElement;
    this.context = this.canvasElement.getContext(
      "2d",
    ) as CanvasRenderingContext2D;

    this.borderImage = this.createBorderImage();

    this.touchState = {
      stickAngle: undefined,
      isPointingForward: false,
      isPointingBackward: false,
    };

    document.addEventListener(
      "touchstart",
      (event: TouchEvent) => {
        if (event.touches.length === 1) {
          this.onTouchStart(event.touches[0].clientX, event.touches[0].clientY);
        }
        event.preventDefault();
      },
      { passive: false },
    );

    document.addEventListener(
      "touchmove",
      (event: TouchEvent) => {
        if (event.touches.length === 1) {
          this.onTouchMove(event.touches[0].clientX, event.touches[0].clientY);
        }
        event.preventDefault();
      },
      { passive: false },
    );

    document.addEventListener(
      "touchend",
      (event: TouchEvent) => {
        this.onTouchEnd();
        event.preventDefault();
      },
      { passive: false },
    );

    document.addEventListener(
      "touchcancel",
      (event: TouchEvent) => {
        this.onTouchEnd();
        event.preventDefault();
      },
      { passive: false },
    );

    document.addEventListener("mousedown", (event: MouseEvent) => {
      this.onTouchStart(event.x, event.y);
    });

    document.addEventListener("mousemove", (event: MouseEvent) => {
      this.onTouchMove(event.x, event.y);
    });

    document.addEventListener("mouseup", () => {
      this.onTouchEnd();
    });
  }

  private update(pointerX: number, pointerY: number) {
    const dX = pointerX - this.centerX;
    const dY = pointerY - this.centerY;

    const distance = Math.hypot(dX, dY);
    const angle = -Math.atan2(dX, dY) + MathUtil.PI_0_5;
    this.touchState.stickAngle = angle + MathUtil.PI_0_5;

    if (distance < TouchInput.INNER_RADIUS) {
      this.pointerX = pointerX;
      this.pointerY = pointerY;
      this.touchState.isPointingBackward = false;
      this.touchState.isPointingForward = false;
    } else {
      const sin = Math.sin(angle);
      this.touchState.isPointingForward = sin < 0;
      this.touchState.isPointingBackward = sin >= 0;

      const radius = Math.min(TouchInput.OUTER_RADIUS, distance);
      this.pointerX = this.centerX + Math.cos(angle) * radius;
      this.pointerY = this.centerY + sin * radius;
    }
  }

  public draw(): void {
    if (!this.isTouchActive) {
      return;
    }

    this.resize();
    this.clear();

    this.context.drawImage(
      this.borderImage,
      this.centerX - this.borderImage.width / 2,
      this.centerY - this.borderImage.height / 2,
    );

    this.context.fillStyle = this.touchState.isPointingForward
      ? TouchInput.COLOR_GREEN
      : this.touchState.isPointingBackward
        ? TouchInput.COLOR_RED
        : TouchInput.COLOR_BLACK;
    this.context.beginPath();
    this.context.arc(
      this.pointerX,
      this.pointerY,
      TouchInput.KNOB_RADIUS,
      0,
      MathUtil.PI_2,
    );
    this.context.fill();
  }

  private clear(): void {
    this.context.clearRect(
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height,
    );
  }

  private resize(): void {
    const dpr = window.devicePixelRatio;
    const { width, height } = this.canvasElement.getBoundingClientRect();
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);

    const needsResize =
      this.canvasElement.width != displayWidth ||
      this.canvasElement.height != displayHeight;
    if (needsResize) {
      this.canvasElement.width = displayWidth;
      this.canvasElement.height = displayHeight;
    }
  }

  private createBorderImage(): ImageBitmap {
    const size = 2 * TouchInput.OUTER_RADIUS + 6;
    const halfSize = size / 2;
    const offscreenCanvas = new OffscreenCanvas(size, size);
    const context = offscreenCanvas.getContext(
      "2d",
    ) as OffscreenCanvasRenderingContext2D;

    context.lineWidth = 2;

    context.strokeStyle = TouchInput.COLOR_BLACK;
    context.beginPath();
    context.arc(halfSize, halfSize, TouchInput.INNER_RADIUS, 0, MathUtil.PI_2);
    context.stroke();

    context.lineWidth = 4;

    context.strokeStyle = TouchInput.COLOR_RED;
    context.beginPath();
    context.arc(halfSize, halfSize, TouchInput.OUTER_RADIUS, 0, Math.PI);
    context.stroke();

    context.strokeStyle = TouchInput.COLOR_GREEN;
    context.beginPath();
    context.arc(halfSize, halfSize, TouchInput.OUTER_RADIUS, Math.PI, 0);
    context.stroke();

    return offscreenCanvas.transferToImageBitmap();
  }

  private onTouchStart(x: number, y: number): void {
    if (this.isTouchActive) {
      return;
    }
    this.isTouchActive = true;

    x *= window.devicePixelRatio;
    y *= window.devicePixelRatio;

    this.centerX = x;
    this.centerY = y;
    this.update(x, y);
  }

  private onTouchMove(x: number, y: number): void {
    if (!this.isTouchActive) {
      return;
    }

    x *= window.devicePixelRatio;
    y *= window.devicePixelRatio;

    this.update(x, y);
  }

  private onTouchEnd(): void {
    this.isTouchActive = false;
    this.touchState.stickAngle = undefined;
    this.clear();
  }
}

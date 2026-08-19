import { GameContext } from "./game/game-context.ts";
import { Time } from "./util/time.ts";
import { GameState } from "./game/game-state.ts";
import { MathUtil } from "./math/math-util.ts";

export class Hud {
  private static readonly COS_PI_0_75 = Math.cos(MathUtil.PI_0_75);
  private static readonly SIN_PI_0_75 = Math.sin(MathUtil.PI_0_75);
  private static readonly COS_PI_1_75 = Math.cos(MathUtil.PI_1_75);
  private static readonly SIN_PI_1_75 = Math.sin(MathUtil.PI_1_75);
  private static readonly DISPLAY_SPEED_FACTOR = 3.6;

  private readonly timeMinutesElement: HTMLSpanElement;
  private readonly timeSecondsElement: HTMLSpanElement;
  private readonly timeDecisecondsElement: HTMLSpanElement;
  private readonly pointsElement: HTMLSpanElement;
  private readonly speedElement: HTMLSpanElement;
  private readonly speedCanvasElement: HTMLCanvasElement;
  private readonly speedRenderingContext: CanvasRenderingContext2D;

  private gaugeBorderImage: ImageBitmap;
  private gaugeGradient: CanvasGradient;

  constructor() {
    this.pointsElement = document.getElementById(
      "game-points",
    ) as HTMLSpanElement;
    this.timeMinutesElement = document.getElementById(
      "game-time-minutes",
    ) as HTMLSpanElement;
    this.timeSecondsElement = document.getElementById(
      "game-time-seconds",
    ) as HTMLSpanElement;
    this.timeDecisecondsElement = document.getElementById(
      "game-time-deciseconds",
    ) as HTMLSpanElement;
    this.speedElement = document.getElementById(
      "game-speed-text",
    ) as HTMLSpanElement;
    this.speedCanvasElement = document.getElementById(
      "game-speed-canvas",
    ) as HTMLCanvasElement;
    this.speedRenderingContext = this.speedCanvasElement.getContext(
      "2d",
    ) as CanvasRenderingContext2D;

    this.resizeSpeedCanvas();
    this.gaugeBorderImage = this.createGaugeBorderImage();
    this.gaugeGradient = this.createGaugeGradient();
  }

  public updateHud(): void {
    this.resizeSpeedCanvas();
    this.drawGauge();
    this.updateTime();

    this.pointsElement.innerText = GameContext.collectedItems
      .toString()
      .padStart(3, "0");
  }

  private resizeSpeedCanvas(): void {
    const canvasElement = this.speedCanvasElement;

    const dpr = window.devicePixelRatio;
    const { width, height } = canvasElement.getBoundingClientRect();
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);

    const needsResize =
      canvasElement.width != displayWidth ||
      canvasElement.height != displayHeight;

    if (needsResize) {
      canvasElement.width = displayWidth;
      canvasElement.height = displayHeight;
      this.gaugeBorderImage = this.createGaugeBorderImage();
      this.gaugeGradient = this.createGaugeGradient();
    }
  }

  private drawGauge(): void {
    const speed =
      GameContext.state === GameState.RACING ||
      GameContext.state === GameState.BREAKING
        ? GameContext.player.speed
        : 0;

    const displaySpeed = Math.floor(speed * Hud.DISPLAY_SPEED_FACTOR);
    this.speedElement.innerText = displaySpeed.toString().padStart(3, "0");

    const endAngle =
      MathUtil.PI_0_75 + Math.min(Math.PI, speed * 0.025 * Math.PI);

    const canvas = this.speedCanvasElement;
    const context = this.speedRenderingContext;

    const size = canvas.width;
    const halfSize = size / 2;

    context.clearRect(0, 0, size, size);

    context.lineWidth = halfSize * 0.25;
    context.strokeStyle = this.gaugeGradient;

    context.beginPath();
    context.arc(
      halfSize,
      halfSize,
      halfSize * 0.875,
      MathUtil.PI_0_75,
      endAngle,
    );
    context.stroke();

    context.drawImage(this.gaugeBorderImage, 0, 0);
  }

  private updateTime(): void {
    let time =
      (GameContext.endTime ?? Date.now()) -
      (GameContext.startTime ?? Date.now());

    const minutes = Math.floor(time / Time.ONE_MINUTE_IN_MILLISECONDS);
    time -= minutes * Time.ONE_MINUTE_IN_MILLISECONDS;

    const seconds = Math.floor(time / Time.ONE_SECOND_IN_MILLISECONDS);
    time -= seconds * Time.ONE_SECOND_IN_MILLISECONDS;

    const deciseconds = Math.floor(time / Time.ONE_DECISECOND_IN_MILLISECONDS);

    this.timeMinutesElement.innerText = minutes.toString().padStart(2, "0");

    this.timeSecondsElement.innerText = seconds.toString().padStart(2, "0");

    this.timeDecisecondsElement.innerText = deciseconds
      .toString()
      .padStart(2, "0");
  }

  private createGaugeBorderImage(): ImageBitmap {
    const size = this.speedCanvasElement.width;
    const halfSize = size / 2;
    const smallCircleRadius = halfSize * 0.75;
    const bigCircleRadius = halfSize - 2;

    const offscreenCanvas = new OffscreenCanvas(size, size);
    const context = offscreenCanvas.getContext(
      "2d",
    ) as OffscreenCanvasRenderingContext2D;

    context.strokeStyle = "black";
    context.lineWidth = 2;

    context.beginPath();
    context.arc(
      halfSize,
      halfSize,
      bigCircleRadius,
      MathUtil.PI_0_75,
      MathUtil.PI_1_75,
    );
    context.stroke();

    context.beginPath();
    context.arc(halfSize, halfSize, smallCircleRadius, 0, MathUtil.PI_2);
    context.stroke();

    context.beginPath();
    context.moveTo(
      halfSize + smallCircleRadius * Hud.COS_PI_0_75,
      halfSize + smallCircleRadius * Hud.SIN_PI_0_75,
    );
    context.lineTo(
      halfSize + bigCircleRadius * Hud.COS_PI_0_75,
      halfSize + bigCircleRadius * Hud.SIN_PI_0_75,
    );
    context.stroke();

    context.beginPath();
    context.moveTo(
      halfSize + smallCircleRadius * Hud.COS_PI_1_75,
      halfSize + smallCircleRadius * Hud.SIN_PI_1_75,
    );
    context.lineTo(
      halfSize + bigCircleRadius * Hud.COS_PI_1_75,
      halfSize + bigCircleRadius * Hud.SIN_PI_1_75,
    );
    context.stroke();

    return offscreenCanvas.transferToImageBitmap();
  }

  private createGaugeGradient(): CanvasGradient {
    const halfSize = this.speedCanvasElement.width / 2;

    const gradient = this.speedRenderingContext.createConicGradient(
      MathUtil.PI_0_75,
      halfSize,
      halfSize,
    );
    gradient.addColorStop(0, "green");
    gradient.addColorStop(0.4, "yellow");
    gradient.addColorStop(0.5, "red");
    return gradient;
  }
}

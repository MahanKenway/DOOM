import * as w4 from "./wasm4";

let tick: f32 = 0.0;
let shipX: f32 = 80.0;
let score: i32 = 0;
let crashed: bool = false;
let previousPad: u8 = 0;

function palette(): void {
  store<u32>(w4.PALETTE, 0x07162b);
  store<u32>(w4.PALETTE + 4, 0x24466d);
  store<u32>(w4.PALETTE + 8, 0xc9f04b);
  store<u32>(w4.PALETTE + 12, 0xffb323);
}

function colors(value: u16): void { store<u16>(w4.DRAW_COLORS, value); }
function abs(v: f32): f32 { return v < 0.0 ? -v : v; }

function reset(): void {
  tick = 0.0;
  shipX = 80.0;
  score = 0;
  crashed = false;
}

function drawRoad(): void {
  colors(0x2); w4.rect(26, 0, 108, 160);
  colors(0x3);
  for (let y: i32 = -20; y < 170; y += 18) {
    let yy = <i32>((<f32>y + tick * 2.5) % 180.0) - 10;
    w4.rect(78, yy, 4, 10);
  }
  colors(0x4); w4.vline(26, 0, 160); w4.vline(133, 0, 160);
}

function drawShip(): void {
  colors(0x4); w4.rect(<i32>shipX - 6, 122, 12, 16);
  colors(0x3); w4.rect(<i32>shipX - 3, 118, 6, 8);
  colors(0x1); w4.rect(<i32>shipX - 2, 121, 4, 5);
}

function drawObstacle(i: i32): bool {
  // Offset the loop so a central-lane obstacle never spawns on the player; it enters after a short reaction window.
  let y: f32 = (<f32>(i * 29 + 135) + tick * 0.65) % 250.0 - 50.0;
  let lane: i32 = ((i * 17 + <i32>(tick / 70.0)) % 3) - 1;
  let x: f32 = 80.0 + <f32>lane * 28.0 + <f32>Math.sin(tick * 0.028 + <f32>i) * 4.0;
  colors(i % 2 == 0 ? 0x4 : 0x3); w4.rect(<i32>x - 7, <i32>y, 14, 10);
  colors(0x1); w4.rect(<i32>x - 2, <i32>y + 2, 4, 5);
  return abs(y - 126.0) < 13.0 && abs(x - shipX) < 12.0;
}

export function update(): void {
  palette();
  const pad = load<u8>(w4.GAMEPAD1);
  const pressed = pad & ~previousPad;
  previousPad = pad;

  if (crashed) {
    colors(0x1); w4.rect(0, 0, 160, 160);
    colors(0x4); w4.text("SKYLINE SPRINT", 28, 44);
    colors(0x3); w4.text("RUN ENDED", 48, 68);
    w4.text("SCORE " + score.toString(), 43, 82);
    colors(0x4); w4.text("PRESS X TO RERUN", 20, 112);
    if (pressed & w4.BUTTON_1) reset();
    return;
  }

  const boost = (pad & w4.BUTTON_1) != 0;
  const speed: f32 = boost ? 2.25 : 1.45;
  if (pad & w4.BUTTON_LEFT) shipX -= 1.75;
  if (pad & w4.BUTTON_RIGHT) shipX += 1.75;
  shipX = shipX < 36.0 ? 36.0 : (shipX > 124.0 ? 124.0 : shipX);
  tick += speed;
  score = <i32>(tick * 4.0);

  colors(0x1); w4.rect(0, 0, 160, 160);
  drawRoad();
  let hit = false;
  for (let i = 0; i < 6; i++) if (drawObstacle(i)) hit = true;
  drawShip();
  colors(0x1); w4.rect(0, 0, 160, 15);
  colors(0x3); w4.text("SKYLINE SPRINT", 4, 4);
  colors(0x4); w4.text(score.toString(), 126, 4);
  colors(0x2); w4.text(boost ? "BOOST" : "CRUISE", 4, 148);

  if (hit) {
    crashed = true;
    w4.tone(180 | (420 << 16), 20, 100, w4.TONE_NOISE);
  }
}

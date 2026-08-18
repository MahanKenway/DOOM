import * as w4 from "./wasm4";

let paddleX: f32 = 66.0;
let ballX: f32 = 80.0, ballY: f32 = 114.0, ballVX: f32 = 1.2, ballVY: f32 = -1.35;
let lives: i32 = 3, score: i32 = 0, level: i32 = 1;
let launched: bool = false, over: bool = false, prev: u8 = 0;
let bricks = new StaticArray<u8>(48);

function colors(value: u16): void { store<u16>(w4.DRAW_COLORS, value); }
function abs(v: f32): f32 { return v < 0.0 ? -v : v; }
function palette(): void {
  store<u32>(w4.PALETTE, 0x07162b);
  store<u32>(w4.PALETTE + 4, 0x42d9e8);
  store<u32>(w4.PALETTE + 8, 0xc9f04b);
  store<u32>(w4.PALETTE + 12, 0xffb323);
}
function resetBall(): void { ballX = paddleX + 14.0; ballY = 132.0; ballVX = 1.1; ballVY = -1.4; launched = false; }
function newLevel(): void { for(let i=0;i<48;i++) unchecked(bricks[i] = 1); paddleX = 66.0; resetBall(); }
function hardReset(): void { lives=3;score=0;level=1;over=false;newLevel(); }

export function update(): void {
  palette();
  const pad=load<u8>(w4.GAMEPAD1), pressed=pad & ~prev;prev=pad;
  if(over){
    colors(0x1);w4.rect(0,0,160,160);colors(0x4);w4.text("COMET BREAKER",27,44);colors(0x3);w4.text("FINAL SCORE "+score.toString(),30,70);colors(0x4);w4.text("PRESS X TO RESET",25,108);if(pressed&w4.BUTTON_1)hardReset();return;
  }
  if(pad&w4.BUTTON_LEFT)paddleX-=2.1;if(pad&w4.BUTTON_RIGHT)paddleX+=2.1;paddleX=paddleX<7?7:(paddleX>121?121:paddleX);
  if(!launched){ballX=paddleX+14.0;if(pressed&w4.BUTTON_1){launched=true;w4.tone(520,8,70,w4.TONE_PULSE1)}}
  if(launched){
    ballX+=ballVX;ballY+=ballVY;
    if(ballX<4||ballX>156){ballVX=-ballVX;ballX=ballX<4?4:156;w4.tone(340,4,40,w4.TONE_PULSE1)}
    if(ballY<19){ballVY=-ballVY;ballY=19;w4.tone(400,4,40,w4.TONE_PULSE1)}
    if(ballY>128&&ballY<140&&ballX>paddleX-2&&ballX<paddleX+34&&ballVY>0){ballVY=-abs(ballVY);ballVX+=(ballX-(paddleX+16.0))*.035;w4.tone(660,7,65,w4.TONE_PULSE2)}
    let alive=0;
    for(let row=0;row<6;row++)for(let col=0;col<8;col++){
      const i=row*8+col;if(unchecked(bricks[i])==0)continue;alive++;const bx=8+col*18,by=28+row*11;
      const minX: f32=<f32>(bx-2), maxX: f32=<f32>(bx+16), minY: f32=<f32>(by-2), maxY: f32=<f32>(by+8);
      if(ballX>minX&&ballX<maxX&&ballY>minY&&ballY<maxY){unchecked(bricks[i]=0);ballVY=-ballVY;score+=10*level;w4.tone(700+row*35,7,60,w4.TONE_PULSE1)}
    }
    if(alive==0){level++;newLevel();w4.tone(760,24,80,w4.TONE_PULSE2)}
    if(ballY>162){lives--;if(lives<=0)over=true;else resetBall();}
  }
  colors(0x1);w4.rect(0,0,160,160);
  for(let row=0;row<6;row++)for(let col=0;col<8;col++)if(unchecked(bricks[row*8+col])!=0){colors(<u16>(row%3==0?0x4:(row%3==1?0x3:0x2)));w4.rect(8+col*18,28+row*11,15,7);}
  colors(0x4);w4.rect(<i32>paddleX,138,32,4);colors(0x3);w4.oval(<i32>ballX-2,<i32>ballY-2,5,5);
  colors(0x1);w4.rect(0,0,160,16);colors(0x4);w4.text("COMET BREAKER",3,4);colors(0x3);w4.text("L"+lives.toString()+" "+score.toString(),112,4);
  if(!launched){colors(0x4);w4.text("X LAUNCH",48,154);} else {colors(0x2);w4.text("LEVEL "+level.toString(),4,154);}
}

newLevel();

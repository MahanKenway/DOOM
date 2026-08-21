const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const WAVES_FRAGMENT = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;
float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x + 5.0 * sin((r.y + r.x) / 20.0 + tc.y);
  float my = r.y - tc.z + 3.0 * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * 1.25 + sin(my * freq.y) * 1.25 + 4.5);
}
float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 40; i++) {
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (abs(dist) > 220.0) return 220.0;
  }
  return dist;
}
void main() {
  float t = uTime * 0.34;
  vec2 uv = gl_FragCoord.xy / uResolution.xy - 0.5;
  uv.x *= uResolution.x / uResolution.y;
  uv += (uMouse - 0.5) * vec2(0.06, 0.035);
  vec3 dir = normalize(vec3(uv.x, uv.y - 0.22, -1.0));
  vec2 freq = vec2(0.10, 0.18);
  vec4 tc = vec4(t / .13, t / .81, t / .20, t / .71);
  float dist = raymarch(vec3(0.0, 0.0, 30.0), dir, freq, tc);
  float fog = clamp(15.0 / max(dist, .001), 0.0, 1.0);
  vec3 horizon = vec3(.72, .80, .12);
  vec3 body = vec3(.02, .045, .035);
  vec3 crest = vec3(.91, .96, .68);
  vec3 color = mix(horizon, mix(body, crest, clamp(0.52 - dir.y * 2.2, 0.0, 1.0)), fog);
  color *= 0.72 + fog * 0.48;
  gl_FragColor = vec4(color, fog * .60);
}
`;

const EYE_FRAGMENT = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y);
}
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
  float t = uTime * .92;
  float radius = length(uv * vec2(.88, 1.45));
  float flame = noise(vec2(atan(uv.y, uv.x) * 2.3, radius * 5.0 - t * 1.9));
  float shell = smoothstep(1.15, .18, radius + (flame - .5) * .18);
  vec2 pupilUv = uv - uMouse * .075;
  float pupil = smoothstep(.23, .14, length(pupilUv * vec2(3.8, 1.0)));
  float iris = smoothstep(.68, .20, radius) - smoothstep(.35, .12, radius);
  vec3 lime = vec3(.72, .92, .12);
  vec3 core = vec3(.02, .028, .018);
  float glow = shell * (0.42 + flame * .8) + iris * .72;
  vec3 color = lime * glow;
  color = mix(color, core, pupil);
  color += lime * pow(max(0.0, 1.0 - radius), 5.0) * .6;
  gl_FragColor = vec4(color, shell * .94);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile failed');
  return shader;
}

function createProgram(gl, fragment) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed');
  return program;
}

function mountShader(canvas, fragment, { mouse = false, className = '' } = {}) {
  if (!canvas || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) { canvas.classList.add('is-unavailable'); return; }
  let program;
  try { program = createProgram(gl, fragment); } catch { canvas.classList.add('is-unavailable'); return; }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  const resolution = gl.getUniformLocation(program, 'uResolution');
  const time = gl.getUniformLocation(program, 'uTime');
  const pointer = gl.getUniformLocation(program, 'uMouse');
  let mouseX = .5, mouseY = .5, targetX = .5, targetY = .5;
  let visible = true, pageVisible = !document.hidden, frame = 0;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, className === 'gradient-waves' ? 1.25 : 1.5);
    const w = Math.max(1, Math.round(rect.width * scale));
    const h = Math.max(1, Math.round(rect.height * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };
  const pointerMove = (event) => {
    if (!mouse) return;
    const rect = canvas.getBoundingClientRect();
    targetX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    targetY = Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height));
  };
  const pointerLeave = () => { targetX = .5; targetY = .5; };
  canvas.addEventListener('pointermove', pointerMove, { passive: true });
  canvas.addEventListener('pointerleave', pointerLeave, { passive: true });
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { threshold: 0.01 });
  observer.observe(canvas);
  const onVisibility = () => { pageVisible = !document.hidden; schedule(); };
  document.addEventListener('visibilitychange', onVisibility);
  const draw = (now) => {
    frame = 0;
    if (!visible || !pageVisible) return;
    mouseX += (targetX - mouseX) * .07;
    mouseY += (targetY - mouseY) * .07;
    resize();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, now * .001);
    gl.uniform2f(pointer, mouseX, mouseY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frame = requestAnimationFrame(draw);
  };
  const schedule = () => { if (!frame && visible && pageVisible) frame = requestAnimationFrame(draw); };
  schedule();
  return () => {
    if (frame) cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('pointerleave', pointerLeave);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

export function initVisualEffects() {
  const stopWaves = mountShader(document.getElementById('gradient-waves'), WAVES_FRAGMENT, { mouse: true, className: 'gradient-waves' });
  const stopEye = mountShader(document.getElementById('evil-eye'), EYE_FRAGMENT, { mouse: true, className: 'evil-eye' });
  return () => { stopWaves?.(); stopEye?.(); };
}

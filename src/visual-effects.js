const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const WAVES_FRAGMENT = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
uniform float uOpacity;
uniform float uSteps;
float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x + 5.0 * sin((r.y + r.x) / 20.0 + tc.y);
  float my = r.y - tc.z + 3.0 * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * 1.25 + sin(my * freq.y) * 1.25 + 4.5);
}
float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 32; i++) {
    if (float(i) >= uSteps) break;
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
  uv += (uMouse - 0.5) * vec2(0.045, 0.028);
  vec3 dir = normalize(vec3(uv.x, uv.y - 0.22, -1.0));
  vec4 tc = vec4(t / .13, t / .81, t / .20, t / .71);
  float dist = raymarch(vec3(0.0, 0.0, 30.0), dir, vec2(0.10, 0.18), tc);
  float fog = clamp(15.0 / max(dist, .001), 0.0, 1.0);
  vec3 color = mix(uHorizonColor, mix(uWaveColor, uCrestColor, clamp(0.52 - dir.y * 2.2, 0.0, 1.0)), fog);
  gl_FragColor = vec4(color * (0.72 + fog * 0.48), fog * uOpacity);
}
`;

const EYE_FRAGMENT = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uEyeColor;
uniform vec3 uCoreColor;
uniform float uGlowIntensity;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i), hash(i+vec2(1.,1.)), f.x), f.y);
}
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
  float radius = length(uv * vec2(.88, 1.45));
  float flame = noise(vec2(atan(uv.y, uv.x) * 2.3, radius * 5.0 - uTime * 1.75));
  float shell = smoothstep(1.15, .18, radius + (flame - .5) * .16);
  float pupil = smoothstep(.23, .14, length((uv - uMouse * .07) * vec2(3.8, 1.0)));
  float iris = smoothstep(.68, .20, radius) - smoothstep(.35, .12, radius);
  vec3 color = uEyeColor * (shell * (0.42 + flame * .65) + iris * .72) * uGlowIntensity;
  color = mix(color, uCoreColor, pupil);
  gl_FragColor = vec4(color + uEyeColor * pow(max(0.0, 1.0 - radius), 5.0) * .5, shell * .94);
}
`;

const VISUAL_THEME = {
  light: { horizon: '#bccb35', wave: '#07100a', crest: '#e3ec9a', waveOpacity: .58, eye: '#aec72c', eyeCore: '#11150e', eyeGlow: .84 },
  dark: { horizon: '#c8f05b', wave: '#031006', crest: '#f0ffb5', waveOpacity: .78, eye: '#c9f45d', eyeCore: '#030702', eyeGlow: 1.18 },
};

const QUALITY = {
  high: { wavesScale: .82, eyeScale: 1, wavesFps: 30, eyeFps: 30, wavesSteps: 28 },
  balanced: { wavesScale: .62, eyeScale: .8, wavesFps: 24, eyeFps: 24, wavesSteps: 20 },
  eco: { wavesScale: 0, eyeScale: 0, wavesFps: 0, eyeFps: 0, wavesSteps: 0 },
  static: { wavesScale: 0, eyeScale: 0, wavesFps: 0, eyeFps: 0, wavesSteps: 0 },
};

function hexToVec3(hex) {
  const value = hex.replace('#', '');
  return new Float32Array([parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255]);
}

function chooseVisualQuality() {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const memory = Number(navigator.deviceMemory ?? 4);
  const cores = Number(navigator.hardwareConcurrency ?? 4);
  const connection = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
  const constrainedNetwork = connection?.saveData || /(^|-)2g/.test(connection?.effectiveType ?? '');
  const smallViewport = window.innerWidth < 680;
  if (reduced) return 'static';
  if (coarse || smallViewport || memory <= 2 || cores <= 4 || constrainedNetwork) return 'eco';
  if (memory >= 8 && cores >= 8) return 'high';
  return 'balanced';
}

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

function mountShader(canvas, fragment, { mouse = false, className = '', quality } = {}) {
  if (!canvas || quality === 'static' || quality === 'eco') { canvas?.classList.add('is-unavailable'); return; }
  const preset = QUALITY[quality] ?? QUALITY.balanced;
  const isWaves = className === 'gradient-waves';
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
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
  const steps = isWaves ? gl.getUniformLocation(program, 'uSteps') : null;
  const themeUniforms = isWaves
    ? { horizon: gl.getUniformLocation(program, 'uHorizonColor'), wave: gl.getUniformLocation(program, 'uWaveColor'), crest: gl.getUniformLocation(program, 'uCrestColor'), opacity: gl.getUniformLocation(program, 'uOpacity') }
    : { eye: gl.getUniformLocation(program, 'uEyeColor'), core: gl.getUniformLocation(program, 'uCoreColor'), glow: gl.getUniformLocation(program, 'uGlowIntensity') };
  const applyThemeUniforms = (theme = document.documentElement.dataset.theme || 'light') => {
    const palette = VISUAL_THEME[theme] ?? VISUAL_THEME.light;
    gl.useProgram(program);
    if (isWaves) {
      gl.uniform3fv(themeUniforms.horizon, hexToVec3(palette.horizon));
      gl.uniform3fv(themeUniforms.wave, hexToVec3(palette.wave));
      gl.uniform3fv(themeUniforms.crest, hexToVec3(palette.crest));
      gl.uniform1f(themeUniforms.opacity, palette.waveOpacity);
      gl.uniform1f(steps, preset.wavesSteps);
    } else {
      gl.uniform3fv(themeUniforms.eye, hexToVec3(palette.eye));
      gl.uniform3fv(themeUniforms.core, hexToVec3(palette.eyeCore));
      gl.uniform1f(themeUniforms.glow, palette.eyeGlow);
    }
  };
  applyThemeUniforms();
  const onThemeChange = (event) => { applyThemeUniforms(event.detail?.theme); schedule(); };
  window.addEventListener('retroplay:themechange', onThemeChange);

  let mouseX = .5, mouseY = .5, targetX = .5, targetY = .5;
  let bounds = canvas.getBoundingClientRect();
  let resizeDirty = true, visible = true, pageVisible = !document.hidden, frame = 0, lastPaint = 0;
  const frameInterval = 1000 / (isWaves ? preset.wavesFps : preset.eyeFps);
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, isWaves ? preset.wavesScale : preset.eyeScale);
    const w = Math.max(1, Math.round(bounds.width * scale));
    const h = Math.max(1, Math.round(bounds.height * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    resizeDirty = false;
  };
  const resizeObserver = new ResizeObserver(() => { bounds = canvas.getBoundingClientRect(); resizeDirty = true; schedule(); });
  resizeObserver.observe(canvas);
  const pointerMove = (event) => {
    if (!mouse || !bounds.width || !bounds.height) return;
    targetX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    targetY = Math.max(0, Math.min(1, 1 - (event.clientY - bounds.top) / bounds.height));
  };
  const pointerLeave = () => { targetX = .5; targetY = .5; };
  canvas.addEventListener('pointermove', pointerMove, { passive: true });
  canvas.addEventListener('pointerleave', pointerLeave, { passive: true });
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { threshold: 0.01 });
  visibilityObserver.observe(canvas);
  const onVisibility = () => { pageVisible = !document.hidden; schedule(); };
  document.addEventListener('visibilitychange', onVisibility);
  const draw = (now) => {
    frame = 0;
    if (!visible || !pageVisible) return;
    if (now - lastPaint < frameInterval) { frame = requestAnimationFrame(draw); return; }
    lastPaint = now;
    mouseX += (targetX - mouseX) * .09;
    mouseY += (targetY - mouseY) * .09;
    if (resizeDirty) resize();
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
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('retroplay:themechange', onThemeChange);
    canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('pointerleave', pointerLeave);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

export function prepareVisualQuality() {
  const quality = chooseVisualQuality();
  document.documentElement.dataset.visualQuality = quality;
  return quality;
}

export function initVisualEffects() {
  const quality = document.documentElement.dataset.visualQuality || prepareVisualQuality();
  const stopWaves = mountShader(document.getElementById('gradient-waves'), WAVES_FRAGMENT, { mouse: true, className: 'gradient-waves', quality });
  const stopEye = mountShader(document.getElementById('evil-eye'), EYE_FRAGMENT, { mouse: true, className: 'evil-eye', quality });
  return () => { stopWaves?.(); stopEye?.(); };
}

const AUDIO_KEY = 'retroplay:retro-audio';

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUDIO_KEY) ?? '{}');
    return {
      enabled: parsed.enabled === true,
      volume: Math.min(1, Math.max(0, Number(parsed.volume ?? 0.42))),
    };
  } catch {
    return { enabled: false, volume: 0.42 };
  }
}

function saveState(state) {
  try { localStorage.setItem(AUDIO_KEY, JSON.stringify(state)); } catch { /* session-only fallback */ }
}

export function initRetroAudio() {
  const player = document.getElementById('retro-audio-player');
  const toggle = document.getElementById('retro-audio-toggle');
  const label = document.getElementById('retro-audio-label');
  const volume = document.getElementById('retro-audio-volume');
  if (!player || !toggle || !label || !volume) return () => {};

  const state = readState();
  let context = null;
  let active = false;
  let resumeAfterHubPause = false;
  let resumeAfterVisibilityPause = false;
  let fadeFrame = 0;
  player.volume = state.volume;
  volume.value = String(Math.round(state.volume * 100));

  const render = () => {
    toggle.setAttribute('aria-pressed', String(active));
    toggle.setAttribute('aria-label', active ? 'Disable Retro Audio' : (state.enabled ? 'Resume Retro Audio' : 'Enable Retro Audio'));
    label.textContent = active ? 'Audio on' : (state.enabled ? 'Audio ready' : 'Audio off');
    toggle.classList.toggle('is-audio-active', active);
  };

  const audioContext = () => {
    if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume();
    return context;
  };

  const sfx = (kind = 'tick') => {
    if (!active || document.hidden || !(window.AudioContext || window.webkitAudioContext)) return;
    const ctx = audioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const frequency = kind === 'launch' ? 184 : (kind === 'open' ? 372 : 248);
    oscillator.type = kind === 'launch' ? 'sawtooth' : 'square';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (kind === 'launch' ? 1.8 : 1.32), now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.045, state.volume * 0.09), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'launch' ? 0.16 : 0.09));
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + (kind === 'launch' ? 0.17 : 0.10));
  };

  const fadeTo = (target, duration = 260) => {
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    const start = player.volume;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      player.volume = start + (target - start) * (1 - Math.pow(1 - progress, 3));
      if (progress < 1) fadeFrame = requestAnimationFrame(tick);
      else fadeFrame = 0;
    };
    fadeFrame = requestAnimationFrame(tick);
  };

  const enable = async () => {
    state.enabled = true;
    saveState(state);
    try {
      player.volume = 0;
      await player.play();
      active = true;
      fadeTo(state.volume);
      render();
      sfx('open');
    } catch {
      active = false;
      render();
    }
  };

  const disable = () => {
    state.enabled = false;
    resumeAfterHubPause = false;
    resumeAfterVisibilityPause = false;
    saveState(state);
    active = false;
    fadeTo(0, 170);
    window.setTimeout(() => { if (!active) player.pause(); }, 180);
    render();
  };

  const pauseTemporarily = (reason) => {
    if (!active) return;
    if (reason === 'hub') resumeAfterHubPause = true;
    if (reason === 'visibility') resumeAfterVisibilityPause = true;
    active = false;
    fadeTo(0, 150);
    window.setTimeout(() => { if (!active) player.pause(); }, 160);
    render();
  };

  const resumeTemporarily = (reason) => {
    const canResume = reason === 'hub' ? resumeAfterHubPause : resumeAfterVisibilityPause;
    if (!canResume || !state.enabled || document.hidden) return;
    if (reason === 'hub') resumeAfterHubPause = false;
    if (reason === 'visibility') resumeAfterVisibilityPause = false;
    enable();
  };

  toggle.addEventListener('click', () => { if (active) disable(); else enable(); });
  volume.addEventListener('input', () => {
    state.volume = Number(volume.value) / 100;
    saveState(state);
    if (active) player.volume = state.volume;
  });
  document.addEventListener('click', (event) => {
    if (!active || event.target.closest('#retro-audio-toggle, input, select, label, a')) return;
    const button = event.target.closest('button');
    if (!button) return;
    sfx(button.matches('[data-action="play-game"], [data-action="open-runtime"], [data-action="play-featured"]') ? 'launch' : 'tick');
  });
  window.addEventListener('retroplay:audio-sfx', (event) => sfx(event.detail?.kind ?? 'tick'));
  window.addEventListener('retroplay:audio-pause', () => pauseTemporarily('hub'));
  window.addEventListener('retroplay:audio-resume', () => resumeTemporarily('hub'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseTemporarily('visibility');
    else resumeTemporarily('visibility');
  });
  player.addEventListener('error', () => { active = false; state.enabled = false; saveState(state); render(); });
  render();

  return () => {
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    player.pause();
    context?.close?.();
  };
}

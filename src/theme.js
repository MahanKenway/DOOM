const STORAGE_KEY = 'retroplay:theme';
const THEMES = new Set(['light', 'dark']);

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function storedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return THEMES.has(value) ? value : null;
  } catch {
    return null;
  }
}

function updateToggle(theme) {
  const toggle = document.getElementById('theme-toggle');
  const label = toggle?.querySelector('[data-theme-label]');
  if (!toggle || !label) return;
  const isDark = theme === 'dark';
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  label.textContent = isDark ? 'Dark' : 'Light';
}

export function applyTheme(theme, { persist = false, source = 'system', announce = true } = {}) {
  const nextTheme = THEMES.has(theme) ? theme : systemTheme();
  const root = document.documentElement;
  const previousTheme = root.dataset.theme;
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', nextTheme === 'dark' ? '#10140f' : '#e7e6e0');
  updateToggle(nextTheme);
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, nextTheme); } catch { /* session-only theme fallback */ }
  }
  if (announce && previousTheme !== nextTheme) {
    window.dispatchEvent(new CustomEvent('retroplay:themechange', {
      detail: { theme: nextTheme, previousTheme: previousTheme || null, source },
    }));
  }
  return nextTheme;
}

export function initTheme() {
  const initialTheme = storedTheme() ?? document.documentElement.dataset.theme ?? systemTheme();
  applyTheme(initialTheme, { source: 'init', announce: true });

  const toggle = document.getElementById('theme-toggle');
  toggle?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, { persist: true, source: 'toggle' });
  });

  const query = window.matchMedia?.('(prefers-color-scheme: dark)');
  const onSystemThemeChange = (event) => {
    if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light', { source: 'system' });
  };
  query?.addEventListener?.('change', onSystemThemeChange);
  const stopMagnet = initMagnet();

  return () => {
    query?.removeEventListener?.('change', onSystemThemeChange);
    stopMagnet?.();
  };
}

function initMagnet() {
  const supported = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!supported) return;
  let active = null;
  let frame = 0;
  let pointer = null;
  const reset = (button) => {
    button?.classList.remove('is-magnet-active');
    button?.style.removeProperty('--magnet-x');
    button?.style.removeProperty('--magnet-y');
  };
  const update = () => {
    frame = 0;
    if (!active || !pointer || !active.isConnected) return;
    const bounds = active.getBoundingClientRect();
    const distanceX = pointer.x - (bounds.left + bounds.width / 2);
    const distanceY = pointer.y - (bounds.top + bounds.height / 2);
    const range = Math.max(bounds.width, bounds.height) * .82;
    if (Math.hypot(distanceX, distanceY) > range) { reset(active); active = null; return; }
    active.classList.add('is-magnet-active');
    active.style.setProperty('--magnet-x', `${Math.max(-6, Math.min(6, distanceX / 10)).toFixed(2)}px`);
    active.style.setProperty('--magnet-y', `${Math.max(-4, Math.min(4, distanceY / 12)).toFixed(2)}px`);
  };
  const onMove = (event) => {
    const button = event.target?.closest?.('[data-magnet]');
    if (button !== active) { reset(active); active = button ?? null; }
    if (!active) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onLeave = (event) => {
    const button = event.target?.closest?.('[data-magnet]');
    if (!button || button.contains(event.relatedTarget)) return;
    if (button === active) active = null;
    reset(button);
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerout', onLeave);
  return () => {
    if (frame) cancelAnimationFrame(frame);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerout', onLeave);
    reset(active);
  };
}

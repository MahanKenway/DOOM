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
    document.documentElement.classList.add('theme-transitioning');
    applyTheme(nextTheme, { persist: true, source: 'toggle' });
    window.setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 420);
  });

  const query = window.matchMedia?.('(prefers-color-scheme: dark)');
  const onSystemThemeChange = (event) => {
    if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light', { source: 'system' });
  };
  query?.addEventListener?.('change', onSystemThemeChange);

  return () => {
    query?.removeEventListener?.('change', onSystemThemeChange);
  };
}

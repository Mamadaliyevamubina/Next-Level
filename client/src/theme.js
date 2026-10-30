// Applies appearance settings to <html> as data attributes; styles.css does the rest.
// A copy is kept in localStorage so the login page uses the same look before signing in.
const KEY = 'nl-appearance';
const APPEARANCE = ['theme', 'accent', 'fontSize', 'font', 'reduceMotion', 'compact'];

export function applyAppearance(settings) {
  const root = document.documentElement;
  const s = settings || {};
  root.dataset.theme = s.theme || 'system';
  root.dataset.accent = s.accent || 'purple';
  root.dataset.size = s.fontSize || 'medium';
  root.dataset.font = s.font || 'inter';
  root.dataset.motion = s.reduceMotion ? 'reduce' : 'full';
  root.dataset.density = s.compact ? 'compact' : 'comfy';
  const saved = Object.fromEntries(APPEARANCE.filter((k) => k in s).map((k) => [k, s[k]]));
  localStorage.setItem(KEY, JSON.stringify(saved));
}

export function savedAppearance() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

// Light or dark as actually shown, resolving "system" from the OS setting.
export function effectiveTheme(theme) {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

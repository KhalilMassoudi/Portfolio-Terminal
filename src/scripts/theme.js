/**
 * THEME — live accent switching, persisted to localStorage.
 * Each theme overrides only the accent-related tokens; the rest of the
 * design system stays constant, guaranteeing visual consistency.
 */

const THEMES = {
  amber: {
    '--c-accent': '#ffb454',
    '--c-accent-soft': '#f5d7a1',
    '--c-accent-deep': '#e0951f',
    '--c-accent-rgb': '255, 180, 84',
  },
  cyan: {
    '--c-accent': '#22d3ee',
    '--c-accent-soft': '#a5f3fc',
    '--c-accent-deep': '#0891b2',
    '--c-accent-rgb': '34, 211, 238',
  },
  green: {
    '--c-accent': '#6ee7a8',
    '--c-accent-soft': '#bbf7d0',
    '--c-accent-deep': '#22c55e',
    '--c-accent-rgb': '110, 231, 168',
  },
};

const STORAGE_KEY = 'portfolio-theme';

export function applyTheme(name) {
  const theme = THEMES[name] || THEMES.amber;
  const root = document.documentElement;
  Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v));
  root.dataset.theme = name in THEMES ? name : 'amber';
  try {
    localStorage.setItem(STORAGE_KEY, root.dataset.theme);
  } catch (_) {
    /* storage may be unavailable (private mode) — non-fatal */
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: root.dataset.theme }));
}

export function initTheme() {
  let saved = 'amber';
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'amber';
  } catch (_) {
    /* ignore */
  }
  applyTheme(saved);
  return saved;
}

export const themeNames = Object.keys(THEMES);

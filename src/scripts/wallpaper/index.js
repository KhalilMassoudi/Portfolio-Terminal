/**
 * WALLPAPER — orchestrates which renderer (CSS or WebGL) draws the space
 * scene behind the desktop, mirroring theme.js's init/apply/persist shape.
 * Each variant module owns its own mount(root)/unmount() lifecycle,
 * including its own listeners — this module just switches between them.
 */

import * as cssVariant from './starfield-css.js';
import * as glVariant from './starfield-gl.js';

const STORAGE_KEY = 'portfolio-wallpaper';
const VARIANTS = { css: cssVariant, gl: glVariant };

let sceneEl = null;
let active = null;
let activeMod = null;
let listeners = [];

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && (parsed.technique === 'css' || parsed.technique === 'gl') ? parsed : null;
  } catch (_) {
    return null;
  }
}

function persist(technique) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ scene: 'space', technique }));
  } catch (_) {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

export async function setWallpaperMode(technique, { persistChoice = true } = {}) {
  const requested = technique === 'gl' ? 'gl' : 'css';

  if (activeMod) {
    try {
      activeMod.unmount();
    } catch (_) {
      /* best-effort teardown */
    }
    activeMod = null;
  }
  sceneEl.innerHTML = '';

  let resolved = requested;
  try {
    await VARIANTS[resolved].mount(sceneEl);
  } catch (_) {
    // GL failed to mount (unsupported / driver issue) — fall back to CSS.
    resolved = 'css';
    sceneEl.innerHTML = '';
    try {
      await cssVariant.mount(sceneEl);
    } catch (_) {
      /* CSS variant should never throw — nothing further we can do */
    }
  }

  active = resolved;
  activeMod = VARIANTS[resolved];
  if (persistChoice) persist(resolved);
  listeners.forEach((fn) => fn(active));
}

export function initWallpaper(el) {
  el.innerHTML = `
    <div class="wallpaper__scene" data-scene></div>
    <div class="wallpaper__vignette" aria-hidden="true"></div>
  `;
  sceneEl = el.querySelector('[data-scene]');

  // GL reports runtime failures (lost context, a render-loop error) here
  // instead of dying silently — fall back to CSS and remember it, so a
  // flaky device doesn't keep retrying GL on every reload.
  window.addEventListener('wallpaper:gl-failed', () => {
    if (active === 'gl') setWallpaperMode('css');
  });

  const saved = readSaved();
  setWallpaperMode(saved ? saved.technique : 'css', { persistChoice: false });
}

export function getWallpaperMode() {
  return active;
}

export function isGLSupported() {
  return glVariant.isSupported();
}

export function onWallpaperChange(fn) {
  listeners.push(fn);
}

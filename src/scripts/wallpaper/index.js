/**
 * WALLPAPER — orchestrates which wallpaper mode draws behind the desktop,
 * mirroring theme.js's init/apply/persist shape. Each mode's module owns
 * its own mount(root)/unmount() lifecycle, including its own listeners —
 * this module just switches between them.
 */

import * as roomVariant from './room-gl.js';
import * as hillsVariant from './hills-css.js';
import * as starsVariant from './starfield-css.js';
import * as starsGlVariant from './starfield-gl.js';

const STORAGE_KEY = 'portfolio-wallpaper';
const DEFAULT_MODE = 'room';
// Where a failed mount or a runtime GL failure falls back to — always the
// dependency-free CSS variant, never another WebGL mode (that could loop).
const SAFE_FALLBACK = 'hills';

// Persisted as { scene, technique } rather than the mode key directly, so a
// future scene/technique combo doesn't need a storage-schema migration.
const MODES = {
  room: { scene: 'room', technique: 'gl', mod: roomVariant },
  hills: { scene: 'hills', technique: 'css', mod: hillsVariant },
  stars: { scene: 'space', technique: 'css', mod: starsVariant },
  'stars-gl': { scene: 'space', technique: 'gl', mod: starsGlVariant },
};

let sceneEl = null;
let active = null;
let activeMod = null;
let listeners = [];

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const match = Object.entries(MODES).find(
      ([, m]) => m.scene === parsed?.scene && m.technique === parsed?.technique
    );
    return match ? match[0] : null;
  } catch (_) {
    return null;
  }
}

function persist(mode) {
  try {
    const { scene, technique } = MODES[mode];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ scene, technique }));
  } catch (_) {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

export async function setWallpaperMode(mode, { persistChoice = true } = {}) {
  const requested = MODES[mode] ? mode : DEFAULT_MODE;

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
    await MODES[resolved].mod.mount(sceneEl);
  } catch (_) {
    // Mount failed (unsupported / driver issue) — fall back to the
    // dependency-free variant rather than leaving the scene empty.
    resolved = SAFE_FALLBACK;
    sceneEl.innerHTML = '';
    try {
      await MODES[SAFE_FALLBACK].mod.mount(sceneEl);
    } catch (_) {
      /* the safe fallback should never throw — nothing further we can do */
    }
  }

  active = resolved;
  activeMod = MODES[resolved].mod;
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
  // instead of dying silently — fall back to the safe CSS variant and
  // remember it, so a flaky device doesn't keep retrying GL on reload.
  window.addEventListener('wallpaper:gl-failed', () => {
    if (active === 'room' || active === 'stars-gl') setWallpaperMode(SAFE_FALLBACK);
  });

  const saved = readSaved();
  setWallpaperMode(saved || DEFAULT_MODE, { persistChoice: false });
}

export function getWallpaperMode() {
  return active;
}

export function isGLSupported() {
  return starsGlVariant.isSupported();
}

export function onWallpaperChange(fn) {
  listeners.push(fn);
}

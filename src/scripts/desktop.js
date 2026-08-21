/**
 * DESKTOP CHROME — topbar, desktop icon grid, and dock.
 * All three are dumb views over one WindowManager + app registry: every
 * click resolves to `wm.open(app.id, app)` (or `app.action()` for
 * direct-action apps like a résumé download), so GUI and terminal stay
 * in sync automatically via `wm.onChange`.
 */

import { profile, socials } from '../data/content.js';
import { applyTheme, themeNames } from './theme.js';
import { setWallpaperMode, getWallpaperMode, isGLSupported, onWallpaperChange } from './wallpaper/index.js';

function launch(wm, apps, id, { fromDock = false } = {}) {
  const app = apps.find((a) => a.id === id);
  if (!app) return;
  if (app.action) {
    app.action(wm);
    return;
  }
  if (fromDock && wm.isActive(id)) {
    wm.toggleMinimize(id);
    return;
  }
  wm.open(id, app);
}

function renderTopbar(root, wm, apps) {
  const email = socials.find((s) => s.id === 'email');
  const github = socials.find((s) => s.id === 'github');
  const linkedin = socials.find((s) => s.id === 'linkedin');
  const menuApps = apps.filter((a) => a.inMenu);

  root.innerHTML = `
    <div class="topbar__side topbar__side--left">
      <button type="button" class="topbar__brand" data-open="about">
        <span class="topbar__prompt">&gt;</span> ${profile.handle}<span class="topbar__cursor">_</span>
      </button>
      <nav class="topbar__menu" aria-label="Sections">
        ${menuApps.map((a) => `<button type="button" class="topbar__menu-item" data-open="${a.id}">${a.title}</button>`).join('')}
      </nav>
    </div>
    <div class="topbar__side topbar__side--right">
      <span class="topbar__clock" data-clock aria-hidden="true"></span>
      <span class="topbar__themes" role="group" aria-label="Accent color">
        ${themeNames.map((t) => `<button type="button" class="theme-dot theme-dot--${t}" data-theme="${t}" aria-label="${t} theme"></button>`).join('')}
      </span>
      <span class="topbar__wallpaper" role="group" aria-label="Wallpaper">
        <button type="button" class="wallpaper-toggle" data-wallpaper="room" aria-label="3D Room wallpaper"${isGLSupported() ? '' : ' disabled'}>Room</button>
        <button type="button" class="wallpaper-toggle" data-wallpaper="stars-gl" aria-label="Stars 3D wallpaper"${isGLSupported() ? '' : ' disabled'}>3D</button>
      </span>
      <span class="topbar__socials">
        ${github ? `<a class="topbar__icon" href="${github.href}" target="_blank" rel="noopener" aria-label="GitHub">GH</a>` : ''}
        ${linkedin ? `<a class="topbar__icon" href="${linkedin.href}" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>` : ''}
      </span>
      <button type="button" class="btn btn--accent btn--sm" data-open="contact">Get in touch</button>
    </div>`;

  const clock = root.querySelector('[data-clock]');
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  tick();
  setInterval(tick, 15000);

  root.addEventListener('click', (e) => {
    const openBtn = e.target.closest('[data-open]');
    if (openBtn) launch(wm, apps, openBtn.dataset.open);
    const themeBtn = e.target.closest('[data-theme]');
    if (themeBtn) applyTheme(themeBtn.dataset.theme);
    const wallpaperBtn = e.target.closest('[data-wallpaper]');
    if (wallpaperBtn && !wallpaperBtn.disabled) setWallpaperMode(wallpaperBtn.dataset.wallpaper);
  });

  const syncWallpaperButtons = () => {
    const mode = getWallpaperMode();
    root.querySelectorAll('[data-wallpaper]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.wallpaper === mode);
    });
  };
  onWallpaperChange(syncWallpaperButtons);
  syncWallpaperButtons();

  return {
    refresh() {
      apps
        .filter((a) => a.inMenu)
        .forEach((a) => {
          root
            .querySelector(`.topbar__menu-item[data-open="${a.id}"]`)
            ?.classList.toggle('is-active', wm.isActive(a.id));
        });
    },
  };
}

function renderIcons(root, wm, apps) {
  root.innerHTML = apps
    .map(
      (a) => `
      <button type="button" class="icon-tile" data-open="${a.id}">
        <span class="icon-tile__glyph">${a.icon}</span>
        <span class="icon-tile__label">${a.title}</span>
      </button>`
    )
    .join('');

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]');
    if (btn) launch(wm, apps, btn.dataset.open);
  });
}

function renderDock(root, wm, apps) {
  root.innerHTML = apps
    .map(
      (a) => `
      <button type="button" class="dock__item" data-open="${a.id}" aria-label="${a.title}">
        <span class="dock__glyph">${a.icon}</span>
        <span class="dock__indicator" data-indicator="${a.id}"></span>
      </button>`
    )
    .join('');

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]');
    if (btn) launch(wm, apps, btn.dataset.open, { fromDock: true });
  });

  return {
    refresh() {
      apps.forEach((a) => {
        const item = root.querySelector(`.dock__item[data-open="${a.id}"]`);
        if (!item) return;
        item.classList.toggle('is-open', wm.isOpen(a.id));
        item.classList.toggle('is-active', wm.isActive(a.id));
      });
    },
  };
}

export function renderDesktop({ topbarEl, iconsLeftEl, iconsRightEl, dockEl }, wm, apps) {
  const topbar = renderTopbar(topbarEl, wm, apps);
  renderIcons(
    iconsLeftEl,
    wm,
    apps.filter((a) => a.side !== 'right')
  );
  renderIcons(
    iconsRightEl,
    wm,
    apps.filter((a) => a.side === 'right')
  );
  const dock = renderDock(dockEl, wm, apps);

  const refresh = () => {
    topbar.refresh();
    dock.refresh();
  };
  wm.onChange(refresh);
  refresh();
}

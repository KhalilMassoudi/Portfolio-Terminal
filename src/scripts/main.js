/**
 * MAIN — application bootstrap.
 * A fixed desktop shell (wallpaper + topbar + icons + dock) hosts every
 * section as an openable window, driven by one WindowManager instance
 * shared by the GUI and the terminal's `open`/`close` commands.
 */

import { WindowManager } from './windows.js';
import { renderDesktop } from './desktop.js';
import { buildApps } from './apps.js';
import { initTheme } from './theme.js';
import { typewriter } from './typewriter.js';
import { initWallpaper } from './wallpaper/index.js';

function playBoot() {
  const bootEl = document.getElementById('boot');
  if (!bootEl) return Promise.resolve();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    bootEl.remove();
    return Promise.resolve();
  }

  bootEl.innerHTML = `<div class="boot__line"><span class="boot__prompt">&gt;</span><span data-boot-tw></span></div>`;
  typewriter(bootEl.querySelector('[data-boot-tw]'), ['booting portfolio.sh …'], {
    typeSpeed: 26,
    startDelay: 120,
    hold: 5000,
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      bootEl.classList.add('is-done');
      setTimeout(() => {
        bootEl.remove();
        resolve();
      }, 420);
    }, 950);
  });
}

function init() {
  initTheme();
  initWallpaper(document.getElementById('wallpaper'));

  const wm = new WindowManager(document.getElementById('window-layer'));
  const apps = buildApps();

  renderDesktop(
    {
      topbarEl: document.getElementById('topbar'),
      iconsEl: document.getElementById('desktop-icons'),
      dockEl: document.getElementById('dock'),
    },
    wm,
    apps
  );

  playBoot().then(() => {
    const terminalApp = apps.find((a) => a.id === 'terminal');
    const aboutApp = apps.find((a) => a.id === 'about');
    if (terminalApp) wm.open('terminal', terminalApp);
    if (aboutApp) wm.open('about', aboutApp);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

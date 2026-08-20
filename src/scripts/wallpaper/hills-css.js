/**
 * HILLS — a calm, code-generated landscape wallpaper (soft horizon glow +
 * layered hill silhouettes + a few slow fireflies). Inspired by posthog.com's
 * illustrated backdrop, adapted to this site's dark terminal palette instead
 * of a bright daytime scene. Deliberately has no pointer-reactive motion —
 * the space wallpaper's cursor-driven parallax was the direct complaint that
 * led here, so everything here is slow and fully ambient.
 */

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

let state = null;

export function mount(root) {
  root.innerHTML = `
    <div class="wallpaper__horizon" aria-hidden="true"></div>
    <div class="wallpaper__mound wallpaper__mound--back" aria-hidden="true"></div>
    <div class="wallpaper__mound wallpaper__mound--mid" aria-hidden="true"></div>
    <div class="wallpaper__mound wallpaper__mound--front" aria-hidden="true"></div>
    <div class="wallpaper__fireflies" data-fireflies aria-hidden="true"></div>
  `;

  const fireflies = root.querySelector('[data-fireflies]');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 7; i++) {
    const dot = document.createElement('div');
    dot.className = 'firefly';
    dot.style.left = `${rand(5, 95)}%`;
    dot.style.top = `${rand(28, 82)}%`;
    dot.style.setProperty('--delay', `${rand(0, 10).toFixed(2)}s`);
    dot.style.setProperty('--dur', `${rand(7, 13).toFixed(2)}s`);
    frag.appendChild(dot);
  }
  fireflies.appendChild(frag);

  state = { root };
  if (reduceMotion()) root.classList.add('is-static');
}

export function unmount() {
  if (!state) return;
  state.root.innerHTML = '';
  state = null;
}

/**
 * STARFIELD (CSS) — zero-dependency space wallpaper. A code-generated
 * (no external image) star tile is reused at three background-size
 * scales for cheap depth, plus a handful of DOM twinkle stars and CSS
 * nebula gradients that re-theme for free via --c-accent-rgb.
 */

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = () => matchMedia('(pointer: coarse)').matches;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function buildStarTile(size = 340) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const draw = (x, y, r, a) => {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  const count = Math.round(size * 0.9);
  const margin = 3;
  for (let i = 0; i < count; i++) {
    const x = rand(0, size);
    const y = rand(0, size);
    const r = rand(0.4, 1.6);
    const a = rand(0.25, 1);
    draw(x, y, r, a);
    // Mirror near-edge stars to the opposite edge so the tile repeats seamlessly.
    if (x < margin) draw(x + size, y, r, a);
    if (x > size - margin) draw(x - size, y, r, a);
    if (y < margin) draw(x, y + size, r, a);
    if (y > size - margin) draw(x, y - size, r, a);
  }

  return canvas.toDataURL('image/png');
}

let state = null;

export function mount(root) {
  root.innerHTML = `
    <div class="wallpaper__nebula" aria-hidden="true"></div>
    <div class="wallpaper__stars wallpaper__stars--far" aria-hidden="true"></div>
    <div class="wallpaper__stars wallpaper__stars--mid" aria-hidden="true"></div>
    <div class="wallpaper__stars wallpaper__stars--near" aria-hidden="true"></div>
    <div class="wallpaper__twinkles" data-twinkles aria-hidden="true"></div>
  `;

  const tile = buildStarTile();
  root.querySelectorAll('.wallpaper__stars').forEach((el) => {
    el.style.backgroundImage = `url(${tile})`;
  });

  const twinkles = root.querySelector('[data-twinkles]');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 20; i++) {
    const star = document.createElement('div');
    star.className = 'star--twinkle';
    star.style.left = `${rand(0, 100)}%`;
    star.style.top = `${rand(0, 100)}%`;
    star.style.setProperty('--delay', `${rand(0, 6).toFixed(2)}s`);
    star.style.setProperty('--dur', `${rand(3, 6).toFixed(2)}s`);
    frag.appendChild(star);
  }
  twinkles.appendChild(frag);

  state = { root, onMove: null, raf: null };

  if (reduceMotion()) {
    root.classList.add('is-static');
    return;
  }

  if (!coarsePointer()) {
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      root.style.setProperty('--px', curX.toFixed(4));
      root.style.setProperty('--py', curY.toFixed(4));
      state.raf = requestAnimationFrame(tick);
    };

    document.addEventListener('pointermove', onMove);
    state.onMove = onMove;
    state.raf = requestAnimationFrame(tick);
  }
}

export function unmount() {
  if (!state) return;
  if (state.raf) cancelAnimationFrame(state.raf);
  if (state.onMove) document.removeEventListener('pointermove', state.onMove);
  state.root.innerHTML = '';
  state = null;
}

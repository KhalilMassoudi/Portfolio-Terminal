/**
 * STARFIELD (WebGL) — a real 3D Three.js particle field + a runtime-drawn
 * nebula glow (canvas texture, no external image). Three.js is dynamically
 * imported inside mount() so CSS-only visitors never fetch it.
 */

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => matchMedia('(max-width: 768px)').matches;

export function isSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch (_) {
    return false;
  }
}

function readAccentRGB() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--c-accent-rgb').trim();
  const [r, g, b] = raw.split(',').map((n) => parseInt(n.trim(), 10));
  return {
    r: Number.isFinite(r) ? r : 255,
    g: Number.isFinite(g) ? g : 180,
    b: Number.isFinite(b) ? b : 84,
  };
}

function paintNebula(ctx, size, { r, g, b }) {
  ctx.clearRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
  grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.16)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
}

let state = null;

export async function mount(root) {
  if (!isSupported()) throw new Error('WebGL unsupported');

  const THREE = await import('three');

  const canvas = document.createElement('canvas');
  canvas.className = 'wallpaper__gl';
  root.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 5;

  const group = new THREE.Group();
  scene.add(group);

  const mobile = isMobile();
  const lowPower = (navigator.hardwareConcurrency || 4) <= 2;
  const starCount = mobile || lowPower ? 550 : 1800;

  const { r: ar, g: ag, b: ab } = readAccentRGB();
  const accentColor = new THREE.Color(ar / 255, ag / 255, ab / 255);
  const white = new THREE.Color(0xffffff);

  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const accentIdx = [];

  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = -Math.random() * 18;

    const useAccent = Math.random() < 0.1;
    if (useAccent) accentIdx.push(i);
    const c = useAccent ? accentColor : white;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.045,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  group.add(new THREE.Points(geometry, material));

  const nebulaSize = 256;
  const nebulaCanvas = document.createElement('canvas');
  nebulaCanvas.width = nebulaSize;
  nebulaCanvas.height = nebulaSize;
  const nebulaCtx = nebulaCanvas.getContext('2d');
  paintNebula(nebulaCtx, nebulaSize, readAccentRGB());

  const nebulaTexture = new THREE.CanvasTexture(nebulaCanvas);
  const nebulaGeo = new THREE.PlaneGeometry(1, 1);
  const nebulaMaterial = new THREE.MeshBasicMaterial({
    map: nebulaTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const nebulaCount = mobile ? 1 : 3;
  for (let i = 0; i < nebulaCount; i++) {
    const mesh = new THREE.Mesh(nebulaGeo, nebulaMaterial);
    const scale = 8 + Math.random() * 6;
    mesh.scale.set(scale, scale, 1);
    mesh.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, -6 - Math.random() * 4);
    group.add(mesh);
  }

  const resize = () => {
    const w = root.clientWidth || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(root);

  const onTheme = () => {
    const rgb = readAccentRGB();
    paintNebula(nebulaCtx, nebulaSize, rgb);
    nebulaTexture.needsUpdate = true;

    const newAccent = new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    const colorAttr = geometry.getAttribute('color');
    accentIdx.forEach((i) => colorAttr.setXYZ(i, newAccent.r, newAccent.g, newAccent.b));
    colorAttr.needsUpdate = true;
  };
  window.addEventListener('themechange', onTheme);

  const render = () => renderer.render(scene, camera);

  state = { root, canvas, renderer, geometry, material, nebulaGeo, nebulaMaterial, nebulaTexture, ro, onTheme, onMove: null, raf: null };

  if (reduceMotion()) {
    render();
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;

  const onMove = (e) => {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = (e.clientY / window.innerHeight) * 2 - 1;
  };
  document.addEventListener('pointermove', onMove);
  state.onMove = onMove;

  const tick = () => {
    curX += (targetX - curX) * 0.04;
    curY += (targetY - curY) * 0.04;
    group.rotation.y = curX * 0.15;
    group.rotation.x = curY * 0.1;
    render();
    state.raf = requestAnimationFrame(tick);
  };
  state.raf = requestAnimationFrame(tick);
}

export function unmount() {
  if (!state) return;
  const { canvas, renderer, geometry, material, nebulaGeo, nebulaMaterial, nebulaTexture, ro, onTheme, onMove, raf } = state;

  if (raf) cancelAnimationFrame(raf);
  if (onMove) document.removeEventListener('pointermove', onMove);
  window.removeEventListener('themechange', onTheme);
  ro.disconnect();

  geometry.dispose();
  material.dispose();
  nebulaGeo.dispose();
  nebulaMaterial.dispose();
  nebulaTexture.dispose();
  renderer.dispose();
  canvas.remove();

  state = null;
}

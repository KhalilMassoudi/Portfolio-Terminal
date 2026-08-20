/**
 * ROOM — a bare, empty 3D room (floor + two walls + a window of light),
 * rendered with real Three.js geometry and lighting so it reads as an
 * actual designed space — defined edges, real shadows, real depth from
 * perspective — instead of the soft, shapeless gradient blur the CSS
 * wallpapers were criticized for. No furniture, no pointer reactivity:
 * only a very subtle autonomous camera sway keeps it from feeling static.
 */

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function isSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch (_) {
    return false;
  }
}

function notifyFailure() {
  window.dispatchEvent(new CustomEvent('wallpaper:gl-failed'));
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

let state = null;

export async function mount(root) {
  if (!isSupported()) throw new Error('WebGL unsupported');

  const THREE = await import('three');

  const canvas = document.createElement('canvas');
  canvas.className = 'wallpaper__gl';
  root.appendChild(canvas);

  const onContextLost = (e) => {
    e.preventDefault();
    notifyFailure();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  const basePos = new THREE.Vector3(5.5, 1.2, 8);
  const lookTarget = new THREE.Vector3(-1.5, -1, -3);
  camera.position.copy(basePos);
  camera.lookAt(lookTarget);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1c1f27, roughness: 0.9, metalness: 0.05 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x15171d, roughness: 0.65, metalness: 0.1 });

  const ROOM_W = 14;
  const ROOM_D = 14;
  const ROOM_H = 8;

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), wallMat);
  backWall.position.set(0, 0, -ROOM_D / 2);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
  sideWall.position.set(-ROOM_W / 2, 0, 0);
  sideWall.rotation.y = Math.PI / 2;
  sideWall.receiveShadow = true;
  scene.add(sideWall);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), floorMat);
  floor.position.set(0, -ROOM_H / 2, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ambient = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambient);

  // A dim fill light from near the camera so the far corner (wall meeting
  // wall meeting floor) reads as a room, not a void with a glow in it.
  const fill = new THREE.DirectionalLight(0x9fb3c8, 0.9);
  fill.position.set(4, 3, 6);
  scene.add(fill);

  const { r, g, b } = readAccentRGB();
  const accentColor = new THREE.Color(r / 255, g / 255, b / 255);

  // Soft radial-gradient canvas texture — a real light *source* glow,
  // not a flat solid card (which read as a floating sticker, not light).
  const glowSize = 256;
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = glowSize;
  const glowCtx = glowCanvas.getContext('2d');
  const paintGlow = (rgb) => {
    glowCtx.clearRect(0, 0, glowSize, glowSize);
    const grad = glowCtx.createRadialGradient(glowSize / 2, glowSize / 2, 0, glowSize / 2, glowSize / 2, glowSize / 2);
    grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
    grad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
    grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    glowCtx.fillStyle = grad;
    glowCtx.fillRect(0, 0, glowSize, glowSize);
  };
  paintGlow({ r, g, b });
  const glowTexture = new THREE.CanvasTexture(glowCanvas);

  const windowGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 5),
    new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  windowGlow.position.set(-3.5, 1, -ROOM_D / 2 + 0.05);
  scene.add(windowGlow);

  const spot = new THREE.SpotLight(accentColor, 900, 30, Math.PI / 4.5, 0.7, 1.5);
  spot.position.set(-3.5, 1, -ROOM_D / 2 + 0.5);
  spot.target.position.set(-1, -ROOM_H / 2, 1);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.radius = 4;
  scene.add(spot);
  scene.add(spot.target);

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
    paintGlow(rgb);
    glowTexture.needsUpdate = true;
    spot.color.setRGB(rgb.r / 255, rgb.g / 255, rgb.b / 255);
  };
  window.addEventListener('themechange', onTheme);

  const render = () => renderer.render(scene, camera);

  state = {
    root,
    canvas,
    renderer,
    geometries: [backWall.geometry, sideWall.geometry, floor.geometry, windowGlow.geometry],
    materials: [wallMat, floorMat, windowGlow.material],
    textures: [glowTexture],
    ro,
    onTheme,
    onContextLost,
    raf: null,
  };

  if (reduceMotion()) {
    try {
      render();
    } catch (_) {
      notifyFailure();
    }
    return;
  }

  let t = 0;
  const tick = () => {
    t += 0.0016;
    const sway = Math.sin(t) * 0.18;
    const bob = Math.cos(t * 0.7) * 0.06;
    camera.position.set(basePos.x + sway, basePos.y + bob, basePos.z);
    camera.lookAt(lookTarget);
    try {
      render();
    } catch (_) {
      notifyFailure();
      return;
    }
    state.raf = requestAnimationFrame(tick);
  };
  state.raf = requestAnimationFrame(tick);
}

export function unmount() {
  if (!state) return;
  const { canvas, renderer, geometries, materials, textures, ro, onTheme, onContextLost, raf } = state;

  if (raf) cancelAnimationFrame(raf);
  canvas.removeEventListener('webglcontextlost', onContextLost);
  window.removeEventListener('themechange', onTheme);
  ro.disconnect();

  geometries.forEach((geo) => geo.dispose());
  materials.forEach((mat) => mat.dispose());
  textures.forEach((tex) => tex.dispose());
  renderer.dispose();
  canvas.remove();

  state = null;
}

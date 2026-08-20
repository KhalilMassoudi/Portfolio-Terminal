/**
 * ROOM — a furnished corner of a room (couch, coffee table, chair, plant,
 * framed art), lit from a ceiling pendant rather than a wall window, all
 * built from real Three.js geometry + lighting/shadows so it reads as an
 * actual designed space rather than a gradient faking depth. Only a very
 * subtle autonomous camera sway — no pointer reactivity.
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

function shadowed(root) {
  root.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return root;
}

function buildCouch(THREE, accentColor) {
  const group = new THREE.Group();
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0x38332e, roughness: 0.95 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.8 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.05), fabricMat);
  base.position.set(0, 0.25, 0);
  group.add(base);

  const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 0.28), fabricMat);
  back.position.set(0, 0.68, -0.4);
  group.add(back);

  const armGeo = new THREE.BoxGeometry(0.28, 0.62, 1.05);
  const armL = new THREE.Mesh(armGeo, fabricMat);
  armL.position.set(-1.32, 0.32, 0);
  group.add(armL);
  const armR = new THREE.Mesh(armGeo, fabricMat);
  armR.position.set(1.32, 0.32, 0);
  group.add(armR);

  const pillowGeo = new THREE.BoxGeometry(0.48, 0.22, 0.48);
  const pillow1 = new THREE.Mesh(pillowGeo, pillowMat);
  pillow1.position.set(-0.7, 0.62, 0.15);
  pillow1.rotation.y = 0.3;
  group.add(pillow1);
  const pillow2 = new THREE.Mesh(pillowGeo, pillowMat);
  pillow2.position.set(0.6, 0.62, 0.15);
  pillow2.rotation.y = -0.25;
  group.add(pillow2);

  return {
    group: shadowed(group),
    materials: [fabricMat, pillowMat],
    geometries: [base.geometry, back.geometry, armGeo, pillowGeo],
    pillowMat,
  };
}

function buildTable(THREE) {
  const group = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color: 0x2b2018, roughness: 0.35, metalness: 0.1 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.4, metalness: 0.6 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.07, 0.75), topMat);
  top.position.y = 0.42;
  group.add(top);

  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8);
  [
    [-0.55, -0.3],
    [0.55, -0.3],
    [-0.55, 0.3],
    [0.55, 0.3],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, 0.21, z);
    group.add(leg);
  });

  return { group: shadowed(group), materials: [topMat, legMat], geometries: [top.geometry, legGeo] };
}

function buildChair(THREE) {
  const group = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 0.85 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.4, metalness: 0.6 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), seatMat);
  seat.position.y = 0.45;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.08), seatMat);
  back.position.set(0, 0.72, -0.235);
  group.add(back);

  const legGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.45, 8);
  [
    [-0.22, -0.22],
    [0.22, -0.22],
    [-0.22, 0.22],
    [0.22, 0.22],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, 0.225, z);
    group.add(leg);
  });

  return { group: shadowed(group), materials: [seatMat, legMat], geometries: [seat.geometry, back.geometry, legGeo] };
}

function buildPlant(THREE) {
  const group = new THREE.Group();
  const potMat = new THREE.MeshStandardMaterial({ color: 0x4a2f22, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f5233, roughness: 0.8 });

  const potGeo = new THREE.CylinderGeometry(0.26, 0.19, 0.42, 12);
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.21;
  group.add(pot);

  const foliageGeo = new THREE.IcosahedronGeometry(0.3, 0);
  [
    [0, 0.75, 0, 1],
    [0.18, 0.6, 0.1, 0.85],
    [-0.15, 0.62, -0.12, 0.9],
    [0.05, 0.5, 0.2, 0.8],
    [-0.1, 0.48, -0.18, 0.75],
  ].forEach(([x, y, z, s]) => {
    const leaf = new THREE.Mesh(foliageGeo, leafMat);
    leaf.position.set(x, y, z);
    leaf.scale.setScalar(s);
    group.add(leaf);
  });

  return { group: shadowed(group), materials: [potMat, leafMat], geometries: [potGeo, foliageGeo] };
}

function buildFrame(THREE, rgb) {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x171512, roughness: 0.5, metalness: 0.3 });
  const border = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.06), frameMat);
  group.add(border);

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const paint = (c) => {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, `rgb(${c.r}, ${c.g}, ${c.b})`);
    grad.addColorStop(1, '#14120f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  };
  paint(rgb);
  const texture = new THREE.CanvasTexture(canvas);
  const artMat = new THREE.MeshBasicMaterial({ map: texture });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.12), artMat);
  art.position.z = 0.035;
  group.add(art);

  return {
    group: shadowed(group),
    materials: [frameMat, artMat],
    geometries: [border.geometry, art.geometry],
    texture,
    repaint: () => {
      paint(readAccentRGB());
      texture.needsUpdate = true;
    },
  };
}

function buildPendant(THREE, accentColor) {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.35, metalness: 0.7 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: accentColor });

  const rodGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.6, 8);
  const rod = new THREE.Mesh(rodGeo, metalMat);
  rod.position.y = 0.8;
  group.add(rod);

  const shadeGeo = new THREE.CylinderGeometry(0.32, 0.5, 0.36, 20, 1, true);
  shadeGeo.scale(1, -1, 1);
  const shade = new THREE.Mesh(shadeGeo, metalMat);
  shade.position.y = -0.02;
  group.add(shade);

  const bulbGeo = new THREE.CircleGeometry(0.4, 20);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.rotation.x = Math.PI / 2;
  bulb.position.y = -0.19;
  group.add(bulb);

  return { group, materials: [metalMat, bulbMat], geometries: [rodGeo, shadeGeo, bulbGeo], bulbMat };
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
  const basePos = new THREE.Vector3(6, 2.1, 9);
  const lookTarget = new THREE.Vector3(-0.5, -0.6, -4.2);
  camera.position.copy(basePos);
  camera.lookAt(lookTarget);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1c1f27, roughness: 0.9, metalness: 0.05 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x18130f, roughness: 0.5, metalness: 0.1 });

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

  const ambient = new THREE.AmbientLight(0xffffff, 1.1);
  scene.add(ambient);

  const fill = new THREE.DirectionalLight(0x9fb3c8, 0.6);
  fill.position.set(4, 3, 6);
  scene.add(fill);

  const { r, g, b } = readAccentRGB();
  const accentColor = new THREE.Color(r / 255, g / 255, b / 255);

  const disposables = { geometries: [backWall.geometry, sideWall.geometry, floor.geometry], materials: [wallMat, floorMat], textures: [] };
  const add = (built, groupPos, groupRotY = 0) => {
    built.group.position.set(...groupPos);
    if (groupRotY) built.group.rotation.y = groupRotY;
    scene.add(built.group);
    disposables.geometries.push(...built.geometries);
    disposables.materials.push(...built.materials);
    if (built.texture) disposables.textures.push(built.texture);
    return built;
  };

  const FLOOR_Y = -ROOM_H / 2;
  const couch = add(buildCouch(THREE, accentColor), [-1, FLOOR_Y, -6], 0);
  add(buildTable(THREE), [-0.8, FLOOR_Y, -3.9], 0);
  add(buildChair(THREE), [2.1, FLOOR_Y, -3.2], -Math.PI / 5);
  add(buildPlant(THREE), [-5.6, FLOOR_Y, -5.7], 0);
  const frame = add(buildFrame(THREE, { r, g, b }), [2.3, 0.6, -ROOM_D / 2 + 0.05], 0);
  const pendant = add(buildPendant(THREE, accentColor), [-1, ROOM_H / 2 - 0.4, -4.5], 0);

  const spot = new THREE.SpotLight(accentColor, 950, 16, Math.PI / 3.4, 0.6, 1.4);
  spot.position.set(-1, ROOM_H / 2 - 0.6, -4.5);
  spot.target.position.set(-1, FLOOR_Y, -4.8);
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
    const c = new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    spot.color.copy(c);
    couch.pillowMat.color.copy(c);
    pendant.bulbMat.color.copy(c);
    frame.repaint();
  };
  window.addEventListener('themechange', onTheme);

  const render = () => renderer.render(scene, camera);

  state = {
    root,
    canvas,
    renderer,
    geometries: disposables.geometries,
    materials: disposables.materials,
    textures: disposables.textures,
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

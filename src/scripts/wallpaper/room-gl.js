/**
 * ROOM — a furnished corner of a room (couch, coffee table, chair, plant,
 * framed landscape art, a console table holding a framed BJJ belt, a window looking out onto a night sky), lit from
 * a ceiling pendant, all built from real Three.js geometry +
 * lighting/shadows so it reads as an actual designed space rather than a
 * gradient faking depth. The camera stays anchored but pans to "look
 * around" toward the cursor, plus a small idle sway when it's still.
 */

import { avatar as avatarConfig, bjj } from '../../data/content.js';
import { buildAvatar } from './avatar.js';
import { createNavGrid } from './nav-grid.js';

// Clicks on any of these belong to the UI, not the room floor.
const UI_SELECTOR = '.window, .topbar, .dock, .icon-tile, a, button, input, textarea, select, label';

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
  const border = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.5, 0.06), frameMat);
  group.add(border);

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  // A small abstract sunset-over-hills painting — a callback to the site's
  // own hills wallpaper, re-themed live, instead of a flat two-tone card.
  const paint = (c) => {
    ctx.clearRect(0, 0, size, size);
    const sky = ctx.createLinearGradient(0, 0, 0, size);
    sky.addColorStop(0, `rgb(${c.r}, ${c.g}, ${c.b})`);
    sky.addColorStop(0.55, `rgb(${Math.round(c.r * 0.32)}, ${Math.round(c.g * 0.28)}, ${Math.round(c.b * 0.38)})`);
    sky.addColorStop(1, '#0c0b09');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, size, size);

    const glow = ctx.createRadialGradient(size * 0.5, size * 0.4, 0, size * 0.5, size * 0.4, size * 0.3);
    glow.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.85)`);
    glow.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#100e0b';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.76);
    ctx.quadraticCurveTo(size * 0.25, size * 0.6, size * 0.5, size * 0.72);
    ctx.quadraticCurveTo(size * 0.75, size * 0.82, size, size * 0.68);
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#040302';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.89);
    ctx.quadraticCurveTo(size * 0.3, size * 0.79, size * 0.6, size * 0.87);
    ctx.quadraticCurveTo(size * 0.8, size * 0.93, size, size * 0.85);
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();
  };
  paint(rgb);
  const texture = new THREE.CanvasTexture(canvas);
  const artMat = new THREE.MeshBasicMaterial({ map: texture });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.3), artMat);
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

function buildWindow(THREE) {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.6, metalness: 0.2 });

  const W = 2.2;
  const H = 2.8;
  const border = new THREE.Mesh(new THREE.BoxGeometry(W + 0.16, H + 0.16, 0.08), frameMat);
  group.add(border);

  // The border above is a solid slab, not a hollow frame — glass/mullions
  // must sit clearly in front of its face (z > 0.04) or it occludes them.
  const vMullionGeo = new THREE.BoxGeometry(0.06, H, 0.06);
  const vMullion = new THREE.Mesh(vMullionGeo, frameMat);
  vMullion.position.z = 0.075;
  group.add(vMullion);

  const hMullionGeo = new THREE.BoxGeometry(W, 0.06, 0.06);
  const hMullion = new THREE.Mesh(hMullionGeo, frameMat);
  hMullion.position.z = 0.075;
  group.add(hMullion);

  // A dark night sky, not daylight — the room itself is dark/moody, so a
  // bright window read as wrong (it's dark outside too). Soft moon + stars.
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, size);
  sky.addColorStop(0, '#0a0e1a');
  sky.addColorStop(0.6, '#131b2e');
  sky.addColorStop(1, '#1c2436');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, size);

  const moonGlow = ctx.createRadialGradient(size * 0.7, size * 0.28, 0, size * 0.7, size * 0.28, size * 0.22);
  moonGlow.addColorStop(0, 'rgba(222, 227, 240, 0.45)');
  moonGlow.addColorStop(1, 'rgba(222, 227, 240, 0)');
  ctx.fillStyle = moonGlow;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#e7eaf2';
  ctx.beginPath();
  ctx.arc(size * 0.7, size * 0.28, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size * 0.65;
    const rDot = Math.random() * 1.1 + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, rDot, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  const glassMat = new THREE.MeshBasicMaterial({ map: texture });
  const glassGeo = new THREE.PlaneGeometry(W, H);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.z = 0.05;
  group.add(glass);

  return {
    group: shadowed(group),
    materials: [frameMat, glassMat],
    geometries: [border.geometry, vMullionGeo, hMullionGeo, glassGeo],
    texture,
  };
}

function buildConsole(THREE) {
  const group = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color: 0x2b2018, roughness: 0.35, metalness: 0.1 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.4, metalness: 0.6 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.55), topMat);
  top.position.y = 0.85;
  group.add(top);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.46), topMat);
  shelf.position.y = 0.22;
  group.add(shelf);

  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8);
  [
    [-1.18, -0.22],
    [1.18, -0.22],
    [-1.18, 0.22],
    [1.18, 0.22],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, 0.425, z);
    group.add(leg);
  });

  return {
    group: shadowed(group),
    materials: [topMat, legMat],
    geometries: [top.geometry, shelf.geometry, legGeo],
  };
}

const BELT_COLORS = {
  white: { belt: '#f4f2ec', shade: '#d9d5cb', bar: '#141414' },
  blue: { belt: '#2457b8', shade: '#173c85', bar: '#141414' },
  purple: { belt: '#6b3fa0', shade: '#4b2a73', bar: '#141414' },
  brown: { belt: '#6b4428', shade: '#4a2e1a', bar: '#141414' },
  black: { belt: '#1b1b1d', shade: '#0e0e10', bar: '#c4232b' },
};

// The framed belt: drawn on a canvas (belt with knot + hanging tails, rank
// bar, caption), unlit and un-tonemapped so it reads crisp in the dark room.
function paintBelt(ctx, W, H, { belt, label }) {
  const c = BELT_COLORS[belt] || BELT_COLORS.white;
  const sans = "'Inter', system-ui, sans-serif";

  const bg = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.65);
  bg.addColorStop(0, '#262830');
  bg.addColorStop(1, '#111216');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // A strip of belt fabric along the local x axis: shaded, with stitch rows.
  const strip = (len, thick, { bar = null } = {}) => {
    const g = ctx.createLinearGradient(0, -thick / 2, 0, thick / 2);
    g.addColorStop(0, c.belt);
    g.addColorStop(1, c.shade);
    ctx.fillStyle = g;
    ctx.fillRect(0, -thick / 2, len, thick);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.13)';
    ctx.lineWidth = 2;
    for (let k = 1; k < 7; k++) {
      const y = -thick / 2 + (thick * k) / 7;
      ctx.beginPath();
      ctx.moveTo(4, y);
      ctx.lineTo(len - 4, y);
      ctx.stroke();
    }
    if (bar) {
      ctx.fillStyle = c.bar;
      ctx.fillRect(bar[0], -thick / 2, bar[1], thick);
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -thick / 2, len, thick);
  };

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  const beltY = H * 0.33;
  const thick = 76;
  ctx.save();
  ctx.translate(90, beltY);
  strip(W - 180, thick);
  ctx.restore();

  // Tails hanging from the knot, the right one carrying the rank bar.
  const tail = (angle, len, bar) => {
    ctx.save();
    ctx.translate(W / 2, beltY + 10);
    ctx.rotate(angle);
    strip(len, thick, { bar });
    ctx.restore();
  };
  tail(Math.PI * 0.64, 190);
  tail(Math.PI * 0.36, 205, [115, 60]);

  // Knot
  const kw = 120;
  const kh = 96;
  const kg = ctx.createLinearGradient(0, beltY - kh / 2, 0, beltY + kh / 2);
  kg.addColorStop(0, c.belt);
  kg.addColorStop(1, c.shade);
  ctx.fillStyle = kg;
  ctx.beginPath();
  ctx.roundRect(W / 2 - kw / 2, beltY - kh / 2, kw, kh, 14);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(W / 2 - kw / 2, beltY - kh / 2, kw, kh, 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 - kw / 2 + 10, beltY + kh / 2 - 10);
  ctx.lineTo(W / 2 + kw / 2 - 10, beltY - kh / 2 + 10);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `700 34px ${sans}`;
  ctx.letterSpacing = '8px';
  ctx.fillText(`${belt.toUpperCase()} BELT`, W / 2, H * 0.74);
  ctx.letterSpacing = '2px';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 84px ${sans}`;
  ctx.fillText(label.toUpperCase(), W / 2, H * 0.9);
  ctx.letterSpacing = '0px';
}

function buildBeltFrame(THREE, bjj) {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f0e0d, roughness: 0.45, metalness: 0.35 });

  const FW = 1.8;
  const FH = 1.18;
  const border = new THREE.Mesh(new THREE.BoxGeometry(FW, FH, 0.07), frameMat);
  border.position.y = FH / 2;
  group.add(border);

  const W = 1024;
  const H = 640;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const repaint = () => {
    paintBelt(ctx, W, H, bjj);
    texture.needsUpdate = true;
  };
  repaint();
  // The caption uses Inter — repaint once the webfont is actually ready.
  document.fonts?.ready.then(repaint);

  const artMat = new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(FW - 0.14, (FW - 0.14) * (H / W)), artMat);
  // The border is a solid slab (front face at z 0.035): keep the art clearly
  // in front of it, or the two z-fight and the frame bleeds through.
  art.position.set(0, FH / 2, 0.05);
  group.add(art);

  // Easel strut behind, so it visibly stands rather than floats.
  // Its top meets the frame's back and its foot kicks out behind, never
  // poking through the picture.
  const STRUT_L = 0.85;
  const STRUT_TILT = 0.3;
  const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, STRUT_L, 0.03), frameMat);
  strut.position.set(0, (STRUT_L / 2) * Math.cos(STRUT_TILT), -0.05 - (STRUT_L / 2) * Math.sin(STRUT_TILT));
  strut.rotation.x = STRUT_TILT;
  group.add(strut);

  group.rotation.order = 'YXZ'; // lean in the frame's own space after it's turned
  group.rotation.x = -0.1; // leaning back slightly
  shadowed(group);
  art.receiveShadow = false;

  return {
    group,
    materials: [frameMat, artMat],
    geometries: [border.geometry, art.geometry, strut.geometry],
    texture,
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

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

  // Faint cool moonlight near the window — subtle, since it's dark outside.
  const moonlight = new THREE.PointLight(0x9fb0d0, 2.5, 10, 2);
  moonlight.position.set(-ROOM_W / 2 + 2, 0.6, 2.2);
  scene.add(moonlight);

  const { r, g, b } = readAccentRGB();
  const accentColor = new THREE.Color(r / 255, g / 255, b / 255);

  const disposables = { geometries: [backWall.geometry, sideWall.geometry, floor.geometry], materials: [wallMat, floorMat], textures: [] };
  const props = [];
  const add = (built, groupPos, groupRotY = 0) => {
    props.push(built.group);
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
  add(buildConsole(THREE), [2.6, FLOOR_Y, -ROOM_D / 2 + 0.27], 0);
  add(buildBeltFrame(THREE, bjj), [2.6, FLOOR_Y + 0.88, -ROOM_D / 2 + 0.34], 0.2);
  const frame = add(buildFrame(THREE, { r, g, b }), [2.3, 0.6, -ROOM_D / 2 + 0.05], 0);
  const pendant = add(buildPendant(THREE, accentColor), [-1, ROOM_H / 2 - 0.4, -4.5], 0);
  add(buildWindow(THREE), [-ROOM_W / 2 + 0.07, 0.5, -2], Math.PI / 2);

  // Furniture footprints on the floor (x/z), matching the placements above,
  // so the avatar paths around them.
  const nav = createNavGrid({
    bounds: { minX: -ROOM_W / 2 + 0.3, maxX: ROOM_W / 2 - 0.3, minZ: -ROOM_D / 2 + 0.3, maxZ: ROOM_D / 2 - 0.3 },
    radius: 0.22,
    obstacles: [
      { type: 'rect', minX: -2.46, maxX: 0.46, minZ: -6.54, maxZ: -5.475 }, // couch
      { type: 'rect', minX: -1.45, maxX: -0.15, minZ: -4.275, maxZ: -3.525 }, // coffee table
      { type: 'circle', x: 2.1, z: -3.2, r: 0.4 }, // chair
      { type: 'circle', x: -5.6, z: -5.7, r: 0.28 }, // plant
      { type: 'rect', minX: 1.35, maxX: 3.85, minZ: -7, maxZ: -6.2 }, // console + belt frame
    ],
  });

  const me = buildAvatar(THREE, avatarConfig, accentColor);
  me.group.position.y = FLOOR_Y;
  me.teleport(3.2, -1.6);
  scene.add(me.group);
  const yawToCamera = () => {
    const { x, z } = me.position();
    return Math.atan2(camera.position.x - x, camera.position.z - z);
  };
  me.face(yawToCamera(), { instant: true });

  // Ring that pops where you clicked.
  const markerGeo = new THREE.RingGeometry(0.16, 0.22, 32);
  markerGeo.rotateX(-Math.PI / 2);
  const markerMat = new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0, depthWrite: false });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.y = FLOOR_Y + 0.01;
  scene.add(marker);
  disposables.geometries.push(markerGeo);
  disposables.materials.push(markerMat);
  const MARKER_LIFE = 0.7;
  let markerAge = MARKER_LIFE;

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
    me.setAccent(c);
    markerMat.color.copy(c);
  };
  window.addEventListener('themechange', onTheme);

  const render = () => renderer.render(scene, camera);
  const animated = !reduceMotion();

  // Click the floor → walk there (around furniture); click the avatar → wave.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const onClick = (e) => {
    if (e.button !== 0 || !e.target.closest?.('#desktop') || e.target.closest(UI_SELECTOR)) return;
    const rect = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);

    if (raycaster.intersectObject(me.group, true).length) {
      if (animated) me.wave(yawToCamera());
      return;
    }
    const hit = raycaster.intersectObjects([floor, backWall, sideWall, ...props], true)[0];
    if (!hit) return;
    const { x, z } = me.position();
    const path = nav.findPath(x, z, hit.point.x, hit.point.z);
    if (!path.length) return;

    const [gx, gz] = path[path.length - 1];
    if (!animated) {
      me.teleport(gx, gz);
      try {
        render();
      } catch (_) {
        notifyFailure();
      }
      return;
    }
    marker.position.x = gx;
    marker.position.z = gz;
    markerAge = 0;
    me.walk(path);
  };
  document.addEventListener('click', onClick);

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
    onClick,
    me,
    onMove: null,
    raf: null,
  };

  if (!animated) {
    try {
      render();
    } catch (_) {
      notifyFailure();
    }
    return;
  }

  // "Look around" the room with the cursor — camera position stays anchored
  // (only a small idle sway), but where it's *looking* pans toward the
  // pointer, so you can see toward the window/plant side or the frame side.
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;

  if (!matchMedia('(pointer: coarse)').matches) {
    const onMove = (e) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    document.addEventListener('pointermove', onMove);
    state.onMove = onMove;
  }

  let t = 0;
  const clock = new THREE.Clock();
  const tick = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    t += 0.0016;
    me.update(dt);
    if (markerAge < MARKER_LIFE) {
      markerAge += dt;
      const k = Math.min(1, markerAge / MARKER_LIFE);
      marker.scale.setScalar(0.6 + k * 0.9);
      markerMat.opacity = 1 - k;
    }
    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;

    const idleSway = Math.sin(t) * 0.15;
    const idleBob = Math.cos(t * 0.7) * 0.05;
    camera.position.set(basePos.x + idleSway, basePos.y + idleBob, basePos.z);
    camera.lookAt(lookTarget.x + curX * 2.4, lookTarget.y + curY * 1.2, lookTarget.z);

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
  const { canvas, renderer, geometries, materials, textures, ro, onTheme, onContextLost, onClick, me, onMove, raf } = state;

  if (raf) cancelAnimationFrame(raf);
  canvas.removeEventListener('webglcontextlost', onContextLost);
  window.removeEventListener('themechange', onTheme);
  if (onMove) document.removeEventListener('pointermove', onMove);
  document.removeEventListener('click', onClick);
  ro.disconnect();

  me.dispose();
  geometries.forEach((geo) => geo.dispose());
  materials.forEach((mat) => mat.dispose());
  textures.forEach((tex) => tex.dispose());
  renderer.dispose();
  canvas.remove();

  state = null;
}

/**
 * AVATAR — a little chibi "me" built from Three.js primitives, living in
 * the Room wallpaper. room-gl.js hands it a path to walk (from nav-grid.js)
 * when the floor is clicked, and asks it to wave when it's clicked itself.
 * Its look (colors, beard, mustache, glasses) comes from `avatar` in
 * data/content.js.
 *
 * Local axes: feet at y = 0, facing +z. `root.rotation.y` is its heading.
 */

const HEAD_R = 0.22;
const HEAD_Y = 0.94;
const WALK_SPEED = 1.5; // world units per second
const WAVE_DUR = 1.6;
const EYE_SCALE_Y = 1.3;
const ARM_REST = 0.12; // outward splay of the arms when idle

function shortestAngle(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function buildAvatar(THREE, config, accentColor) {
  const geometries = [];
  const materials = [];
  const geo = (g) => (geometries.push(g), g);
  const mat = (opts) => {
    const m = new THREE.MeshStandardMaterial(opts);
    materials.push(m);
    return m;
  };

  const shirtIsAccent = config.shirt === 'accent';
  const skinMat = mat({ color: config.skin, roughness: 0.7 });
  const hairMat = mat({ color: config.hair, roughness: 0.9, side: THREE.DoubleSide });
  const shirtMat = mat({ color: shirtIsAccent ? accentColor : config.shirt, roughness: 0.85 });
  const pantsMat = mat({ color: config.pants, roughness: 0.9 });
  const shoeMat = mat({ color: config.shoes, roughness: 0.6 });
  const featureMat = mat({ color: 0x1a1412, roughness: 0.3 });
  const mouthMat = mat({ color: 0xa8524a, roughness: 0.5 });
  const blushMat = mat({ color: 0xe88a8a, roughness: 0.9, transparent: true, opacity: 0.4 });

  const root = new THREE.Group(); // sits on the floor; rotation.y = heading
  const body = new THREE.Group(); // bobs while walking
  root.add(body);

  // ---- Legs (pivot at the hip) ----
  const legGeo = geo(new THREE.CapsuleGeometry(0.06, 0.16, 4, 10));
  const shoeGeo = geo(new THREE.BoxGeometry(0.11, 0.07, 0.18));
  const makeLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(0.08 * side, 0.32, 0);
    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.position.y = -0.14;
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, -0.285, 0.03);
    hip.add(leg, shoe);
    body.add(hip);
    return hip;
  };
  const legL = makeLeg(1);
  const legR = makeLeg(-1);

  // ---- Hips + torso ----
  const unitSphere = geo(new THREE.SphereGeometry(1, 16, 12));
  const pelvis = new THREE.Mesh(unitSphere, pantsMat);
  pelvis.scale.set(0.17, 0.1, 0.12);
  pelvis.position.y = 0.34;
  body.add(pelvis);

  const torso = new THREE.Mesh(geo(new THREE.CapsuleGeometry(0.15, 0.16, 4, 14)), shirtMat);
  torso.position.y = 0.52;
  torso.scale.z = 0.78;
  body.add(torso);

  const neck = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.055, 0.06, 0.08, 10)), skinMat);
  neck.position.y = 0.76;
  body.add(neck);

  // ---- Arms (pivot at the shoulder) ----
  const armGeo = geo(new THREE.CapsuleGeometry(0.048, 0.17, 4, 10));
  const handGeo = geo(new THREE.SphereGeometry(0.055, 12, 10));
  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.2 * side, 0.68, 0);
    shoulder.rotation.z = ARM_REST * side;
    const arm = new THREE.Mesh(armGeo, shirtMat);
    arm.position.y = -0.12;
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.y = -0.27;
    shoulder.add(arm, hand);
    body.add(shoulder);
    return shoulder;
  };
  const armL = makeArm(1);
  const armR = makeArm(-1); // facing +z, the avatar's right hand is on -x

  // ---- Head ----
  const head = new THREE.Group();
  head.position.y = HEAD_Y;
  body.add(head);
  head.add(new THREE.Mesh(geo(new THREE.SphereGeometry(HEAD_R, 28, 20)), skinMat));

  const earGeo = geo(new THREE.SphereGeometry(0.05, 10, 8));
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.position.set(HEAD_R * side, -0.01, 0);
    ear.scale.set(0.5, 1, 0.8);
    head.add(ear);
  });

  // Hair: short and close-cropped — a snug cap tilted back to show the
  // forehead, plus a back piece down to the nape.
  const cap = new THREE.Mesh(
    geo(new THREE.SphereGeometry(HEAD_R * 1.045, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.4)),
    hairMat
  );
  cap.rotation.x = -0.2;
  head.add(cap);
  head.add(
    new THREE.Mesh(
      geo(
        new THREE.SphereGeometry(
          HEAD_R * 1.04,
          24,
          12,
          Math.PI * 1.5 - Math.PI * 0.55,
          Math.PI * 1.1,
          Math.PI * 0.3,
          Math.PI * 0.35
        )
      ),
      hairMat
    )
  );

  // Drawn face — features are stuck onto the head sphere at (yaw, pitch).
  const face = new THREE.Group();
  head.add(face);
  const stick = (mesh, yaw, pitch, lift = 0, parent = face) => {
    const r = HEAD_R + lift;
    const p = new THREE.Vector3(
      r * Math.cos(pitch) * Math.sin(yaw),
      r * Math.sin(pitch),
      r * Math.cos(pitch) * Math.cos(yaw)
    );
    mesh.position.copy(p);
    mesh.lookAt(p.multiplyScalar(2)); // local +z points out of the head
    parent.add(mesh);
    return mesh;
  };

  const eyeGeo = geo(new THREE.SphereGeometry(0.03, 12, 10));
  const eyes = [-1, 1].map((side) => {
    const eye = stick(new THREE.Mesh(eyeGeo, featureMat), 0.36 * side, 0, -0.006);
    eye.scale.set(1, EYE_SCALE_Y, 0.5);
    return eye;
  });
  const browGeo = geo(new THREE.BoxGeometry(0.075, 0.02, 0.02));
  // Thick and nearly level, inner ends a touch higher — inward-sloping brows read as angry.
  [-1, 1].forEach((side) =>
    stick(new THREE.Mesh(browGeo, hairMat), 0.36 * side, 0.26, 0.004).rotateZ(-0.08 * side)
  );
  const nose = stick(
    new THREE.Mesh(geo(new THREE.SphereGeometry(0.03, 10, 8)), skinMat),
    0,
    -0.12,
    0.006
  );
  nose.scale.set(1.15, 0.9, 1);

  const smileGeo = geo(new THREE.TorusGeometry(0.048, 0.012, 6, 14, Math.PI));
  smileGeo.rotateZ(Math.PI); // upper half-torus is a frown; flip it into a smile
  stick(new THREE.Mesh(smileGeo, mouthMat), 0, -0.34, config.beard ? 0.014 : 0.002);

  if (config.mustache) {
    // Upper half-torus droops at the ends, like a real mustache.
    const mustache = stick(
      new THREE.Mesh(geo(new THREE.TorusGeometry(0.05, 0.014, 6, 14, Math.PI)), hairMat),
      0,
      -0.22,
      config.beard ? 0.012 : 0.004
    );
    mustache.scale.set(1, 0.55, 0.6);
  }

  const blushGeo = geo(new THREE.CircleGeometry(0.035, 14));
  const blush = config.beard
    ? []
    : [-1, 1].map((side) => stick(new THREE.Mesh(blushGeo, blushMat), 0.62 * side, -0.18, 0.003));

  if (config.beard) {
    // Short full beard: along the jaw from ear to ear (as sideburns), then
    // around the chin. Kept close to the skin so it reads as trimmed.
    face.add(
      new THREE.Mesh(
        geo(
          new THREE.SphereGeometry(
            HEAD_R * 1.025,
            28,
            12,
            -Math.PI * 0.08,
            Math.PI * 1.16,
            Math.PI * 0.6,
            Math.PI * 0.32
          )
        ),
        hairMat
      )
    );
    [-1, 1].forEach((side) => {
      const burn = stick(
        new THREE.Mesh(geo(new THREE.BoxGeometry(0.04, 0.1, 0.02)), hairMat),
        1.42 * side,
        -0.05,
        0.002
      );
      burn.scale.z = 0.6;
    });
  }

  if (config.glasses) {
    const rimGeo = geo(new THREE.TorusGeometry(0.05, 0.007, 6, 20));
    [-1, 1].forEach((side) => stick(new THREE.Mesh(rimGeo, featureMat), 0.36 * side, 0, 0.02));
    stick(
      new THREE.Mesh(geo(new THREE.BoxGeometry(0.06, 0.008, 0.008)), featureMat),
      0,
      0.01,
      0.022
    );
  }

  root.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  blush.forEach((m) => (m.castShadow = false));

  // ---- Animation state ----
  let path = [];
  let heading = 0;
  let targetHeading = 0;
  let walkBlend = 0;
  let phase = 0;
  let time = 0;
  let nextBlink = 2 + Math.random() * 3;
  let blinkT = -1;
  let waveT = -1;

  function update(dt) {
    time += dt;

    if (path.length) {
      const [tx, tz] = path[0];
      const dx = tx - root.position.x;
      const dz = tz - root.position.z;
      const dist = Math.hypot(dx, dz);
      const step = WALK_SPEED * dt;
      if (dist <= step) {
        root.position.x = tx;
        root.position.z = tz;
        path.shift();
      } else {
        root.position.x += (dx / dist) * step;
        root.position.z += (dz / dist) * step;
        targetHeading = Math.atan2(dx, dz);
      }
    }

    heading += shortestAngle(heading, targetHeading) * Math.min(1, dt * 10);
    root.rotation.y = heading;

    walkBlend += ((path.length ? 1 : 0) - walkBlend) * Math.min(1, dt * 8);
    phase += dt * 10 * walkBlend;
    const swing = Math.sin(phase) * 0.65 * walkBlend;
    legL.rotation.x = swing;
    legR.rotation.x = -swing;
    armL.rotation.x = -swing * 0.8;
    armR.rotation.x = swing * 0.8;
    body.position.y = Math.abs(Math.sin(phase)) * 0.035 * walkBlend;

    const idle = 1 - walkBlend;
    torso.scale.y = 1 + Math.sin(time * 2.2) * 0.012 * idle;
    head.rotation.z = Math.sin(time * 0.9) * 0.04 * idle;

    if (waveT >= 0) {
      waveT += dt;
      const up = Math.max(0, Math.min(1, waveT / 0.25, (WAVE_DUR - waveT) / 0.25));
      armR.rotation.z = -ARM_REST + (-2.4 + Math.sin(waveT * 14) * 0.3) * up;
      if (waveT >= WAVE_DUR) {
        waveT = -1;
        armR.rotation.z = -ARM_REST;
      }
    }

    nextBlink -= dt;
    if (nextBlink <= 0) {
      blinkT = 0;
      nextBlink = 2.5 + Math.random() * 3.5;
    }
    if (blinkT >= 0) {
      blinkT += dt;
      const open = blinkT < 0.07 ? 1 - blinkT / 0.07 : Math.min(1, (blinkT - 0.07) / 0.07);
      eyes.forEach((e) => (e.scale.y = EYE_SCALE_Y * Math.max(0.1, open)));
      if (blinkT >= 0.14) blinkT = -1;
    }
  }

  return {
    group: root,
    update,
    position: () => ({ x: root.position.x, z: root.position.z }),
    walk(points) {
      path = points.slice();
    },
    /** Jump straight to a spot (used when motion is reduced and nothing animates). */
    teleport(x, z) {
      path = [];
      root.position.x = x;
      root.position.z = z;
    },
    face(yaw, { instant = false } = {}) {
      targetHeading = yaw;
      if (instant) heading = root.rotation.y = yaw;
    },
    wave(yaw) {
      path = [];
      if (yaw !== undefined) targetHeading = yaw;
      waveT = 0;
    },
    setAccent(color) {
      if (shirtIsAccent) shirtMat.color.copy(color);
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

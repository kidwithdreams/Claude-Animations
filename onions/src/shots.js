// "Why Onions Make You Cry" — the edit.
import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite, sparks, rippleOverlay } from './props.js';
import { materials } from './materials.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { onion, onionHalf, onionMaterials, chefKnife, knifeHand, kitchen, kitchenSky, darkSky, softPoints, gasPlume, cellField, bigCell, bigEye, nerveNet, brain, tearGland, droplets, fridgeInside, shadow, contactShadow } from './kitchen.js';
import { rng } from './textures.js';

export const DURATION = 32.0;

// [start, text, end?]
export const CAPTIONS = [
  [0.24, 'THIS IS YOU'], [1.20, "AND YOU'RE MAKING"], [2.16, 'A MISTAKE', 3.0],
  [3.28, 'EVERY TIME'], [3.84, 'YOUR KNIFE'], [4.32, 'SLICES AN ONION'], [5.44, 'IT RIPS OPEN'], [6.32, 'THOUSANDS'], [6.88, 'OF TINY CELLS', 8.0],
  [8.32, 'AND INSIDE THEM'], [9.36, "THERE'S A"], [9.76, 'CHEMICAL WEAPON', 10.95],
  [11.20, 'ENZYMES'], [11.76, 'MIX WITH'], [12.16, 'SULFUR COMPOUNDS'], [13.12, 'AND TURN INTO'], [13.68, 'A VOLATILE GAS', 14.95],
  [15.20, 'AND IT FLOATS'], [16.00, 'STRAIGHT UP'], [16.56, 'TO YOUR FACE', 17.45],
  [17.60, 'WHEN IT HITS'], [18.16, 'YOUR EYES'], [18.80, 'THE GAS'], [19.36, 'IRRITATES'], [19.92, 'YOUR NERVES', 20.62],
  [20.72, 'YOUR BRAIN THINKS'], [21.44, "YOU'RE UNDER"], [21.92, 'ATTACK'], [22.32, 'AND TRIGGERS AN'], [22.96, 'EMERGENCY'], [23.60, 'FLUSH', 24.2],
  [24.88, 'TO AVOID THIS'], [25.92, 'CHILL'], [26.24, 'THE ONION'], [26.88, 'AND USE A'], [27.28, 'SHARP KNIFE', 28.05],
  [28.24, 'COLD SLOWS'], [29.04, 'THE REACTION'], [29.76, 'AND A SHARP'], [30.40, 'BLADE'], [30.72, 'CRUSHES'], [31.12, 'FEWER CELLS'],
];
// no dips to black: the short ends on a hard cut
export const FADES = [];

const M = materials();
M.cloth.color.set(0x2f6aa6);       // the cook's blue t-shirt
M.clothGrey.color.set(0x34363a);

const COUNTER = 0.9, WALLZ = -0.55;
const BOARD = V(0, COUNTER + 0.024, WALLZ + 0.85);
function kitchenStage(makeStage, opts = {}) {
  const scene = makeStage({ shadowSize: 1.2, sunDir: [-2.5, 6, 3.5], sun: 2.1, ...opts });
  kitchenSky(scene);
  const k = kitchen({ counterY: COUNTER, wallZ: WALLZ }); scene.add(k);
  const fill = new THREE.PointLight(0xffe2c0, 1.2, 4); fill.position.set(0.8, 1.6, 1.0); scene.add(fill);
  return { scene, k };
}
function cook(scene) {
  const h = makeHuman('plain');
  h.root.position.set(0.02, 0, BOARD.z + 0.62); h.root.rotation.y = Math.PI;
  scene.add(h.root);
  return h;
}
const KR = (new URLSearchParams(location.search).get('kr') || '1.57,0,0').split(',').map(Number);
const warmOnion = () => onionMaterials().skin.color.setRGB(1, 1, 1);
const LEAN = { spine: [0.18, 0, 0], chest: [0.12, 0, 0], neck: [0.25, 0, 0], head: [0.18, 0, 0],
  lSh: [0.05, 0, 0.16], lEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07] };
// fist-held knife (attached to the right wrist), blade pointing down/forward
function knifeInFist(h) {
  const k = chefKnife();
  const holder = new THREE.Group(); h.j.rWr.add(holder);
  holder.position.set(0, -0.075, 0.0);
  k.position.set(0.068, -0.034, 0); holder.add(k);
  return { k, holder };
}

// ============ S1 0.00–1.20  "This is you" — the cook, knife raised over the onion ============
function s1({ makeStage }) {
  const { scene } = kitchenStage(makeStage, { shadowSize: 1.6 });
  const on = onion(); on.position.copy(BOARD); scene.add(on);
  const h = cook(scene);
  const { k, holder } = knifeInFist(h);
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      warmOnion();
      const bob = Math.sin(t * 5) * 0.02;
      h.setPose({ ...LEAN, neck: [0.32, -0.08, 0.05], head: [0.15, -0.1, 0.06] });
      // raise the knife over the onion
      h.root.updateMatrixWorld(true);
      const T = V(BOARD.x + 0.14, BOARD.y + 0.36 + bob, BOARD.z + 0.36);
      ikArm(h, 'r', T, h.root.localToWorld(V(-0.7, 0.9, 0.2)), V(0, 0, -1));
      holder.rotation.set(KR[0], KR[1], KR[2]);
      // left hand steadies the onion
      ikArm(h, 'l', V(BOARD.x + 0.09, BOARD.y + 0.07, BOARD.z + 0.03), h.root.localToWorld(V(0.6, 1.0, -0.2)), V(0, 1, 0));
      h.setMouth(0.12 + 0.05 * Math.sin(t * 3));
      const kk = easeOut(range(t, 0, 1.2));
      c.fov = 52;
      place(c, [lerp(-0.12, -0.08, kk), lerp(0.98, 1.0, kk), lerp(-0.12, 0.0, kk)], [0.05, lerp(1.38, 1.42, kk), BOARD.z + 0.55]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.55, BOARD.z + 0.6)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ S2 1.20–3.20  ECU knife crunches into the onion ============
function s2({ makeStage }) {
  const { scene } = kitchenStage(makeStage, { shadowSize: 0.4 });
  const on = onion(); on.position.copy(BOARD); on.rotation.y = 0.0; scene.add(on);
  const kh = knifeHand(); scene.add(kh);
  const juice = droplets(60, 0xf4f8e0); scene.add(juice);
  const r = rng(3); const jv = Array.from({ length: 60 }, () => V((r() - 0.5) * 0.6, 0.4 + r() * 0.9, (r() - 0.5) * 1.2).multiplyScalar(0.22 + r() * 0.3));
  const mist = sparks(80, { speed: 0.25, spread: 1.4, gravity: -0.3, life: 1.2, size: 0.006, seed: 8, color: [0.9, 1, 0.8], dir: V(0, 1, 0.3) });
  mist.position.copy(BOARD).add(V(0, 0.07, 0)); scene.add(mist);
  const c = cam(30);
  const TC = 0.55;  // crunch (local) -> 1.75 global
  return {
    scene, camera: c,
    update(t) {
      warmOnion();
      // knife: drops fast to the onion top (crunch), then pushes through in slow motion
      const edge = t < TC ? lerp(BOARD.y + 0.2, BOARD.y + 0.09, easeIn(range(t, 0.05, TC))) : lerp(BOARD.y + 0.09, BOARD.y + 0.002, easeOut(range(t, TC, 1.9)));
      kh.position.set(BOARD.x, edge, BOARD.z - 0.1);
      kh.rotation.set(0, -Math.PI / 2, 0.05);
      const it = t - TC;
      const split = it > 0 ? easeOut(range(it, 0.25, 1.5)) : 0;
      on.split(0.0015 + split * 0.012, split * 0.22);
      for (let i = 0; i < 60; i++) {
        const a = it - (i % 6) * 0.02;
        if (a > 0 && a < 1.3) {
          const v = jv[i]; const p = V(BOARD.x + v.x * a, BOARD.y + 0.075 + v.y * a - 2.2 * a * a * 0.5, BOARD.z + v.z * a);
          if (p.y > BOARD.y) juice.setDrop(i, p, 0.0009 + (i % 4) * 0.0004, 1.3); else juice.hide(i);
        } else juice.hide(i);
      }
      juice.commit(); mist.update(it);
      const s = shake(t, it > 0 ? 4 * Math.exp(-it * 5) + 0.4 : 0.4, 2);
      const k = easeInOut(range(t, 0, 2.0));
      place(c, [BOARD.x + lerp(-0.25, -0.22, k) + s[0], BOARD.y + lerp(0.24, 0.2, k) + s[1], BOARD.z + lerp(0.14, 0.12, k)], [BOARD.x, BOARD.y + lerp(0.1, 0.06, k), BOARD.z + 0.01]);
      return { dof: { focus: c.position.distanceTo(V(BOARD.x, BOARD.y + 0.06, BOARD.z)), aperture: 0.02, maxblur: 0.012 }, bloom: 0.4 };
    },
  };
}

// ============ S3 3.20–5.40  dive into the cut surface ============
function s3({ makeStage }) {
  const { scene } = kitchenStage(makeStage, { shadowSize: 0.4 });
  const half = onionHalf(1); half.position.copy(BOARD); half.rotation.set(0, 0, 0); scene.add(half);
  // lay the half cut-face up
  half.rotation.z = -Math.PI / 2; half.position.y = BOARD.y + 0.0; half.position.x = BOARD.x - 0.046;
  const other = onionHalf(1); other.rotation.set(0, Math.PI, Math.PI / 2 - 0.25); other.position.set(BOARD.x + 0.12, BOARD.y + 0.03, BOARD.z - 0.04); scene.add(other);
  const c = cam(34);
  const face = () => V(BOARD.x - 0.046 + 0.0, BOARD.y + 0.0, BOARD.z).add(V(0.042, 0.0002, 0));
  return {
    scene, camera: c,
    update(t) {
      warmOnion();
      const f = V(BOARD.x - 0.004, BOARD.y + 0.0, BOARD.z);  // centre of the cut face (now facing +y)
      const k = easeIn(range(t, 0.3, 2.2));
      const dist = lerp(0.32, 0.004, k);
      const ang = lerp(0.9, 1.45, easeInOut(range(t, 0, 2.2)));
      const p = V(f.x - Math.cos(ang) * dist * 0.5, f.y + Math.sin(ang) * dist, f.z + Math.cos(ang) * dist * 0.8);
      const s = shake(t, 0.6 + k * 2, 4);
      place(c, [p.x + s[0] * 0.2, p.y + s[1] * 0.2, p.z], [f.x, f.y, f.z], t * 0.4);
      const fl = Math.max(0, (t - 2.0) / 0.2);
      return { dof: { focus: Math.max(0.01, dist), aperture: 0.05, maxblur: 0.01 + 0.02 * k }, bloom: 0.4 + fl, exposure: 1 + fl * 1.2 };
    },
  };
}

// ============ S4 5.40–8.20  microscopic: cells burst as the blade rips through ============
function microStage(makeStage, tint = 'green') {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 3], sun: 2.0 });
  darkSky(scene, 0x5a6e2c, 0x8ea150, 0xc8d68e, 0x6a7a3a);
  scene.environmentIntensity = 1.3;
  const back = new THREE.PointLight(0xfff6c0, 6, 12); back.position.set(0, 1.5, -3); scene.add(back);
  return scene;
}
function s4({ makeStage }) {
  const scene = microStage(makeStage);
  const f = cellField({ nx: 11, nz: 30 }); scene.add(f);
  // the (blunt, at this scale) knife edge: a huge steel wedge sweeping along z at x=0
  const wedge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.42, 3.2, 4, 1), new THREE.MeshPhysicalMaterial({ color: 0xc8ccd2, metalness: 1, roughness: 0.25, clearcoat: 0.6 }));
  wedge.rotation.set(Math.PI / 2, Math.PI / 4, 0); wedge.scale.set(1, 1, 0.15);
  const wg = new THREE.Group(); wg.add(wedge); wedge.rotation.set(0, Math.PI / 4, 0); wedge.position.y = 1.6; scene.add(wg);
  shadow(wg);
  // burst times: a wave that follows the blade along z, wider than a single row (it crushes)
  const v = 2.2, z0 = -3.6;
  for (const c of f.info) {
    const dx = Math.abs(c.x);
    if (dx < 1.8) c.burst = (c.z - z0) / v + dx * 0.35 + c.seed * 0.08 + 0.1;
  }
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      f.update(t);
      const bz = z0 + v * t;
      wg.position.set(0, lerp(0.6, -0.15, smooth(range(t, 0, 0.4))), bz);
      const k = easeInOut(range(t, 0, 2.8));
      const s = shake(t, 1.5, 6);
      place(c, [lerp(1.9, 1.5, k) + s[0], lerp(1.25, 0.9, k) + s[1], bz + lerp(1.8, 1.2, k)], [0, 0, bz - 0.4]);
      return { dof: { focus: c.position.distanceTo(V(0, 0, bz)), aperture: 0.004, maxblur: 0.01 }, bloom: 0.5 };
    },
  };
}

// ============ S5 8.20–11.05  inside one cell: a chemical weapon ============
function cellStage(makeStage) {
  const scene = makeStage({ shadowSize: 4 });
  darkSky(scene, 0x0b1206, 0x16200d, 0x223014, 0x0b1206);
  scene.environmentIntensity = 0.5;
  scene.traverse(o => { if (o.isDirectionalLight) o.intensity *= 0.35; if (o.isHemisphereLight) o.intensity = 0.25; });
  const cell = bigCell(); scene.add(cell);
  const ly = new THREE.PointLight(0xffc040, 4, 5); ly.position.set(0.35, 0, 0); scene.add(ly);
  const lp = new THREE.PointLight(0xa050ff, 3, 6); lp.position.set(-1.0, 0.3, 0.6); scene.add(lp);
  const motes = sparks(160, { speed: 0.05, spread: 3, gravity: 0, life: 99, size: 0.012, seed: 4, color: [0.5, 0.7, 0.3] });
  scene.add(motes);
  return { scene, cell, ly, lp, motes };
}
function s5({ makeStage }) {
  const { scene, cell, ly, motes } = cellStage(makeStage);
  const glow = glowSprite(0xffc040, 0.9); glow.position.set(0.35, 0, 0); glow.material.opacity = 0.25; scene.add(glow);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      cell.update(t + 8, 0, 0);
      motes.update(30 + t);
      // "weapon" at 10.24 (local 2.04): yellow throbs
      const w = Math.exp(-Math.max(0, t - 2.04) * 3) * (t > 2.04 ? 1 : 0);
      cell.sMat.emissiveIntensity = 0.7 + 0.6 * w + 0.12 * Math.sin(t * 4);
      ly.intensity = 3 + 2.5 * w;
      glow.material.opacity = 0.2 + 0.4 * w;
      const k = easeInOut(range(t, 0, 2.85));
      const ang = lerp(0.55, 0.15, k);
      const R = lerp(4.2, 1.6, k);
      place(c, [Math.sin(ang) * R + 0.2, lerp(0.9, 0.25, k), Math.cos(ang) * R], [0.25, 0, 0]);
      return { dof: { focus: c.position.distanceTo(V(0.35, 0, 0)), aperture: 0.002, maxblur: 0.008 }, bloom: 0.5 + 0.35 * w, exposure: 0.9 };
    },
  };
}

// ============ S6 11.05–15.05  enzymes + sulfur mix -> flash -> volatile gas ============
function s6({ makeStage }) {
  const { scene, cell, ly, lp, motes } = cellStage(makeStage);
  const flash = glowSprite(0xfff4c0, 0.1); scene.add(flash);
  const gas = gasPlume(320, { seed: 9, color: [0.7, 0.95, 0.35], size: 0.5 }); scene.add(gas);
  const shards = sparks(140, { speed: 1.4, spread: 1.5, gravity: 0, life: 0.8, size: 0.03, seed: 12, color: [1, 0.9, 0.5], dir: V(0, 1, 0) });
  shards.position.set(0.35, 0, 0); scene.add(shards);
  const c = cam(34);
  const TR = 0.7, TF = 2.65;   // rupture (11.75), flash (13.70)
  return {
    scene, camera: c,
    update(t) {
      const mix = easeInOut(range(t, TR, TF));
      const react = smooth(range(t, TF - 0.05, TF + 0.6));
      cell.update(t + 11, mix, react);
      motes.update(40 + t);
      // vacuole bursts
      const rv = range(t, TR, TR + 0.35);
      cell.vac.scale.setScalar(1 + rv * 0.5); cell.vac.material.opacity = 0.32 * (1 - rv);
      shards.update(t - TR);
      // colours shift toward green where they meet
      cell.sMat.emissive.setRGB(1, lerp(0.69, 0.9, mix), lerp(0, 0.2, mix));
      cell.eMat.emissive.setRGB(lerp(0.48, 0.5, mix), lerp(0.12, 0.6, mix), lerp(0.82, 0.3, mix));
      const it = t - TF;
      const fl = it > 0 ? Math.exp(-it * 4) : 0;
      flash.position.set(0, 0, 0); flash.scale.setScalar(0.2 + 6 * fl); flash.material.opacity = fl;
      ly.position.set(0, 0, 0); ly.intensity = 4 + 30 * fl; lp.intensity = 3 * (1 - react);
      gas.update(Math.max(0, it), V(0, -0.2, 0), { rise: 2.6, spread: 0.9, life: 1.6, amount: smooth(range(it, 0, 0.4)) });
      const k = easeInOut(range(t, 0, 4.0));
      const ang = lerp(-0.25, 0.35, k);
      const R = lerp(2.6, 3.4, smooth(range(t, TF - 0.3, 4)));
      const s = shake(t, fl * 8 + 0.8, 9);
      place(c, [Math.sin(ang) * R + s[0], lerp(0.2, 0.9, smooth(range(t, TF, 4))) + s[1], Math.cos(ang) * R], [0.1, lerp(0, 0.6, smooth(range(t, TF, 4))), 0]);
      return { dof: { focus: R, aperture: 0.0015, maxblur: 0.006 }, bloom: 0.9 + fl * 2, exposure: 1.05 + fl * 0.8 };
    },
  };
}

// ============ S7 15.05–17.55  gas rises from the cut onion up to the face ============
function s7({ makeStage }) {
  const { scene } = kitchenStage(makeStage, { shadowSize: 1.6 });
  const on = onion(); on.position.copy(BOARD); on.split(0.03, 0.9); scene.add(on);
  const h = cook(scene);
  const kh = chefKnife(); kh.position.set(BOARD.x + 0.08, BOARD.y + 0.002, BOARD.z + 0.08); kh.rotation.set(-Math.PI / 2, 0, 0.4); scene.add(kh);
  const gas = gasPlume(420, { seed: 4, color: [0.5, 0.82, 0.12], size: 0.1, alpha: 0.5 }); scene.add(gas);
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      warmOnion();
      const sq = smooth(range(t, 1.5, 2.4));
      h.setPose({ ...LEAN, neck: [0.32, 0, 0], head: [0.2 - 0.1 * sq, 0, 0], rSh: [0.05, 0, -0.16], rEl: [-0.25, 0, 0] });
      h.setMouth(0.05 + 0.35 * sq);
      h.root.updateMatrixWorld(true);
      const eyes = h.j.head.localToWorld(V(0, 0.11, 0.09));
      gas.update(t + 2.5, V(BOARD.x, BOARD.y + 0.06, BOARD.z), { rise: 0.7, spread: 0.06, life: 2.4, target: eyes, pull: 0.9 });
      gas.setFov(c.fov);
      const k = easeInOut(range(t, 0.0, 2.5));
      const look = V(0.0, lerp(1.2, 1.32, k), lerp(0.46, 0.52, k));
      c.fov = 54;
      place(c, [lerp(-1.25, -1.0, k), lerp(1.15, 1.32, k), lerp(0.46, 0.52, k)], [look.x, look.y, look.z]);
      return { dof: { focus: c.position.distanceTo(look), aperture: 0.004, maxblur: 0.008 }, bloom: 0.35 };
    },
  };
}

// ============ S8 17.55–19.30  fly into the eye as the gas hits it ============
function eyeStage(makeStage) {
  const scene = makeStage({ shadowSize: 3, sunDir: [-2, 4, 6], sun: 2.2 });
  darkSky(scene, 0xe9d2bd, 0xe9d2bd, 0xd9b9a0, 0xc9a68c);
  const e = bigEye(); scene.add(e);
  const fill = new THREE.PointLight(0xffe8d8, 8, 12); fill.position.set(2.5, 1.5, 5); scene.add(fill);
  return { scene, e };
}
function s8({ makeStage }) {
  const { scene, e } = eyeStage(makeStage);
  const gas = gasPlume(200, { seed: 21, color: [0.76, 0.93, 0.45], size: 0.16 }); scene.add(gas);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      const hit = smooth(range(t, 0.4, 1.2));
      e.squint(0.12 + 0.25 * hit);
      e.veinMat.opacity = 0.55 * hit;
      e.redness.material.opacity = 0.12 * hit;
      gas.update(t + 3, V(0.2, -2.4, 1.3), { rise: 2.4, spread: 0.5, life: 2.2, amount: 0.7 * (1 - smooth(range(t, 1.1, 1.6))), target: V(0, -0.35, 1.1), pull: 0.6 });
      gas.setFov(c.fov);
      const k = easeIn(range(t, 0.15, 1.75));
      const z = lerp(5.5, 1.06, k);
      const s = shake(t, 0.5 + 2 * k, 3);
      place(c, [lerp(0.25, 0.02, k) + s[0], lerp(-0.05, 0.02, k) + s[1], z], [0, 0, 0]);
      const fl = Math.max(0, (t - 1.55) / 0.2);
      return { dof: { focus: Math.max(0.05, z - 1.0), aperture: 0.003, maxblur: 0.01 }, bloom: 0.4 + fl, exposure: 1 + fl * 0.6 };
    },
  };
}

// ============ S9 19.30–20.70  nerves light up red ============
function s9({ makeStage }) {
  const scene = makeStage({ shadowSize: 3 });
  darkSky(scene, 0x1a0406, 0x2a070a, 0x40100f, 0x1a0406);
  scene.environmentIntensity = 0.6;
  const net = nerveNet({ seed: 6, n: 16 }); scene.add(net);
  const red = new THREE.PointLight(0xff3020, 0, 6); scene.add(red);
  const ends = [];
  for (const cv of net.tubes.slice(0, 16)) { const s = glowSprite(0xff2a1a, 0.2); s.position.copy(cv.getPoint(1)); scene.add(s); ends.push(s); }
  const c = cam(56);
  return {
    scene, camera: c,
    update(t) {
      const a = smooth(range(t, 0.1, 0.6));
      net.pulse.uniforms.uT.value = t * 1.6; net.pulse.uniforms.uAmp.value = a;
      ends.forEach((s, i) => { s.material.opacity = a * (0.5 + 0.5 * Math.sin(t * 14 + i)); s.scale.setScalar(0.15 + 0.1 * a); });
      const z = lerp(3.4, 2.3, easeInOut(range(t, 0, 1.4)));
      red.position.set(0, 0, 0.5); red.intensity = 6 * a;
      const s = shake(t, 1 + 3 * a, 5);
      place(c, [0.3 + s[0] * 3, 0.2 + s[1] * 3, z], [0, 0, -0.8], t * 0.25);
      return { dof: { focus: z + 0.5, aperture: 0.0015, maxblur: 0.006 }, bloom: 0.9, exposure: 1.0 + 0.2 * a };
    },
  };
}

// ============ S10 20.70–22.30  the brain: "under attack" ============
function s10({ makeStage }) {
  const scene = makeStage({ shadowSize: 3 });
  darkSky(scene, 0x14080a, 0x220a0e, 0x3a1014, 0x14080a);
  const b = brain(); b.position.y = 0.1; scene.add(b);
  const rp = rippleOverlay(b);
  const alarm = new THREE.PointLight(0xff2010, 0, 8); alarm.position.set(1.2, 1.5, 2); scene.add(alarm);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      const beat = Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 2.2 - 1.5), 3);  // alarm strobe
      alarm.intensity = 18 * beat;
      b.material.emissive.setRGB(0.5 * beat, 0.02 * beat, 0.02 * beat);
      const u = rp.material.uniforms;
      u.uCenter.value.set(0.3, 0.55, 0.6); u.uRings.value = 26; u.uSpot.value = 0.18; u.uSpotAmp.value = 1;
      u.uRadius.value = 0.2 + easeOut(range(t, 0.05, 1.4)) * 1.9; u.uAmp.value = smooth(range(t, 0, 0.2)); u.uTime.value = t * 0.6;
      const k = easeInOut(range(t, 0, 1.6));
      const s = shake(t, 1.5 + 3 * beat, 7);
      place(c, [lerp(2.0, 1.6, k) + s[0], lerp(1.3, 1.0, k) + s[1], lerp(3.8, 3.0, k)], [0, 0.1, 0]);
      return { dof: { focus: c.position.length(), aperture: 0.001, maxblur: 0.005 }, bloom: 0.8 + beat * 0.6, exposure: 1.0 + 0.25 * beat };
    },
  };
}

// ============ S11 22.30–23.75  tear gland fires, tears flood the eye ============
function s11({ makeStage }) {
  const { scene, e } = eyeStage(makeStage);
  e.squint(0.3); e.veinMat.opacity = 0.5; e.redness.material.opacity = 0.1;
  const gl = tearGland(); gl.position.set(1.0, 0.95, 0.62); gl.rotation.z = -0.5; gl.scale.setScalar(0.8); scene.add(gl);
  gl.mat.transparent = true; gl.mat.opacity = 0.9;
  const duct = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0.85, 0.85, 0.7), V(0.62, 0.7, 0.85), V(0.42, 0.62, 0.92)]), 24, 0.025, 10), gl.mat);
  scene.add(duct);
  const N = 220, tears = droplets(N); scene.add(tears);
  const r = rng(9); const P = Array.from({ length: N }, () => ({ t0: r() * 1.2, x: (r() - 0.5) * 1.5, sp: 0.8 + r() * 0.8, sz: 0.018 + r() * 0.03 }));
  const glow = glowSprite(0xff7080, 1.2); glow.position.copy(gl.position).add(V(0, 0, 0.3)); scene.add(glow);
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      const fire = smooth(range(t, 0.05, 0.4));
      const pump = 0.5 + 0.5 * Math.sin(t * 18);
      gl.scale.setScalar(1 + 0.08 * fire * pump);
      gl.mat.emissive.setRGB(0.6 * fire * pump, 0.08 * fire, 0.12 * fire);
      glow.material.opacity = 0.5 * fire * pump;
      e.film.material.opacity = 0.25 * smooth(range(t, 0.3, 1.0));
      for (let i = 0; i < N; i++) {
        const q = P[i], a = t - 0.25 - q.t0 * 0.8;
        if (a < 0) { tears.hide(i); continue; }
        // out of the duct, over the eyeball, then pouring over the lower lid
        const th = a * q.sp * 1.6;
        const x = lerp(0.35, q.x * 0.9, Math.min(1, th * 1.4));
        const ang = 0.55 - th * 0.9;               // angle above the equator, sliding down the front
        const R = 1.06;
        let p = V(x, Math.sin(ang) * R, Math.cos(ang) * R);
        if (ang < -0.5) { const f = (-0.5 - ang); p = V(x, Math.sin(-0.5) * R - f * 1.5 - f * f * 2, Math.cos(-0.5) * R + 0.1 + f * 0.3); }
        tears.setDrop(i, p, q.sz * Math.min(1, a * 6), ang < -0.5 ? 1.5 : 1);
      }
      tears.commit();
      const k = easeInOut(range(t, 0, 1.45));
      const s = shake(t, 1.2, 8);
      place(c, [lerp(0.9, 0.7, k) + s[0], lerp(0.5, 0.35, k) + s[1], lerp(5.2, 4.6, k)], [0.3, 0.2, 0.4]);
      return { dof: { focus: c.position.distanceTo(V(0.3, 0.2, 0.8)), aperture: 0.002, maxblur: 0.008 }, bloom: 0.5 };
    },
  };
}

// ============ S12 23.75–24.85  the cook bawling (laugh) ============
function s12({ makeStage }) {
  const { scene } = kitchenStage(makeStage, { shadowSize: 1.0 });
  const h = cook(scene);
  const N = 120, tears = droplets(N); scene.add(tears);
  const r = rng(14); const P = Array.from({ length: N }, () => ({ t0: r(), s: r() < 0.5 ? 1 : -1, j: r() }));
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      const sob = 0.5 + 0.5 * Math.sin(t * 22);
      h.setPose({ ...LEAN, spine: [0.05, 0, 0], chest: [0.02 + 0.03 * sob, 0, 0], neck: [-0.05, 0, 0], head: [-0.12 + 0.04 * sob, 0.05, 0.04 * Math.sin(t * 9)], rSh: [0.05, 0, -0.16], rEl: [-0.25, 0, 0] });
      h.setMouth(0.55 + 0.35 * sob);
      h.root.updateMatrixWorld(true);
      for (let i = 0; i < N; i++) {
        const q = P[i]; const a = ((t * 1.4 + q.t0) % 1);
        // streams from both eyes down the cheeks, then dripping off the jaw
        const lp = V(q.s * (0.04 + a * 0.012 + q.j * 0.006), 0.104 - a * 0.13, 0.1 - a * 0.012);
        const wp = h.j.head.localToWorld(lp);
        if (a > 0.8) wp.y -= (a - 0.8) * (a - 0.8) * 6;
        tears.setDrop(i, wp, 0.0055 + q.j * 0.003, 1.4);
      }
      tears.commit();
      const head = h.j.head.localToWorld(V(0, 0.08, 0.05));
      const s = shake(t, 3, 12);
      const k = easeOut(range(t, 0, 1.1));
      place(c, [head.x + 0.05 + s[0], head.y + 0.02 + s[1], head.z - lerp(0.62, 0.5, k)], [head.x, head.y, head.z]);
      return { dof: { focus: c.position.distanceTo(head), aperture: 0.004, maxblur: 0.008 }, bloom: 0.35 };
    },
  };
}

// ============ S13 24.85–26.85  chill the onion: into the fridge ============
function s13({ makeStage }) {
  const scene = makeStage({ shadowSize: 1, sunDir: [0, 5, 4], sun: 0.8 });
  darkSky(scene, 0x3a3f46, 0x4a5058, 0x5a6068, 0x30343a);
  const fr = fridgeInside(); scene.add(fr);
  const on = onion(); scene.add(on);
  const cs = contactShadow(0.06, 0.7); scene.add(cs);
  const cold = new THREE.PointLight(0x9fd0ff, 2.5, 2); cold.position.set(0.15, 0.55, -0.1); scene.add(cold);
  const frost = softPoints(160, { color: [0.85, 0.93, 1.0] }); scene.add(frost);
  const r = rng(5); const F = Array.from({ length: 160 }, () => ({ p: V((r() - 0.5) * 0.55, r() * 0.85, -r() * 0.45), ph: r() * 9 }));
  // door: swings closed at the end
  const door = new THREE.Group(); door.position.set(0.3, 0, 0.02); scene.add(door);
  const dp = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.92, 0.05), new THREE.MeshPhysicalMaterial({ color: 0xb8c4d0, roughness: 0.4, clearcoat: 0.3 }));
  dp.position.set(-0.31, 0.45, 0); door.add(dp);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      // onion carried in (hand not shown), set down on the middle shelf
      const k = easeOut(range(t, 0.0, 0.7));
      on.position.set(lerp(0.12, 0.02, k), lerp(0.42, 0.308, k) + Math.sin(Math.min(1, k) * Math.PI) * 0.04, lerp(0.35, -0.22, k));
      on.rotation.y = lerp(0.6, 0.1, k);
      cs.position.set(on.position.x, 0.3055, on.position.z); cs.material.opacity = 0.75 * smooth(range(k, 0.6, 1)) * (1 - Math.min(1, (on.position.y - 0.308) / 0.05));
      // frost creeps over the onion skin
      const cool = smooth(range(t, 0.8, 1.9));
      onionMaterials().skin.color.setRGB(lerp(1, 0.82, cool), lerp(1, 0.9, cool), lerp(1, 1.0, cool));
      for (let i = 0; i < 160; i++) { const q = F[i]; frost.set(i, V(q.p.x + Math.sin(t * 0.6 + q.ph) * 0.02, q.p.y - (t * 0.05 + q.ph * 0.01) % 0.2, q.p.z), 0.012, 0.25); }
      frost.commit(); frost.setFov(c.fov);
      const shut = easeIn(range(t, 1.45, 2.0));
      door.rotation.y = lerp(1.6, 0, shut);
      const s = shake(t, 0.5, 2);
      place(c, [lerp(-0.1, -0.05, k) + s[0], lerp(0.68, 0.6, k), lerp(0.6, 0.42, k)], [0.02, 0.32, -0.2]);
      return { dof: { focus: c.position.distanceTo(on.position), aperture: 0.004, maxblur: 0.008 }, bloom: 0.25, exposure: lerp(0.85, 0.2, shut) };
    },
  };
}

// ============ S14 26.85–28.20  a sharp knife (glint along the edge) ============
function s14({ makeStage }) {
  const { scene } = kitchenStage(makeStage, { shadowSize: 0.5 });
  const k = chefKnife(); scene.add(k);
  k.position.set(BOARD.x - 0.11, BOARD.y + 0.14, BOARD.z); k.rotation.set(0.2, 0.0, 0.08);
  const glint = glowSprite(0xffffff, 0.04); scene.add(glint);
  const star = glowSprite(0xffffff, 0.02); scene.add(star);
  const c = cam(30);
  return {
    scene, camera: c,
    update(t) {
      k.rotation.set(0.2 + 0.25 * smooth(range(t, 0, 1.3)), lerp(-0.25, 0.1, smooth(range(t, 0, 1.3))), 0.08);
      k.updateMatrixWorld(true);
      const g = range(t, 0.25, 0.95);
      const p = k.localToWorld(V(lerp(0.0, 0.2, g), 0.002, 0.002));
      const on = Math.sin(Math.PI * g);
      glint.position.copy(p); glint.scale.setScalar(0.02 + 0.06 * on); glint.material.opacity = on;
      star.position.copy(p); star.scale.set(0.16 * on, 0.004, 1); star.material.opacity = on * 0.8;
      const kk = easeInOut(range(t, 0, 1.35));
      const tgt = k.localToWorld(V(0.11, 0.02, 0));
      place(c, [tgt.x + lerp(-0.08, 0.02, kk), tgt.y + lerp(0.03, 0.05, kk), tgt.z + lerp(0.26, 0.22, kk)], [tgt.x, tgt.y, tgt.z]);
      return { dof: { focus: c.position.distanceTo(tgt), aperture: 0.02, maxblur: 0.012 }, bloom: 0.8 };
    },
  };
}

// ============ S15 28.20–30.35  cold onion, clean slice, no gas ============
function s15({ makeStage }) {
  const { scene } = kitchenStage(makeStage, { shadowSize: 0.4 });
  // cool grade for the chilled onion
  const coolL = new THREE.PointLight(0xa8d4ff, 1.5, 1.5); coolL.position.set(BOARD.x - 0.2, BOARD.y + 0.3, BOARD.z + 0.3); scene.add(coolL);
  const on = onion(); on.position.copy(BOARD); scene.add(on);
  const kh = knifeHand(); scene.add(kh);
  const mist = softPoints(60, { color: [0.9, 0.95, 1] }); scene.add(mist);
  const r = rng(77); const Mi = Array.from({ length: 60 }, () => ({ a: r() * 6.28, rr: r(), ph: r() }));
  const c = cam(30);
  const TS = 0.5;
  return {
    scene, camera: c,
    update(t) {
      onionMaterials().skin.color.setRGB(0.84, 0.9, 1.0);
      // smooth, effortless slice
      const d = easeInOut(range(t, TS, TS + 1.1));
      kh.position.set(BOARD.x, BOARD.y + 0.14 - d * 0.138, BOARD.z - 0.1);
      kh.rotation.set(0, -Math.PI / 2, 0.05 - 0.04 * d);
      const sp = easeOut(range(t, TS + 0.9, 2.1));
      on.split(0.0008 + sp * 0.007, sp * 0.1);
      // only cold mist sinking, no gas rising
      for (let i = 0; i < 60; i++) { const q = Mi[i]; const a = (t * 0.25 + q.ph) % 1; mist.set(i, V(BOARD.x + Math.cos(q.a) * (0.05 + a * 0.06), BOARD.y + 0.06 - a * 0.05, BOARD.z + Math.sin(q.a) * (0.05 + a * 0.06)), 0.03, 0.12 * Math.sin(Math.PI * a)); }
      mist.commit(); mist.setFov(c.fov);
      const k = easeInOut(range(t, 0, 2.15));
      place(c, [BOARD.x + lerp(-0.25, -0.22, k), BOARD.y + lerp(0.24, 0.2, k), BOARD.z + lerp(0.14, 0.12, k)], [BOARD.x, BOARD.y + lerp(0.09, 0.06, k), BOARD.z + 0.01]);
      return { dof: { focus: c.position.distanceTo(V(BOARD.x, BOARD.y + 0.05, BOARD.z)), aperture: 0.02, maxblur: 0.012 }, bloom: 0.45 };
    },
  };
}

// ============ S16 30.35–32.00  micro: a sharp blade parts only one row of cells ============
function s16({ makeStage }) {
  const scene = microStage(makeStage);
  const f = cellField({ nx: 11, nz: 30, seed: 5 }); scene.add(f);
  f.cellMat.color.set(0xe2eedc);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.025, 3.2, 3), chefKnife().bladeMat);
  scene.add(blade);
  const v = 3.2, z0 = -3.4;
  // a clean line: only cells crossing x=0 burst (none either side)
  for (const c of f.info) if (Math.abs(c.x) < f.L * 0.5) c.burst = (c.z - z0) / v + 0.25;
  const glint = glowSprite(0xffffff, 0.3); scene.add(glint);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      f.update(t);
      const bz = z0 + v * t;
      blade.position.set(0, 1.5, bz - 1.5);
      glint.position.set(0, 0.05, bz); glint.material.opacity = 0.7;
      const k = easeInOut(range(t, 0, 1.65));
      place(c, [lerp(1.9, 1.5, k), lerp(1.25, 0.95, k), bz + lerp(1.8, 1.3, k)], [0, 0, bz - 0.5]);
      return { dof: { focus: c.position.distanceTo(V(0, 0, bz)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.5 };
    },
  };
}

export const SHOTS = [
  { start: 0.0, end: 1.2, build: s1 },
  { start: 1.2, end: 3.2, build: s2 },
  { start: 3.2, end: 5.4, build: s3 },
  { start: 5.4, end: 8.2, build: s4 },
  { start: 8.2, end: 11.05, build: s5 },
  { start: 11.05, end: 15.05, build: s6 },
  { start: 15.05, end: 17.55, build: s7 },
  { start: 17.55, end: 19.3, build: s8 },
  { start: 19.3, end: 20.7, build: s9 },
  { start: 20.7, end: 22.3, build: s10 },
  { start: 22.3, end: 23.75, build: s11 },
  { start: 23.75, end: 24.85, build: s12 },
  { start: 24.85, end: 26.85, build: s13 },
  { start: 26.85, end: 28.2, build: s14 },
  { start: 28.2, end: 30.35, build: s15 },
  { start: 30.35, end: DURATION + 1, build: s16 },
];

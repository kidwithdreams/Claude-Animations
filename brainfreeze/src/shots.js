// "What Actually Happens When You Get Brain Freeze?" — the edit.
import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite, sparks, rippleOverlay } from './props.js';
import { materials } from './materials.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { brain, nerveNet, darkSky, softPoints, droplets } from './kitchen.js';
import { dial, gaugeFace } from './hand.js';
import { iceCream, iceShell, headSection, vessels, pulseLine, glow, stain } from './freeze.js';

export const DURATION = 27.85;

export const CAPTIONS = [
  [0.0, 'WHAT ACTUALLY'], [0.8, 'HAPPENS WHEN YOU'], [1.52, 'GET BRAIN FREEZE', 2.65],
  [2.8, 'MOST PEOPLE THINK'], [3.68, 'THE COLD IS'], [4.32, 'FREEZING YOUR BRAIN', 5.5],
  [5.84, 'BUT YOUR BRAIN'], [6.64, "CAN'T EVEN"], [7.28, 'FEEL PAIN', 8.1],
  [8.32, 'WHEN SOMETHING'], [9.12, 'ICE-COLD HITS'], [9.84, 'THE ROOF OF YOUR MOUTH', 10.9],
  [10.96, 'THE BLOOD VESSELS'], [11.84, 'THERE TIGHTEN UP', 12.9],
  [13.12, 'THEN THEY SUDDENLY'], [14.24, 'SWELL BACK OPEN', 15.4],
  [15.6, 'AND A NERVE'], [16.4, 'PANICS', 17.25],
  [17.44, 'IT SENDS A'], [18.08, 'PAIN SIGNAL', 18.95],
  [19.12, 'BUT YOUR BRAIN'], [19.84, 'GETS CONFUSED'], [20.72, "AND THINKS IT'S"], [21.36, 'COMING FROM'], [21.76, 'YOUR FOREHEAD', 22.6],
  [22.8, 'TO STOP IT'], [23.68, 'PRESS YOUR TONGUE'], [24.48, 'AGAINST THE ROOF'], [25.04, 'OF YOUR MOUTH', 25.7],
  [25.84, 'THE WARMTH MAKES IT'], [26.8, 'GO AWAY FASTER'],
];
export const FADES = [];

const M = materials();
const fx = (scene, o) => { scene.add(o); return o; };
const backOut = (t) => { t = clamp(t); const c1 = 1.9, c3 = c1 + 1; return t <= 0 ? 0 : 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
function redX(scene) {
  const X = new THREE.Group(); scene.add(X);
  const xm = new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false });
  for (const a of [0.78, -0.78]) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.34, 0.08), xm); b.rotation.z = a; X.add(b); }
  return X;
}

// ---------- the cook with an ice cream (front, medium close) ----------
// mode: 'bite' (hook) | 'forehead' (pain lands on the forehead) | 'relief'
function cookShot(mode) {
  return ({ makeStage }) => {
    const scene = makeStage({ shadowSize: 2, sunDir: [-2, 5, 4], sun: 2.2 });
    const h = makeHuman('plain'); scene.add(h.root);
    const ic = iceCream(); scene.add(ic);
    const frost = sparks(140, { speed: 0.5, spread: 1.6, gravity: 0, life: 0.9, size: 0.012, seed: 6, color: [0.75, 0.9, 1], dir: V(0, 1, 0.3) }); scene.add(frost);
    const blue = fx(scene, glow(0x9fd8ff, 0.5));
    const skull = h.j.head.children.find(o => o.isMesh);
    const rp = rippleOverlay(skull);
    const drops = droplets(30, 0xe6f6ff); scene.add(drops);
    const c = cam(34);
    return {
      scene, camera: c,
      update(t) {
        M.cloth.color.set(0x2f6aa6); M.hair.color.set(0x3a2618); M.beard.color.set(0x5c4434);
        const bite = mode === 'bite' ? smooth(range(t, 0.55, 1.0)) - smooth(range(t, 1.25, 1.7)) : 0;
        const frz = mode === 'bite' ? smooth(range(t, 1.55, 1.85)) : mode === 'forehead' ? 1 : 1 - smooth(range(t, 0.2, 1.4));
        const wob = Math.sin(t * 34) * 0.03 * (mode === 'relief' ? 0 : frz);
        h.setPose({ spine: [0.04, 0, 0], chest: [0.02, 0, 0], neck: [-0.05 + 0.1 * bite, 0, 0], head: [-0.05 * frz + wob, 0.05, wob * 0.5], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07] });
        h.setMouth(mode === 'relief' ? 0.12 : lerp(bite * 0.8, 0.75, frz));
        h.root.updateMatrixWorld(true);
        const mouth = h.j.head.localToWorld(V(0, 0.03, 0.14));
        // right hand holds the cone near the mouth; left hand goes to the forehead when it hurts
        const coneAt = mouth.clone().add(V(-0.03, -0.2 - 0.1 * (1 - bite), 0.07 + 0.05 * (1 - bite)));
        ikArm(h, 'r', coneAt, h.root.localToWorld(V(-0.6, 0.9, -0.3)), V(0, 1, 0));
        ikArm(h, 'l', h.root.localToWorld(V(0.3, 0.9, 0.05)), h.root.localToWorld(V(0.6, 1.0, -0.3)), V(0, 0, 1));
        // cone placed relative to the mouth (top scoop at the lips on the bite); the hand is below the frame
        ic.position.copy(mouth).add(V(-0.02, -0.215 - 0.09 * (1 - bite), 0.04 + 0.05 * (1 - bite))); ic.rotation.set(0, 0, 0.12 * (1 - bite));
        // frost burst around the head
        const head = h.j.head.localToWorld(V(0, 0.1, 0.02));
        frost.position.copy(head); frost.update(mode === 'bite' ? t - 1.6 : -1);
        blue.position.copy(head); blue.material.opacity = mode === 'relief' ? 0.4 * (1 - smooth(range(t, 0.1, 1.0))) : 0.55 * frz; blue.scale.setScalar(0.45 + 0.1 * Math.sin(t * 6));
        // forehead ripple (the "wrong" place)
        const u = rp.material.uniforms;
        u.uCenter.value.set(0, 0.45, 0.9).multiplyScalar(0.1); u.uRings.value = 700; u.uSpot.value = 0.022; u.uSpotAmp.value = 1.2; u.uTime.value = t;
        const fr = mode === 'forehead' ? range(t, 0.55, 0.9) : 0;
        u.uAmp.value = fr > 0 ? 0.9 : 0; u.uRadius.value = fr > 0 ? 0.02 + easeOut(range(t, 0.55, 1.6)) * 0.08 : 0;
        // melting drips in the relief shot
        for (let i = 0; i < 30; i++) {
          if (mode !== 'relief') { drops.hide(i); continue; }
          const a = ((t * 0.9 + i / 30) % 1);
          const p = h.j.head.localToWorld(V(Math.sin(i * 2.3) * 0.09, 0.2 - a * 0.25, 0.05 + Math.cos(i * 2.3) * 0.06));
          drops.setDrop(i, p, 0.006 * (1 - a) * (1 - smooth(range(t, 1.2, 2.0))), 1.3);
        }
        drops.commit();
        const k = easeInOut(range(t, 0, 2.6));
        const s = shake(t, mode === 'bite' ? (t > 1.6 ? 6 * Math.exp(-(t - 1.6) * 3) + 0.6 : 0.5) : mode === 'forehead' ? 2.2 : 0.4, 3);
        const d = mode === 'forehead' ? lerp(0.75, 0.6, k) : lerp(1.05, 0.85, k);
        place(c, [head.x + 0.08 + s[0], head.y - 0.04 + s[1], head.z + d], [head.x, head.y - 0.1, head.z]);
        return { dof: { focus: d, aperture: 0.003, maxblur: 0.008 }, bloom: 0.45 };
      },
    };
  };
}

// ---------- brain on a dark backdrop ----------
function brainStage(makeStage, tint = [0x060a16, 0x0d1730, 0x182a50]) {
  const scene = makeStage({ shadowSize: 3 });
  darkSky(scene, ...tint);
  const b = brain(); b.position.y = 0.1; scene.add(b);
  const key = new THREE.PointLight(0xfff0f0, 22, 10); key.position.set(-2, 2.5, 3); scene.add(key);
  return { scene, b };
}
// myth: the cold freezes your brain
function frozenBrain({ makeStage }) {
  const { scene, b } = brainStage(makeStage);
  const ice = iceShell(b);
  const snow = sparks(160, { speed: 0.4, spread: 3, gravity: -0.3, life: 2.5, size: 0.03, seed: 2, color: [0.8, 0.9, 1] }); scene.add(snow);
  const X = redX(scene); X.position.set(0, 0.15, 1.6);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      const k = smooth(range(t, 1.2, 2.1));          // "freezing" at 4.32
      ice.set(k); b.material.color.setRGB(lerp(0.91, 0.75, k), lerp(0.64, 0.8, k), lerp(0.65, 0.95, k));
      snow.position.set(0, 1.2, 0); snow.update(t);
      const xs = backOut(range(t, 2.25, 2.55)); X.scale.setScalar(xs); X.visible = xs > 0.01;
      const a = lerp(0.6, 0.15, easeInOut(range(t, 0, 3)));
      place(c, [Math.sin(a) * 3.6, 1.0, Math.cos(a) * 3.6], [0, 0.05, 0]);
      return { bloom: 0.6 };
    },
  };
}
// the brain itself feels no pain: a probe touches it, the PAIN gauge stays at zero
function noPain({ makeStage }) {
  const { scene, b } = brainStage(makeStage, [0x0a0612, 0x170d26, 0x2a1840]);
  const probe = new THREE.Group(); scene.add(probe);
  const pm = new THREE.MeshPhysicalMaterial({ color: 0xd8dde4, metalness: 1, roughness: 0.2 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 16), pm); rod.position.y = 1.2; probe.add(rod);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 16), pm); tip.rotation.x = Math.PI; tip.position.y = -0.06; probe.add(tip);
  const G = dial((x, v) => gaugeFace(x, v, 'PAIN'), { r: 0.55 }); G.position.set(-0.75, 1.45, 0.4); G.scale.setScalar(0.75); G.rotation.y = 0.25; scene.add(G);
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      const poke = smooth(range(t, 0.6, 1.1)) - smooth(range(t, 1.6, 2.0));
      probe.position.set(0.15, 0.82 - 0.15 * poke, 0.35); probe.rotation.set(0.3, 0, -0.25);
      G.update(0.0 + Math.sin(t * 40) * 0.004);
      place(c, [-0.2, 1.1, 4.8], [-0.1, 0.6, 0]);
      return { dof: { focus: 4.8, aperture: 0.001, maxblur: 0.005 }, bloom: 0.5 };
    },
  };
}
// head cross-section. mode: 'cold' | 'signal' | 'tongue'
function sectionShot(mode) {
  return ({ makeStage }) => {
    const scene = makeStage({ shadowSize: 3, sunDir: [-2, 4, 6], sun: 2.0 });
    const H = headSection(); scene.add(H);
    const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xf7b6c8, roughness: 0.45, clearcoat: 0.6 }));
    scene.add(scoop);
    const frost = stain(0x8fd8ff); scene.add(frost);
    const warm = stain(0xffa040); scene.add(warm);
    const ice = sparks(80, { speed: 0.3, spread: 1.5, gravity: 0, life: 0.8, size: 0.03, seed: 3, color: [0.8, 0.95, 1], dir: V(0, 1, 0.2) }); scene.add(ice);
    const nerve = pulseLine([H.at(0.55, -0.16), H.at(0.45, 0.02), H.at(0.3, 0.2), H.at(0.18, 0.4)], { r: 0.025 });
    scene.add(nerve);
    const brainGlow = fx(scene, glow(0xff3020, 0.6));
    const c = cam(36);
    return {
      scene, camera: c,
      update(t) {
        const z = H.front;
        // ice cream slides in and touches the palate ("hits" at 9.60 -> local 1.28)
        const inn = mode === 'cold' ? easeOut(range(t, 0.2, 1.25)) : mode === 'signal' ? 1 : 1 - smooth(range(t, 0.2, 0.7));
        scoop.position.set(lerp(1.7, 0.72, inn), -0.31, z + 0.02); scoop.visible = inn > 0.02;
        const hit = mode === 'cold' ? range(t, 1.25, 2.3) : mode === 'signal' ? 1 : 1 - smooth(range(t, 1.2, 2.6));
        frost.position.set(0.55, -0.2, z + 0.03); frost.scale.set(0.3 + hit * 1.1, 0.2 + hit * 0.55, 1); frost.material.opacity = (mode === 'cold' ? hit : 1) * (mode === 'tongue' ? 1 - smooth(range(t, 1.2, 2.6)) : 1) * 0.9;
        ice.position.set(0.6, -0.2, z + 0.05); ice.update(mode === 'cold' ? t - 1.3 : -1);
        // tongue presses up against the palate ("press" at 23.68 -> local 0.98)
        const press = mode === 'tongue' ? easeInOut(range(t, 0.8, 1.3)) : 0;
        H.tongue.position.y = 0.11 * press; H.tongue.rotation.z = 0.04 * press;
        warm.position.set(0.5, -0.24, z + 0.035); warm.scale.set(0.2 + 1.0 * smooth(range(t, 1.1, 2.4)), 0.15 + 0.5 * smooth(range(t, 1.1, 2.4)), 1); warm.material.opacity = mode === 'tongue' ? 0.9 * smooth(range(t, 1.0, 1.6)) : 0;
        // pain signal: red pulse runs from the palate up into the brain
        const sp = mode === 'signal' ? easeInOut(range(t, 0.15, 1.2)) : 0;
        nerve.set(sp, mode === 'signal' ? 1 : 0);
        brainGlow.position.set(0.15, 0.45, z + 0.05); brainGlow.material.opacity = mode === 'signal' ? smooth(range(t, 1.0, 1.3)) * (0.7 + 0.3 * Math.sin(t * 14)) : 0;
        const k = easeInOut(range(t, 0, 2.6));
        const s = shake(t, mode === 'cold' && t > 1.3 ? 3 * Math.exp(-(t - 1.3) * 3) + 0.4 : 0.4, 5);
        if (mode === 'signal') place(c, [0.35 + s[0], 0.15 + s[1], z + lerp(5.6, 5.0, k)], [0.2, 0.1, z]);
        else place(c, [lerp(0.15, 0.5, k) + s[0], lerp(0.0, -0.2, k) + s[1], z + lerp(6.0, 3.6, k)], [lerp(0.15, 0.5, k), lerp(0.0, -0.22, k), z]);
        return { dof: { focus: c.position.z - z, aperture: 0.002, maxblur: 0.006 }, bloom: 0.6 };
      },
    };
  };
}
// blood vessels: 'tight' then 'swell'
function vesselShot(mode) {
  return ({ makeStage }) => {
    const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 3] });
    darkSky(scene, 0x2a0a0e, 0x4a1218, 0x6a2026);
    const V_ = vessels(); scene.add(V_);
    const frost = sparks(120, { speed: 0.05, spread: 3, gravity: -0.05, life: 99, size: 0.06, seed: 9, color: [0.75, 0.9, 1] }); scene.add(frost);
    const c = cam(40);
    return {
      scene, camera: c,
      update(t) {
        let swell, cold;
        if (mode === 'tight') { const k = smooth(range(t, 0.9, 1.6)); swell = -0.9 * k; cold = 0.2 + 0.7 * k; }
        else { const k = easeOut(range(t, 1.1, 1.35)); const throb = Math.sin(t * 9) * 0.25 * k; swell = lerp(-0.9, 1.4, k) + throb; cold = lerp(0.9, 0, k); }
        V_.set({ swell, cold, t });
        frost.position.set(0, 1.2, 0); frost.update(mode === 'tight' ? 30 + t : -1);
        const s = shake(t, mode === 'swell' && t > 1.1 ? 4 * Math.exp(-(t - 1.1) * 2) + 1 : 0.5, 6);
        const k = easeInOut(range(t, 0, 2.5));
        place(c, [lerp(-1.2, -0.6, k) + s[0], lerp(3.4, 2.6, k) + s[1], lerp(3.4, 2.6, k)], [0.2, 0, 0]);
        return { dof: { focus: 3.4, aperture: 0.002, maxblur: 0.006 }, bloom: mode === 'swell' ? 0.7 : 0.5 };
      },
    };
  };
}
// the nerve panics
function nerveShot({ makeStage }) {
  const scene = makeStage({ shadowSize: 3 });
  darkSky(scene, 0x1a0406, 0x2a070a, 0x40100f);
  scene.environmentIntensity = 0.6;
  const net = nerveNet({ seed: 6, n: 16 }); scene.add(net);
  const red = new THREE.PointLight(0xff3020, 0, 6); red.position.set(0, 0, 0.5); scene.add(red);
  const ends = net.tubes.slice(0, 16).map(cv => { const s = glowSprite(0xff2a1a, 0.2); s.position.copy(cv.getPoint(1)); scene.add(s); return s; });
  const c = cam(56);
  return {
    scene, camera: c,
    update(t) {
      const a = smooth(range(t, 0.2, 0.7));
      net.pulse.uniforms.uT.value = t * 2.2; net.pulse.uniforms.uAmp.value = a;
      ends.forEach((s, i) => { s.material.opacity = a * (0.5 + 0.5 * Math.sin(t * 16 + i)); s.scale.setScalar(0.15 + 0.12 * a); });
      red.intensity = 7 * a * (0.7 + 0.3 * Math.sin(t * 20));
      const z = lerp(3.4, 2.2, easeInOut(range(t, 0, 1.9)));
      const s = shake(t, 1 + 4 * a, 5);
      place(c, [0.3 + s[0] * 3, 0.2 + s[1] * 3, z], [0, 0, -0.8], t * 0.3);
      return { bloom: 1.0, exposure: 1.0 + 0.2 * a };
    },
  };
}
// the brain is confused: the red ripple wanders, searching
function confusedBrain({ makeStage }) {
  const { scene, b } = brainStage(makeStage, [0x14080a, 0x220a0e, 0x3a1014]);
  const rp = rippleOverlay(b);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      const u = rp.material.uniforms;
      const p = kf(t, [[0, [0.6, 0.2, 0.7]], [0.5, [-0.5, 0.5, 0.6]], [0.9, [0.2, -0.3, 0.9]], [1.3, [0.7, 0.55, 0.5]], [1.7, [0.75, 0.35, 0.75]]], easeInOut);
      u.uCenter.value.set(...p); u.uRings.value = 40; u.uSpot.value = 0.3; u.uSpotAmp.value = 1.4; u.uRadius.value = 0.75; u.uAmp.value = 1.0; u.uTime.value = t;
      b.material.emissive.setRGB(0.15 + 0.1 * Math.sin(t * 12), 0.01, 0.01);
      const s = shake(t, 1.6, 7);
      place(c, [2.2 + s[0], 1.0 + s[1], 2.8], [0.1, 0.1, 0]);
      return { bloom: 0.7 };
    },
  };
}

export const SHOTS = [
  { start: 0.0, end: 2.8, build: cookShot('bite') },
  { start: 2.8, end: 5.84, build: frozenBrain },
  { start: 5.84, end: 8.32, build: noPain },
  { start: 8.32, end: 11.0, build: sectionShot('cold') },
  { start: 11.0, end: 13.1, build: vesselShot('tight') },
  { start: 13.1, end: 15.6, build: vesselShot('swell') },
  { start: 15.6, end: 17.5, build: nerveShot },
  { start: 17.5, end: 19.2, build: sectionShot('signal') },
  { start: 19.2, end: 20.9, build: confusedBrain },
  { start: 20.9, end: 22.7, build: cookShot('forehead') },
  { start: 22.7, end: 25.6, build: sectionShot('tongue') },
  { start: 25.6, end: DURATION + 1, build: cookShot('relief') },
];

// "Why Do Knuckles Crack?" — the edit.
import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite, sparks, rippleOverlay } from './props.js';
import { materials } from './materials.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { makeHand, knuckleJoint, dial, gaugeFace, watchFace, calendar, glow, xrayMat } from './hand.js';

export const DURATION = 28.6;

export const CAPTIONS = [
  [0.0, 'WHAT ACTUALLY'], [0.8, 'HAPPENS WHEN YOU'], [1.6, 'CRACK YOUR KNUCKLES', 2.75],
  [2.96, 'MOST PEOPLE THINK'], [3.68, "IT'S BONES"], [4.32, 'GRINDING TOGETHER', 5.35],
  [5.68, 'BUT THEY'], [6.16, 'NEVER EVEN TOUCH', 7.45],
  [7.68, 'EACH KNUCKLE'], [8.48, 'IS SEALED IN'], [9.12, 'A CAPSULE'], [9.68, 'OF SLIPPERY FLUID', 10.9],
  [11.04, 'PULL THE JOINT APART'], [12.32, 'THE PRESSURE DROPS'], [13.36, 'AND A GAS BUBBLE'], [14.4, 'SUDDENLY FORMS', 15.25],
  [15.44, "THAT'S THE POP", 16.55],
  [16.8, "THAT'S ALSO WHY"], [17.6, "YOU CAN'T CRACK IT"], [18.48, 'TWICE IN A ROW', 19.35],
  [19.44, 'THE GAS NEEDS'], [20.16, 'ABOUT TWENTY MINUTES'], [21.04, 'TO DISSOLVE', 21.75],
  [22.0, 'AND ARTHRITIS?', 23.15],
  [23.28, 'ONE DOCTOR'], [24.0, 'CRACKED ONLY'], [24.64, 'HIS LEFT HAND'], [25.52, 'FOR SIXTY YEARS', 26.9],
  [27.2, 'NEITHER HAND'], [27.92, 'GOT IT'],
];
export const FADES = [];

const M = materials();
const studio = (makeStage, o = {}) => makeStage({ shadowSize: 0.6, sunDir: [-2, 5, 4], sun: 2.2, ...o });
function darkStage(makeStage, top, mid, hor) {
  const scene = makeStage({ shadowSize: 3 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(top); u.mid.value.set(mid); u.horizon.value.set(hor); u.floorC.value.set(top);
  scene.children.forEach(c => { if (c.material && c.material.isShadowMaterial) c.visible = false; });
  return scene;
}
const fx = (scene, o) => { scene.add(o); return o; };

// ---------- two hands: the right hand pulls the left index finger until it pops ----------
// opts: pop (local time of the pop, or null for a dud), cam path
function handsShot({ pop = 1.75, closer = false, dud = false, slow = 1 } = {}) {
  return ({ makeStage }) => {
    const scene = studio(makeStage);
    // left hand from the left (fingers +x), palm down; right hand from the right (fingers -x), gripping the left index finger
    const L = makeHand(); L.position.set(-0.03, 1.0, 0); scene.add(L);
    const R = makeHand({ sleeve: 0x2f6aa6 }); scene.add(R);
    const rp = rippleOverlay(L.palm);
    const flash = fx(scene, glow(0xffffff, 0.05));
    const sp = sparks(40, { speed: 0.12, spread: 1.4, gravity: 0, life: 0.5, size: 0.004, seed: 4, color: [1, 0.9, 0.8], dir: V(0, 1, 0) }); scene.add(sp);
    const c = cam(30);
    return {
      scene, camera: c,
      update(t) {
        const tt = t * slow;
        const it = dud ? -1 : tt - pop;
        const pull = it < 0 ? easeIn(range(tt, 0.15, pop)) : 1 - 0.75 * easeOut(range(it, 0, 0.45));
        const strain = dud ? smooth(range(tt, 0.2, 1.2)) * (0.85 + 0.15 * Math.sin(tt * 30)) : pull;
        L.pose({ curl: [0, 0.3, 0.35, 0.4], spread: 0.4 });
        L.bendFinger(0, [-0.12 * strain, 0.0, 0.0]);
        L.fingers[0][0].position.x = 0.046 + 0.005 * strain;          // the joint opens a little
        L.updateMatrixWorld(true);
        // right hand: fingers point -x, wrapped over the left index finger, pulling it along +x
        const mid = L.fingers[0][1].localToWorld(V(0.004, 0, 0));
        R.rotation.set(0, Math.PI, 0.12); R.scale.z = -1;
        R.position.copy(mid).add(V(0.064 + 0.006 * strain, 0.024, 0.004));
        R.pose({ curl: [0.62, 0.66, 0.7, 0.75], thumb: 0.8 });
        const k = L.knuckles[0].getWorldPosition(V(0, 0, 0));
        const fl = it > 0 ? Math.exp(-it * 9) : 0;
        flash.position.copy(k).add(V(0, 0.012, 0.01)); flash.scale.setScalar(0.02 + 0.12 * fl); flash.material.opacity = fl;
        sp.position.copy(k); sp.update(it);
        const u = rp.material.uniforms;
        u.uCenter.value.copy(L.palm.worldToLocal(k.clone())); u.uRings.value = 900; u.uSpot.value = 0.008; u.uSpotAmp.value = 1.2;
        u.uAmp.value = it > 0 ? Math.exp(-it * 1.4) : 0; u.uRadius.value = it > 0 ? 0.01 + easeOut(range(it, 0, 1)) * 0.09 : 0; u.uTime.value = tt;
        const kk = easeInOut(range(t, 0, 2.6));
        const s = shake(t, (it > 0 ? 10 * Math.exp(-it * 6) : 0) + (dud ? 1.5 : 0.5), 3);
        const d = closer ? lerp(0.3, 0.24, kk) : lerp(0.4, 0.31, kk);
        place(c, [k.x + 0.02 + s[0] * 0.3, k.y + d * 0.55 + s[1] * 0.3, k.z + d * 0.85], [k.x + 0.025, k.y - 0.005, k.z]);
        return { dof: { focus: c.position.distanceTo(k), aperture: 0.01, maxblur: 0.01 }, bloom: 0.4 + fl };
      },
    };
  };
}

// X-ray finger joint (bones grinding — the myth)
function xrayGrind({ makeStage }) {
  const scene = darkStage(makeStage, 0x030812, 0x07132a, 0x0d2244);
  const J = knuckleJoint(); scene.add(J);
  const xb = xrayMat(0xa8dcff, 1.4, 0.2);
  J.traverse(o => { if (o.isMesh) { o.material = xb; o.castShadow = false; } });
  J.capsule.visible = J.fluid.visible = J.bubble.visible = false;
  const spA = sparks(90, { speed: 1.2, spread: 1.6, gravity: -3, life: 0.4, size: 0.06, seed: 12, color: [1, 0.6, 0.25], dir: V(0, 1, 0.3) }); scene.add(spA);
  const X = new THREE.Group(); scene.add(X);
  const xm = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, toneMapped: false });
  for (const a of [0.78, -0.78]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.42, 0.1), xm); b.rotation.z = a; X.add(b); }
  X.position.set(0.1, 0, 2.2);
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      // grind: the phalanx scrubs against the head (it's the myth, so it's exaggerated)
      const gr = range(t, 1.2, 2.3);
      J.set({ gap: -0.32 * smooth(range(t, 0.6, 1.2)) });
      J.B.rotation.z = Math.sin(t * 26) * 0.08 * gr; J.B.position.y = Math.sin(t * 26 + 1) * 0.04 * gr;
      spA.position.set(0.3, 0.6, 0.2); spA.update(gr > 0 ? (t - 1.2) % 0.4 : -1);
      const xs = backOutScale(range(t, 2.05, 2.35));
      X.scale.setScalar(xs); X.visible = xs > 0.01;
      const s = shake(t, 1 + 4 * gr, 5);
      place(c, [lerp(-1.2, -0.8, t / 2.7) + s[0], 1.2 + s[1], lerp(6.2, 5.2, t / 2.7)], [0.2, 0, 0]);
      return { bloom: 0.9, exposure: 1.0 };
    },
  };
}
const backOutScale = (t) => { t = clamp(t); const c1 = 1.9, c3 = c1 + 1; return t <= 0 ? 0 : 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };

// inside-the-body look for the joint shots
function jointStage(makeStage) {
  const scene = darkStage(makeStage, 0x1a0508, 0x3a0d12, 0x5a1a1e);
  scene.environmentIntensity = 0.9;
  const J = knuckleJoint(); scene.add(J);
  const warm = new THREE.PointLight(0xffb090, 25, 14); warm.position.set(-2, 3, 4); scene.add(warm);
  const rimL = new THREE.PointLight(0x80b0ff, 18, 12); rimL.position.set(3, -1, -3); scene.add(rimL);
  const motes = sparks(120, { speed: 0.05, spread: 3, gravity: 0, life: 99, size: 0.035, seed: 8, color: [1, 0.8, 0.7] }); scene.add(motes);
  return { scene, J, motes };
}
// "they never even touch": fly into the gap
function gapShot({ makeStage }) {
  const { scene, J, motes } = jointStage(makeStage);
  J.capsule.visible = false; J.fluid.visible = false;
  const gapGlow = fx(scene, glow(0xfff0d0, 0.5));
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      J.set({ gap: 0.07 }); motes.update(20 + t);
      gapGlow.position.set(0.16, 0, 0.75); gapGlow.material.opacity = 0.45 + 0.25 * Math.sin(t * 5);
      const k = easeInOut(range(t, 0, 1.9));
      place(c, [lerp(-2.0, 0.15, k), lerp(2.2, 0.35, k), lerp(5.5, 3.2, k)], [0.16, 0, 0], lerp(0, 0.1, k));
      return { dof: { focus: c.position.distanceTo(V(0.16, 0, 0)), aperture: 0.0015, maxblur: 0.006 }, bloom: 0.7 };
    },
  };
}
// capsule + slippery fluid
function capsuleShot({ makeStage }) {
  const { scene, J, motes } = jointStage(makeStage);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      J.set({ gap: 0.12, specks: 0.8 * smooth(range(t, 1.2, 2.2)), t });
      J.capsuleMat.opacity = 0.18 + 0.18 * smooth(range(t, 0.3, 1.1));
      J.fluidMat.opacity = 0.1 + 0.18 * smooth(range(t, 1.6, 2.6));
      motes.update(30 + t);
      const a = lerp(-0.9, 0.7, easeInOut(range(t, 0, 3.4)));
      const R = lerp(5.4, 4.2, easeInOut(range(t, 0, 3.4)));
      place(c, [Math.sin(a) * R, lerp(1.6, 0.9, t / 3.4), Math.cos(a) * R], [0.1, 0, 0]);
      return { dof: { focus: R, aperture: 0.0015, maxblur: 0.006 }, bloom: 0.6 };
    },
  };
}
// pull apart, pressure gauge drops
function pullShot({ makeStage }) {
  const { scene, J, motes } = jointStage(makeStage);
  const G = dial(gaugeFace, { r: 0.75 }); G.position.set(0.75, 1.75, 1.2); G.scale.setScalar(0.62); G.rotation.y = -0.1; scene.add(G);
  const arrow = new THREE.Group(); scene.add(arrow);
  const am = new THREE.MeshBasicMaterial({ color: 0xffd23a, toneMapped: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 16), am); shaft.rotation.z = Math.PI / 2; arrow.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 20), am); head.rotation.z = -Math.PI / 2; head.position.x = 0.8; arrow.add(head);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      const pull = easeInOut(range(t, 0.1, 1.4));
      J.set({ gap: 0.12 + 0.55 * pull, specks: 0.8, t: t + 4 });
      J.capsuleMat.opacity = 0.32; J.fluidMat.opacity = 0.26;
      motes.update(40 + t);
      arrow.position.set(3.3 + pull * 0.6, -1.25, 0.4); arrow.visible = t < 1.9;
      const drop = easeOut(range(t, 1.75, 2.25));        // "pressure drops" (12.88)
      G.update(lerp(0.8, 0.08, drop) + Math.sin(t * 40) * 0.01 * (1 - drop));
      const s = shake(t, 0.8 + 2 * (drop > 0 && drop < 1 ? 1 : 0), 4);
      place(c, [-0.3 + s[0], 1.0 + s[1], 6.4], [0.5, 0.45, 0]);
      return { dof: { focus: 6.2, aperture: 0.001, maxblur: 0.004 }, bloom: 0.6 };
    },
  };
}
// the bubble suddenly forms (hero shot)
function bubbleShot({ makeStage }) {
  const { scene, J, motes } = jointStage(makeStage);
  const flash = fx(scene, glow(0xfff4e0, 1));
  const ringM = new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 96), ringM); scene.add(ring);
  const c = cam(38);
  const TB = 1.0;  // 14.40 "suddenly"
  return {
    scene, camera: c,
    update(t) {
      const it = t - TB;
      const br = it < 0 ? 0 : 0.4 * easeOut(range(it, 0, 0.12)) * (1 + 0.06 * Math.exp(-it * 6) * Math.sin(it * 40));
      J.set({ gap: 0.67, bubble: br, specks: it < 0 ? 0.8 : 0.8 * (1 - range(it, 0, 0.15)), t: t + 6 });
      J.capsuleMat.opacity = 0.32; J.fluidMat.opacity = 0.26;
      motes.update(50 + t);
      const fl = it > 0 ? Math.exp(-it * 7) : 0;
      flash.position.set(0.46, 0, 0.3); flash.scale.setScalar(0.5 + 5 * fl); flash.material.opacity = fl;
      ring.position.set(0.46, 0, 0.2); ring.lookAt(c.position);
      ring.scale.setScalar(it > 0 ? 0.6 + it * 5 : 0.001); ringM.opacity = it > 0 ? Math.max(0, 0.85 - it * 1.1) : 0;
      const k = easeInOut(range(t, 0, 2.0));
      const s = shake(t, it > 0 ? 9 * Math.exp(-it * 4) + 0.6 : 0.6, 7);
      place(c, [lerp(1.0, 1.4, k) + s[0], lerp(1.2, 0.8, k) + s[1], lerp(5.0, 4.0, k)], [0.45, 0, 0]);
      return { dof: { focus: c.position.distanceTo(V(0.58, 0, 0)), aperture: 0.004, maxblur: 0.01 }, bloom: 0.7 + 2 * fl, exposure: 1 + 0.6 * fl };
    },
  };
}
// the bubble dissolves over twenty minutes
function dissolveShot({ makeStage }) {
  const { scene, J, motes } = jointStage(makeStage);
  const W = dial(watchFace, { r: 0.7, rim: 0xd8dde4 }); W.position.set(-0.75, 1.55, 1.4); W.scale.setScalar(0.62); W.rotation.y = 0.2; scene.add(W);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      const k = easeInOut(range(t, 0.3, 2.3));
      J.set({ gap: lerp(0.67, 0.12, k), bubble: 0.4 * (1 - k), specks: 0.15 + 0.85 * k, t: t * 3 });
      J.capsuleMat.opacity = 0.3; J.fluidMat.opacity = 0.24;
      motes.update(60 + t);
      W.update(20 * k);
      place(c, [lerp(-0.6, -0.3, t / 2.5), 0.9, lerp(5.6, 5.0, t / 2.5)], [-0.3, 0.5, 0]);
      return { dof: { focus: 5.2, aperture: 0.001, maxblur: 0.004 }, bloom: 0.6 };
    },
  };
}
// X-ray hand; joints glow red (arthritis?) or green (healthy). mode: 'threat' | 'healthy'
function xrayHands(mode) {
  return ({ makeStage }) => {
    const scene = darkStage(makeStage, 0x030812, 0x07132a, 0x0d2244);
    const hands = mode === 'healthy' ? [makeHand(), makeHand()] : [makeHand()];
    hands.forEach((h, i) => {
      h.setXray(true, 0.9); scene.add(h);
      h.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -Math.PI / 2).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 2)));
      if (hands.length === 2) { h.position.set(i ? 0.075 : -0.075, 0.98, 0); if (i) h.scale.z = -1; } else h.position.set(0, 0.98, 0);
      h.pose({ spread: 1, curl: [0.05, 0, 0.03, 0.08] });
    });
    const dots = [];
    hands.forEach(h => { h.updateMatrixWorld(true); h.fingers.forEach(f => f.forEach(j => { const g = glow(mode === 'healthy' ? 0x40ff80 : 0xff2a1a, 0.03); scene.add(g); dots.push([g, j]); })); });
    const c = cam(34);
    return {
      scene, camera: c,
      update(t) {
        dots.forEach(([g, j], i) => {
          g.position.copy(j.getWorldPosition(V(0, 0, 0)));
          if (mode === 'healthy') { const a = smooth(range(t, 0.15 + (i % 12) * 0.04, 0.45 + (i % 12) * 0.04)); g.material.opacity = a; g.scale.setScalar(0.028 * a + 0.001); }
          else { const p = 0.5 + 0.5 * Math.sin(t * 7 + i); g.material.opacity = 0.5 + 0.5 * p; g.scale.setScalar(0.02 + 0.02 * p); }
        });
        const k = easeInOut(range(t, 0, 1.6));
        const s = shake(t, mode === 'healthy' ? 0.4 : 1.6, 9);
        place(c, [s[0], 1.03 + s[1], lerp(0.5, 0.42, k) + (mode === 'healthy' ? 0.26 : 0)], [0, 1.03, 0]);
        return { bloom: 1.0 };
      },
    };
  };
}
// the doctor who cracked only his left hand
function doctorShot({ years = false } = {}) {
  return ({ makeStage }) => {
    const scene = studio(makeStage, { shadowSize: 2 });
    const d = makeHuman('plain'); d.root.position.set(0, 0, 0); scene.add(d.root);
    // glasses
    const gm = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
    for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.0025, 8, 28), gm); r.position.set(sx * 0.035, 0.11, 0.1); d.j.head.add(r); }
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.03, 6), gm); br.rotation.z = Math.PI / 2; br.position.set(0, 0.112, 0.103); d.j.head.add(br);
    const cal = calendar(); cal.position.set(0.42, 1.78, -0.6); scene.add(cal);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ color: 0xd9dfe6, roughness: 0.9 })); wall.position.set(0, 1.6, -0.65); wall.receiveShadow = true; scene.add(wall);
    const pop = fx(scene, glow(0xffffff, 0.05));
    const c = cam(years ? 40 : 30);
    return {
      scene, camera: c,
      update(t, gt) {
        const age = years ? smooth(range(t, 0.1, 1.5)) : 0;
        M.cloth.color.set(0xeef0f2);   // all-white doctor's outfit
        M.hair.color.setRGB(lerp(0.23, 0.78, age), lerp(0.15, 0.78, age), lerp(0.09, 0.8, age));
        M.beard.color.copy(M.hair.color);
        d.setPose({ spine: [0.05, 0, 0], chest: [0.05, 0, 0], neck: [0.2, 0, 0], head: [0.15, 0.08, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07] });
        d.setMouth(0.05);
        d.root.updateMatrixWorld(true);
        // hands meet in front of the chest; the right hand presses the left fingers
        const cycle = years ? (t * 2.2) % 1 : (t < 0.7 ? 0 : (t - 0.7) % 1.2 / 1.2);
        const press = Math.sin(Math.min(1, cycle * 1.6) * Math.PI);
        const base = d.root.localToWorld(V(0.02, 1.22, 0.3));
        ikArm(d, 'l', base.clone().add(V(0.05, 0.02 * press, 0)), d.root.localToWorld(V(0.6, 1.0, -0.2)), V(0, 1, 0));
        ikArm(d, 'r', base.clone().add(V(-0.05, 0.03 - 0.02 * press, 0.02)), d.root.localToWorld(V(-0.6, 1.0, -0.2)), V(0, 1, 0));
        const popT = years ? (cycle > 0.3 && cycle < 0.45) : (cycle > 0.32 && cycle < 0.45 && t > 0.7);
        const lw = d.j.lWr.getWorldPosition(V(0, 0, 0));
        pop.position.copy(lw).add(V(0, 0.03, 0.04)); pop.material.opacity = popT ? 0.9 : 0; pop.scale.setScalar(popT ? 0.09 : 0.001);
        if (years) cal.update(Math.round(lerp(1949, 2009, smooth(range(t, 0.05, 1.45)))));
        else cal.update(1949);
        const head = d.j.head.getWorldPosition(V(0, 0, 0));
        if (years) place(c, [0.9, 1.45, 2.3], [0.25, 1.4, 0]);
        else { const k = easeInOut(range(t, 0, 2.1)); place(c, [lerp(-0.32, -0.22, k), lerp(1.4, 1.38, k), lerp(1.55, 1.35, k)], [lw.x * 0.5 + head.x * 0.5, lw.y + 0.24, 0.15]); }
        return { dof: { focus: c.position.distanceTo(head), aperture: years ? 0.0015 : 0.003, maxblur: 0.006 }, bloom: 0.4 };
      },
    };
  };
}

export const SHOTS = [
  { start: 0.0, end: 2.95, build: handsShot({ pop: 1.72 }) },          // pop on "crack" (1.60-1.92)
  { start: 2.95, end: 5.65, build: xrayGrind },
  { start: 5.65, end: 7.6, build: gapShot },
  { start: 7.6, end: 11.0, build: capsuleShot },
  { start: 11.0, end: 13.4, build: pullShot },
  { start: 13.4, end: 15.4, build: bubbleShot },
  { start: 15.4, end: 16.8, build: handsShot({ pop: 0.55, closer: true }) },   // "pop" at 16.00
  { start: 16.8, end: 19.4, build: handsShot({ dud: true, closer: true }) },
  { start: 19.4, end: 21.9, build: dissolveShot },
  { start: 21.9, end: 23.3, build: xrayHands('threat') },
  { start: 23.3, end: 25.4, build: doctorShot({}) },
  { start: 25.4, end: 26.95, build: doctorShot({ years: true }) },
  { start: 26.95, end: DURATION + 1, build: xrayHands('healthy') },
];

// "Imagine falling asleep at your desk... and your boss being impressed." — the edit.
import * as THREE from 'three';
import { bean } from './bean.js';
import { toon } from './toon.js';
import { officeSet, meetingSet, trainSet, classroomSet, japanSet, chair, box, cvs } from './sets.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V } from './anim.js';
import { burst, stamp, redX, speedLines, confetti, flash, exclaim, thought, icons, meter, scroll, sign, project, OW, OH } from './fx.js';

export const DURATION = 44.5;
const cam = (fov = 50) => new THREE.PerspectiveCamera(fov, 720 / 1280, 0.05, 120);
const place = (c, p, l) => { c.position.set(...p); c.lookAt(...l); };
const pulse = (lt, at, len = 0.25) => clamp(1 - Math.abs(lt - at) / len);   // 0..1 spike around a moment
const zs = (scene) => { const t = cvs(128, 128, g => { g.fillStyle = '#fff'; g.strokeStyle = '#1a1a22'; g.lineWidth = 10; g.font = '900 100px Cap, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('Z', 64, 68); g.fillText('Z', 64, 68); }); return [0, 1, 2].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); scene.add(s); return s; }); };
const floatZ = (Z, hp, t, k = 1) => Z.forEach((z, i) => { const a = ((t * 0.55 + i / 3) % 1); z.position.set(hp.x + 0.14 + a * 0.28, hp.y + 0.22 + a * 0.6, hp.z); z.scale.setScalar((0.08 + a * 0.14) * k); z.material.opacity = Math.sin(Math.PI * a) * k; });
const sleeperBean = () => bean({ suit: 0x2fa36f, tie: 0x2b3a5c, hair: 0x5a3a1e });
const bossBean = () => bean({ suit: 0x1f2a44, tie: 0xc8202a, grey: true });
// the sleeper at the main desk (chair at z 0.62, facing -z)
function seatSleeper(scene) { const s = sleeperBean(); s.position.set(-0.15, 0, 0.58); s.rotation.y = Math.PI; scene.add(s); return s; }
const sleepPose = (s, t, { upright = 0 } = {}) => { const br = Math.sin(t * 2.2); s.pose({ sit: 1, lean: lerp(-0.42, -0.05, upright) + br * 0.015, headTilt: [lerp(-0.15, 0.25, upright) + br * 0.03, lerp(-0.45, 0, upright), lerp(-0.38, -0.12, upright)], arm: { 1: [-0.85, -1.05], [-1]: [-0.8, -1.1] } }); };
const bubble = (s, t, on = 1) => { const k = 0.5 + 0.5 * Math.sin(t * 2.2); s.bubble.visible = on > 0; s.bubble.scale.setScalar(Math.max(0.01, (0.4 + 1.3 * k) * on)); };

// ===== 1. asleep at the desk (snot bubble, Z's)
function s1() {
  const scene = new THREE.Scene(); const o = officeSet(scene); const s = seatSleeper(scene); const Z = zs(scene); const c = cam(50);
  return { scene, camera: c, update(lt) { o.clocks.forEach(k => k.draw(lt)); sleepPose(s, lt); s.face('sleep'); bubble(s, lt); scene.updateMatrixWorld(true); floatZ(Z, s.headWorld(), lt); const k = easeInOut(range(lt, 0, 2.9)); place(c, [lerp(1.25, 0.85, k), lerp(1.45, 1.28, k), lerp(-0.9, -0.55, k)], [-0.22, lerp(1.15, 1.05, k), 0.6]); },
    fx(g, lt) { const hp = project(s.headWorld().add(V(0.25, 0.42, 0)), c); burst(g, hp[0] + 40, hp[1] - 40, 90, 'ZZZ', range(lt, 0.7, 1.0), { fill: '#bfe3ff', col: '#1c6fd1', rot: 0.15 }); } };
}
// ===== 2. the boss walks in: "!" -> grin, WOW, speed lines, stars
function s2() {
  const scene = new THREE.Scene(); const o = officeSet(scene); const s = seatSleeper(scene); const b = bossBean(); scene.add(b); const c = cam(50);
  return { scene, camera: c, update(lt) {
      o.clocks.forEach(k => k.draw(lt + 3)); sleepPose(s, lt + 3); s.face('sleep'); bubble(s, lt + 3);
      o.doorPivot.rotation.y = 1.5 * easeOut(range(lt, 0.0, 0.25));
      const wk = easeInOut(range(lt, 0.0, 0.5)); const bp = V(lerp(1.5, 0.85, wk), 0, lerp(-2.4, -0.9, wk)); b.position.copy(bp);
      b.rotation.y = Math.atan2(s.position.x - bp.x, s.position.z - bp.z);
      const sur = pulse(lt, 0.55, 0.3); const nod = lt > 1.3 ? Math.max(0, Math.sin((lt - 1.3) * 10)) * 0.16 : 0;
      b.pose({ walk: lt < 0.5 ? lt * 10 : 0, bob: sur * 0.08, squash: -0.12 * sur, headScale: 1 + 0.12 * pulse(lt, 1.3, 0.2), headTilt: [nod, 0, 0], arm: lt > 1.3 ? { 1: [-0.3, -1.6], [-1]: [-0.3, -1.6] } : undefined });
      b.face(lt < 0.5 ? 'normal' : lt < 1.28 ? 'wide' : 'grin');
      scene.updateMatrixWorld(true);
      const bh = b.headWorld(); const dir = V(s.position.x - bp.x, 0, s.position.z - bp.z).normalize();
      if (lt < 1.28) place(c, [-1.2, 1.35, 1.7], [0.7, 1.1, -1.0]);
      else { const k = easeOut(range(lt, 1.28, 1.6)); const p = bh.clone().addScaledVector(dir, lerp(1.7, 1.25, k)).add(V(0.12, -0.05, 0)); place(c, [p.x, p.y, p.z], [bh.x, bh.y - 0.06, bh.z]); }
      return { shake: 10 * pulse(lt, 1.3, 0.25) + 6 * pulse(lt, 0.55, 0.2) };
    },
    fx(g, lt) {
      const bh = project(b.headWorld().add(V(0, 0.45, 0)), c);
      if (lt < 1.28) exclaim(g, bh[0], bh[1], range(lt, 0.5, 0.75));
      else { speedLines(g, OW / 2, OH * 0.38, range(lt, 1.28, 1.45), lt); burst(g, OW * 0.72, OH * 0.16, 110, 'WOW!', range(lt, 1.32, 1.6), { rot: 0.12 }); flash(g, 0.7 * (1 - range(lt, 1.28, 1.45)));
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + lt; const k = range(lt, 1.35 + i * 0.05, 1.6 + i * 0.05); burst(g, OW / 2 + Math.cos(a) * 270, OH * 0.4 + Math.sin(a) * 300, 26, '', k, { spikes: 5, rot: a }); } }
    } };
}
// ===== 3. Japan: flag, Fuji, petals
function s3() {
  const scene = new THREE.Scene(); const o = japanSet(scene); const c = cam(45);
  const petals = new THREE.InstancedMesh(new THREE.CircleGeometry(0.04, 6), new THREE.MeshBasicMaterial({ color: 0xf6a8c0, side: THREE.DoubleSide }), 140); petals.userData.noInk = true; scene.add(petals);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  return { scene, camera: c, update(lt) {
      o.flag.wave(lt);
      for (let i = 0; i < 140; i++) { const a = ((lt * 0.25 + i * 0.137) % 1); m4.compose(V(-4 + (i * 0.61 % 8) + Math.sin(lt + i) * 0.4, 4.5 - a * 4.6, -3 + (i * 0.37 % 5)), q.setFromEuler(e.set(lt * 2 + i, lt + i * 0.3, 0)), V(1, 1, 1)); petals.setMatrixAt(i, m4); }
      petals.instanceMatrix.needsUpdate = true;
      const k = easeOut(range(lt, 0, 1.2)); place(c, [lerp(0.4, 0.9, k), lerp(1.2, 2.4, k), lerp(9, 6.5, k)], [0.1, lerp(2.0, 3.1, k), 0]);
      return { shake: 6 * pulse(lt, 0.3, 0.2) };
    },
    fx(g, lt) { burst(g, OW / 2, 250, 120, 'JAPAN!', range(lt, 0.25, 0.5), { fill: '#ffffff', col: '#bc002d', rot: -0.08 }); } };
}
// ===== 4. 居眠り banner -> "sleeping while present": attendance stamp
function s4() {
  const scene = new THREE.Scene(); const o = officeSet(scene); const s = seatSleeper(scene); const Z = zs(scene); const c = cam(48);
  return { scene, camera: c, update(lt) { o.clocks.forEach(k => k.draw(lt + 8)); sleepPose(s, lt + 8, { upright: 0.6 }); s.face('sleep'); bubble(s, lt + 8, 0.7); scene.updateMatrixWorld(true); floatZ(Z, s.headWorld(), lt, smooth(range(lt, 2.2, 2.6))); const k = easeInOut(range(lt, 2.0, 4)); place(c, [lerp(1.1, 0.8, k), 1.35, lerp(-1.1, -0.7, k)], [-0.2, 1.05, 0.55]); },
    fx(g, lt) {
      // the kanji banner (first 2.2 s), then the stamp
      const inK = backIn(lt, 0.4, 0.75), out = range(lt, 2.0, 2.3);
      if (inK > 0 && out < 1) {
        g.save(); g.translate(OW / 2 - out * OW, OH * 0.36); const s2 = inK; g.scale(s2, s2);
        g.fillStyle = '#fff6e0'; g.strokeStyle = '#1a1a22'; g.lineWidth = 10; g.beginPath(); g.roundRect(-300, -170, 600, 340, 26); g.fill(); g.stroke();
        g.fillStyle = '#bc002d'; g.font = '900 170px "WenQuanYi Zen Hei", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('居眠り', 0, -10);
        g.fillStyle = '#1a1a22'; g.font = '900 46px Cap'; g.fillText('I-NE-MU-RI', 0, 120); g.restore();
      }
      stamp(g, 'PRESENT ✓', OW / 2, OH * 0.2, range(lt, 3.2, 3.4), { col: '#2f9e44', rot: -0.14, size: 68 });
    } };
}
const backIn = (t, a, b) => { const k = range(t, a, b); if (k <= 0) return 0; const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; };
// ===== 5. a train full of sleepy workers, sleep meter drains
function s5() {
  const scene = new THREE.Scene(); const o = trainSet(scene); const c = cam(55);
  const riders = []; const cols = [0x1f2a44, 0x2fa36f, 0x6a4a8a, 0x3a6ad0, 0x8a3a3a, 0x2b3a5c, 0x5a5a62];
  for (let i = 0; i < 7; i++) { const b = bean({ suit: cols[i], tie: [0xc8202a, 0x2b3a5c, 0xffc83a][i % 3], hair: [0x3a2a1c, 0x1a1a1a, 0x6a4a2a][i % 3], grey: i === 4 }); b.position.set(-3 + i * 1.0, 0.0, -1.0); scene.add(b); riders.push(b); }
  return { scene, camera: c, update(lt) {
      o.city.offset.x = (lt * 0.35) % 1;
      riders.forEach((b, i) => { const nod = Math.sin(lt * 2 + i * 1.3); b.pose({ sit: 1, lean: -0.1, headTilt: [0.25 + 0.15 * Math.max(0, nod), 0, (i % 2 ? 1 : -1) * (0.15 + 0.15 * nod)], arm: { 1: [-0.5, -0.9], [-1]: [-0.5, -0.9] } }); b.face(lt > 1.6 + i * 0.12 ? 'sleep' : 'tired'); });
      const k = easeInOut(range(lt, 0, 4.2)); place(c, [lerp(-1.6, 1.2, k), 1.25, 1.1], [lerp(-1.4, 1.0, k), 0.95, -1.0]);
      return { shake: 2.5 };
    },
    fx(g, lt) { meter(g, 190, 180, 340, 80, 1 - 0.92 * range(lt, 0.6, 2.4), 'SLEEP'); burst(g, OW / 2, 420, 80, 'LOW!', range(lt, 2.3, 2.5), { fill: '#ff6b6b', col: '#ffffff', rot: 0.1, size: 0.5 }); } };
}
// ===== 6. he dozes off; coworkers peek over the partition
function s6() {
  const scene = new THREE.Scene(); const o = officeSet(scene); const s = seatSleeper(scene); const c = cam(48);
  const peek = [bean({ suit: 0x8a3a3a, tie: 0xffc83a, hair: 0x1a1a1a }), bean({ suit: 0x3a6ad0, tie: 0xc8202a, hairStyle: 'bun', hair: 0x2a1a10 })];
  peek.forEach((p, i) => { p.position.set(-2.0 + i * 0.7, 0, -1.4); scene.add(p); });
  return { scene, camera: c, update(lt) {
      o.clocks.forEach(k => k.draw(lt + 16));
      const drop = easeIn(range(lt, 0.7, 0.95));   // "dozes" at 16.96
      sleepPose(s, lt, { upright: 1 - drop }); s.face(lt < 0.75 ? 'tired' : 'sleep'); bubble(s, lt, drop);
      peek.forEach((p, i) => { const up = easeOut(range(lt, 1.6 + i * 0.15, 2.0 + i * 0.15)); p.position.y = lerp(-0.7, -0.05, up); p.rotation.y = 0.5 - i * 0.2; p.pose({ headTilt: [0, 0, (i ? -1 : 1) * 0.15] }); p.face('wide'); });
      const k = easeInOut(range(lt, 0, 3.2)); place(c, [lerp(1.6, 1.3, k), 1.55, lerp(1.4, 1.1, k)], [-0.6, 1.0, -0.5]);
      return { shake: 5 * pulse(lt, 0.95, 0.2) };
    },
    fx(g, lt) { const hp = project(s.headWorld().add(V(0, 0.4, 0)), c); burst(g, hp[0], hp[1], 70, 'ZZZ', range(lt, 1.0, 1.2), { fill: '#bfe3ff', col: '#1c6fd1' }); } };
}
// ===== 7. "wow, he must be working really hard": thought bubbles
function s7() {
  const scene = new THREE.Scene(); const o = officeSet(scene); const s = seatSleeper(scene); const c = cam(46);
  const peek = [bean({ suit: 0x8a3a3a, tie: 0xffc83a, hair: 0x1a1a1a }), bean({ suit: 0x3a6ad0, tie: 0xc8202a, hairStyle: 'bun', hair: 0x2a1a10 })];
  peek.forEach((p, i) => { p.position.set(-2.0 + i * 0.7, -0.05, -1.4); p.rotation.y = 0.5 - i * 0.2; scene.add(p); });
  return { scene, camera: c, update(lt) {
      o.clocks.forEach(k => k.draw(lt + 19)); sleepPose(s, lt + 19); s.face('sleep'); bubble(s, lt + 19);
      peek.forEach((p, i) => { p.pose({ headTilt: [0.1 * Math.sin(lt * 8 + i), 0, (i ? -1 : 1) * 0.15] }); p.face(lt < 0.15 ? 'wide' : 'grin'); });
      place(c, [-0.4, 1.45, 1.1], [-1.65, 1.0, -1.4]);
      return { shake: 6 * pulse(lt, 0.15, 0.2) };
    },
    fx(g, lt) {
      burst(g, OW * 0.5, 230, 110, 'WOW!', range(lt, 0.1, 0.35), { rot: -0.1 });
      const a = project(peek[0].headWorld().add(V(0, 0.32, 0)), c), b2 = project(peek[1].headWorld().add(V(0, 0.32, 0)), c);
      thought(g, a[0] - 60, a[1] - 150, 95, range(lt, 0.7, 1.0), icons.trophy, [a[0], a[1]]);
      thought(g, b2[0] + 70, b2[1] - 200, 95, range(lt, 1.2, 1.5), icons.muscle, [b2[0], b2[1]]);
    } };
}
// ===== 8. gong: THE RULES
function s8() {
  const scene = new THREE.Scene(); officeSet(scene); const c = cam(50);
  return { scene, camera: c, update(lt) { place(c, [0, 1.6, 2.4], [0, 1.4, -2]); return { shake: 18 * pulse(lt, 0.05, 0.4) }; },
    fx(g, lt) {
      g.save(); g.globalAlpha = 0.6; g.fillStyle = '#1a1a22'; g.fillRect(0, 0, OW, OH); g.restore();
      speedLines(g, OW / 2, OH * 0.45, 1, lt, { col: 'rgba(255,212,59,' });
      flash(g, 0.8 * (1 - range(lt, 0, 0.25)), '#ffd43b');
      scroll(g, range(lt, 0.4, 1.1), 'THE RULES', []);
      if (lt > 1.0) { g.save(); g.font = '900 80px Cap'; g.textAlign = 'center'; g.fillStyle = '#1a1a22'; g.globalAlpha = range(lt, 1.0, 1.3); g.fillText('1  2  3', OW / 2, 640); g.restore(); }
    } };
}
// ===== 9. sit upright; phone rings -> instantly awake
function s9() {
  const scene = new THREE.Scene(); const o = officeSet(scene); const s = seatSleeper(scene); const Z = zs(scene); const c = cam(48);
  return { scene, camera: c, update(lt) {
      o.clocks.forEach(k => k.draw(lt + 24));
      const ring = lt > 2.0;   // "jump" at 26.40
      const awake = easeOut(range(lt, 2.0, 2.15));
      sleepPose(s, lt, { upright: 1 }); if (ring) s.pose({ sit: 1, lean: -0.02, bob: 0.06 * pulse(lt, 2.1, 0.15), headTilt: [0, 0, 0], squash: -0.15 * pulse(lt, 2.1, 0.15), arm: { 1: [-1.4, -0.4], [-1]: [-0.8, -1.1] } });
      s.face(ring ? (lt < 2.6 ? 'wide' : 'smile') : 'sleep'); bubble(s, lt, ring ? 0 : 0.8);
      o.phone.position.y = 0.79 + (ring && lt < 2.6 ? Math.abs(Math.sin(lt * 50)) * 0.03 : 0);
      scene.updateMatrixWorld(true); floatZ(Z, s.headWorld(), lt, ring ? 0 : 1);
      const k = easeInOut(range(lt, 0, 2)); place(c, [lerp(1.4, 1.05, k), lerp(1.4, 1.3, k), lerp(-0.4, -0.55, k)], [-0.3, 1.0, 0.5]);
      return { shake: 10 * pulse(lt, 2.05, 0.25) };
    },
    fx(g, lt) {
      stamp(g, '✓ UPRIGHT', OW / 2, 220, range(lt, 0.7, 0.9), { col: '#2f9e44', rot: -0.1, size: 58 });
      if (lt > 2.0) { const p = project(o.phone.position.clone().add(V(0, 0.3, 0)), c); burst(g, p[0], p[1] - 40, 80, 'RING!', range(lt, 2.0, 2.15), { fill: '#ffffff', col: '#e0201a' }); speedLines(g, OW * 0.45, OH * 0.45, 1 - range(lt, 2.1, 2.8), lt); }
    } };
}
// ===== 10. no lying down
function s10() {
  const scene = new THREE.Scene(); const o = officeSet(scene); const s = seatSleeper(scene); const c = cam(48);
  return { scene, camera: c, update(lt) { o.clocks.forEach(k => k.draw(lt + 28)); s.position.set(0.3, 0.2, 2.45); s.rotation.set(-Math.PI / 2, 0, 0.15); s.pose({ arm: { 1: [-0.2, 0, 0.9], [-1]: [-0.2, 0, 0.9] } }); s.face('snore'); bubble(s, lt, 1); place(c, [0.95, 1.85, 2.85], [0.3, 0.2, 1.75]); return { shake: 12 * pulse(lt, 0.3, 0.2) }; },
    fx(g, lt) { redX(g, OW / 2, OH * 0.42, 190, range(lt, 0.28, 0.5)); } };
}
// ===== 11. no snoring
function s11() {
  const scene = new THREE.Scene(); const o = officeSet(scene); const s = seatSleeper(scene); const c = cam(46);
  return { scene, camera: c, update(lt) { o.clocks.forEach(k => k.draw(lt + 30)); sleepPose(s, lt, { upright: 1 }); s.face(lt < 0.4 ? 'snore' : 'shock'); bubble(s, lt * 3, lt < 0.4 ? 1.3 : 0); place(c, [0.9, 1.3, -0.5], [-0.2, 1.1, 0.55]); return { shake: 12 * pulse(lt, 0.4, 0.2) }; },
    fx(g, lt) {
      burst(g, OW * 0.55, 300, 120, 'SNOOORE', range(lt, 0.0, 0.2) * (lt < 0.4 ? 1 : 0), { fill: '#bfe3ff', col: '#1c6fd1', size: 0.3 });
      if (lt >= 0.4) { burst(g, OW / 2, 330, 130, 'BEEP!', range(lt, 0.4, 0.6), { fill: '#ff3b3b', col: '#ffffff', size: 0.42 }); }
    } };
}
// ===== 12. it helps to be important: crown
function s12() {
  const scene = new THREE.Scene(); officeSet(scene); const b = bossBean(); b.position.set(0.6, 0, -1.0); b.rotation.y = -0.3; scene.add(b); const c = cam(44);
  const spot = new THREE.SpotLight(0xfff2b0, 18, 8, 0.4, 0.6); spot.position.set(0.6, 3.1, 0.2); spot.target = b; scene.add(spot);
  return { scene, camera: c, update(lt) {
      const pop = range(lt, 1.1, 1.3);   // "important" at 32.32
      b.crown.visible = pop > 0; b.crown.position.y = 0.27 + (1 - easeOut(pop)) * 0.6; b.crown.rotation.y = lt * 1.5;
      b.pose({ lean: -0.12, squash: -0.1 * pulse(lt, 1.3, 0.2), arm: { 1: [0.2, -1.2, 0.6], [-1]: [0.2, -1.2, 0.6] } }); b.face(lt < 1.2 ? 'normal' : 'grin');
      scene.updateMatrixWorld(true); const h = b.headWorld(); place(c, [h.x - 0.2, h.y + 0.05, h.z + 1.5], [h.x, h.y - 0.25, h.z]);
      return { shake: 8 * pulse(lt, 1.3, 0.2) };
    },
    fx(g, lt) { speedLines(g, OW / 2, OH * 0.35, range(lt, 1.15, 1.3) * (1 - range(lt, 1.5, 1.8)), lt, { col: 'rgba(255,200,58,' }); stamp(g, 'VIP', OW * 0.78, 220, range(lt, 1.3, 1.45), { col: '#e8a400', size: 70 }); } };
}
// ===== 13. a boss napping in a meeting looks dedicated
function s13() {
  const scene = new THREE.Scene(); const o = meetingSet(scene); const c = cam(52);
  const b = bossBean(); b.position.set(-1.9, 0, 0); b.rotation.y = Math.PI / 2; scene.add(b); chair(scene, [-1.95, 0, 0], -Math.PI / 2);
  const team = []; for (let i = 0; i < 4; i++) { const t = bean({ suit: [0x2fa36f, 0x3a6ad0, 0x8a3a3a, 0x6a4a8a][i], tie: 0xc8202a, hair: 0x1a1a1a, hairStyle: i === 1 ? 'bun' : 'normal' }); const side = i % 2 ? 1 : -1; t.position.set(-0.6 + Math.floor(i / 2) * 1.1, 0, side * 0.95); t.rotation.y = side > 0 ? Math.PI : 0; scene.add(t); team.push(t); }
  const Z = zs(scene);
  return { scene, camera: c, update(lt) {
      o.clocks.forEach(k => k.draw(lt + 33));
      const br = Math.sin(lt * 2.2); b.pose({ sit: 1, lean: 0.1, headTilt: [0.3 + br * 0.04, 0, 0.15], arm: { 1: [-1.0, -0.8], [-1]: [-1.0, -0.8] } }); b.face('sleep'); b.bubble.visible = true; b.bubble.scale.setScalar(0.6 + 0.6 * (0.5 + 0.5 * br));
      team.forEach((t, i) => { const bow = lt > 1.0 ? Math.max(0, Math.sin((lt - 1.0) * 6 + i)) * 0.35 : 0; t.pose({ sit: 1, lean: bow, headTilt: [0.1, 0, 0] }); t.face(lt > 1.0 ? 'smile' : 'normal'); });
      scene.updateMatrixWorld(true); floatZ(Z, b.headWorld(), lt);
      const k = easeInOut(range(lt, 0, 2.6)); place(c, [lerp(1.3, 0.8, k), lerp(1.65, 1.5, k), lerp(0.3, 0.2, k)], [-1.9, 1.05, 0]);
    },
    fx(g, lt) { const h = project(b.headWorld().add(V(0, 0.55, 0)), c); burst(g, h[0] + 30, h[1] - 30, 95, 'HERO!', range(lt, 1.7, 1.9), { fill: '#ffd43b', col: '#e0201a', rot: 0.1 }); confetti(g, lt - 1.75, { n: 50, seed: 3 }); } };
}
// ===== 14. a new employee doing the same thing? not so much
function s14() {
  const scene = new THREE.Scene(); const o = meetingSet(scene); const c = cam(50);
  const n = bean({ suit: 0x9aa3ad, tie: 0xffc83a, hair: 0x2a1a10, hairStyle: 'spiky', badge: 'NEW', scale: 0.85 }); n.position.set(1.0, 0, 0.95); n.rotation.y = Math.PI; scene.add(n);
  const team = []; for (let i = 0; i < 3; i++) { const t = i === 0 ? bossBean() : bean({ suit: [0x2fa36f, 0x3a6ad0][i - 1], tie: 0xc8202a, hair: 0x1a1a1a }); t.position.set(-1.2 + i * 1.0, 0, -0.95); scene.add(t); team.push(t); }
  return { scene, camera: c, update(lt) {
      o.clocks.forEach(k => k.draw(lt + 36));
      const caught = lt > 1.6, bam = lt > 2.4;   // "same thing?" 37.12 ; "not so much" 38.0
      const br = Math.sin(lt * 2.2);
      if (!bam) { n.pose({ sit: 1, lean: -0.3 + br * 0.02, headTilt: [-0.1, 0.2, 0.35], arm: { 1: [-1.0, -0.9], [-1]: [-1.0, -0.9] } }); n.face('sleep'); n.bubble.visible = true; n.bubble.scale.setScalar(0.6 + 0.6 * (0.5 + 0.5 * br)); }
      else { n.pose({ sit: 1, lean: 0.05, bob: 0.08 * pulse(lt, 2.5, 0.15), squash: -0.2 * pulse(lt, 2.5, 0.15), arm: { 1: [-2.6, 0.2], [-1]: [-2.6, 0.2] } }); n.face('shock'); n.bubble.visible = false; }
      team.forEach((t, i) => { t.pose({ sit: 1, headTilt: [0, caught ? 0.0 : 0, 0], lean: caught ? 0.12 : 0 }); t.face(caught ? (i === 0 ? 'angry' : 'wide') : 'normal'); });
      if (!caught) { const k = easeInOut(range(lt, 0, 1.6)); place(c, [lerp(2.3, 2.0, k), 1.45, lerp(2.0, 1.7, k)], [0.9, 0.9, 0.9]); }
      else { const k = easeOut(range(lt, 1.6, 1.8)); place(c, [lerp(0.6, 0.4, k), 1.3, lerp(1.6, 1.3, k)], [-0.3, 1.1, -0.9]); }
      if (bam) place(c, [1.6, 1.25, 2.6], [1.0, 0.95, 0.9]);
      return { shake: 14 * pulse(lt, 2.45, 0.3) + 5 * pulse(lt, 1.65, 0.2) };
    },
    fx(g, lt) {
      if (lt > 1.6 && lt < 2.4) { for (const t of team) { const h = project(t.headWorld().add(V(0, 0.4, 0)), c); exclaim(g, h[0], h[1], range(lt, 1.62, 1.85)); } }
      if (lt > 2.4) { burst(g, OW / 2, 300, 140, 'BAM!', range(lt, 2.4, 2.55), { fill: '#ff3b3b', col: '#ffd43b' }); flash(g, 0.6 * (1 - range(lt, 2.4, 2.55)), '#ff3b3b'); }
    } };
}
// ===== 15. in class: tell your teacher you're practicing inemuri
function s15() {
  const scene = new THREE.Scene(); const o = classroomSet(scene); const c = cam(56);
  const kid = bean({ suit: 0xff922b, noTie: true, hair: 0x3a2a1c, hairStyle: 'spiky', scale: 0.72 }); kid.position.set(0, 0, 0.72); kid.rotation.y = Math.PI; scene.add(kid);
  const teacher = bean({ suit: 0xcc5de8, noTie: true, hair: 0x2a1a10, hairStyle: 'bun', glasses: true }); teacher.position.set(-0.9, 0, -0.9); teacher.rotation.y = 0.5; scene.add(teacher);
  const Z = zs(scene);
  return { scene, camera: c, update(lt) {
      o.clocks.forEach(k => k.draw(lt + 39));
      const angry = lt > 2.6, raise = lt > 4.0;   // "teacher" 42.40 ; "inemuri" 43.44
      const br = Math.sin(lt * 2.2);
      if (!angry) { kid.pose({ sit: 1, lean: -0.5 + br * 0.02, headTilt: [-0.1, -0.4, -0.35], arm: { 1: [-0.9, -1.0], [-1]: [-0.9, -1.0] } }); kid.face('sleep'); kid.bubble.visible = true; kid.bubble.scale.setScalar(0.6 + 0.7 * (0.5 + 0.5 * br)); }
      else { kid.pose({ sit: 1, lean: 0, bob: 0.05 * pulse(lt, 2.7, 0.15), arm: raise ? { 1: [-2.9, 0], [-1]: [-2.9, 0] } : { 1: [-0.9, -1.0], [-1]: [-0.9, -1.0] } }); kid.face(raise ? 'grin' : 'shock'); kid.bubble.visible = false; }
      const step = easeInOut(range(lt, 1.2, 2.5)); teacher.position.set(lerp(-1.6, -0.6, step), 0, lerp(-1.6, 0.0, step)); teacher.rotation.y = 0.9;
      teacher.pose({ walk: lt > 1.2 && lt < 2.5 ? lt * 9 : 0, arm: angry && !raise ? { 1: [0.1, -1.4, 0.8], [-1]: [0.1, -1.4, 0.8] } : undefined, squash: raise ? -0.12 * pulse(lt, 4.2, 0.25) : 0 });
      teacher.face(raise ? 'wide' : angry ? 'angry' : 'normal');
      scene.updateMatrixWorld(true); floatZ(Z, kid.headWorld(), lt, angry ? 0 : 1);
      const k = easeInOut(range(lt, 0, 5.4)); place(c, [lerp(1.35, 1.15, k), lerp(1.3, 1.25, k), lerp(-0.6, -0.75, k)], [-0.2, 0.78, 0.45]);
      return { shake: 8 * pulse(lt, 2.65, 0.2) + 10 * pulse(lt, 4.1, 0.25) };
    },
    fx(g, lt) {
      if (lt > 2.6 && lt < 4.0) { const h = project(teacher.headWorld().add(V(0, 0.42, 0)), c); burst(g, h[0], h[1], 70, '!!', range(lt, 2.6, 2.8), { fill: '#ff6b6b', col: '#ffffff', size: 0.6 }); }
      if (lt > 4.0) { sign(g, OW / 2, 330, range(lt, 4.0, 4.25), 'INEMURI!'); confetti(g, lt - 4.1, { n: 110, seed: 9 }); }
    } };
}

export const SHOTS = [
  { s: 0.0, e: 2.85, build: s1 }, { s: 2.85, e: 5.2, build: s2 }, { s: 5.2, e: 7.85, build: s3 }, { s: 7.85, e: 11.9, build: s4 },
  { s: 11.9, e: 16.1, build: s5 }, { s: 16.1, e: 19.4, build: s6 }, { s: 19.4, e: 22.3, build: s7 }, { s: 22.3, e: 24.3, build: s8 },
  { s: 24.3, e: 28.6, build: s9 }, { s: 28.6, e: 29.85, build: s10 }, { s: 29.85, e: 31.1, build: s11 }, { s: 31.1, e: 32.9, build: s12 },
  { s: 32.9, e: 35.5, build: s13 }, { s: 35.5, e: 38.95, build: s14 }, { s: 38.95, e: DURATION + 1, build: s15 },
];

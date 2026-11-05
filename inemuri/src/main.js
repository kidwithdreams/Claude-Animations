// Toon-style test: "Imagine falling asleep at your desk... and your boss being impressed."
import * as THREE from 'three';
import { toon, InkRenderer } from './toon.js';
import { bean } from './bean.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, kf } from './anim.js';

const W = 720, H = 1280;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').prepend(renderer.domElement);
const ink = new InkRenderer(renderer, W, H, { thick: 2.4 });

export const DURATION = 8.0;
const CAPTIONS = [[0.25, 'IMAGINE FALLING ASLEEP'], [1.6, 'AT YOUR DESK...', 3.1], [3.35, 'AND YOUR BOSS...', 5.0], [5.25, 'BEING IMPRESSED']];

// ---------------- the office ----------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe9f2);
const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const tiles = cvs(512, 512, g => { g.fillStyle = '#7fc39a'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#4e8f6a'; g.lineWidth = 5; for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { const ox = (y % 2) * 64; g.fillStyle = (x + y) % 3 ? '#86c9a1' : '#79bc93'; g.fillRect(x * 128 + ox + 3, y * 64 + 3, 122, 58); g.strokeRect(x * 128 + ox + 3, y * 64 + 3, 122, 58); } });
tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(4, 2);
const carpet = cvs(256, 256, g => { g.fillStyle = '#2449b8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#2a52c8'; g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128); g.strokeStyle = 'rgba(10,20,60,0.35)'; g.lineWidth = 3; g.strokeRect(1, 1, 254, 254); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke(); });
carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(5, 5);
const box = (w, h, d, mat, p, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(...p); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };

const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), toon(0xffffff, { map: carpet })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const wallMat = toon(0xffffff, { map: tiles });
const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat); back.position.set(0, 1.6, -3); back.receiveShadow = true; scene.add(back);
const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat); left.position.set(-3.2, 1.6, 0); left.rotation.y = Math.PI / 2; left.receiveShadow = true; scene.add(left);
const right = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat); right.position.set(3.2, 1.6, 0); right.rotation.y = -Math.PI / 2; right.receiveShadow = true; scene.add(right);
const front = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat); front.position.set(0, 1.6, 3.0); front.rotation.y = Math.PI; front.receiveShadow = true; scene.add(front);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), toon(0xf2f4f6)); ceil.position.y = 3.2; ceil.rotation.x = Math.PI / 2; scene.add(ceil);
for (const [x, z] of [[-1, -1.5], [1.2, -1.5], [-1, 0.8], [1.2, 0.8]]) box(1.0, 0.03, 0.5, new THREE.MeshBasicMaterial({ color: 0xffffff }), [x, 3.18, z]);
// skirting + door
box(10, 0.12, 0.04, toon(0x3c4a5a), [0, 0.06, -2.98]);
const frame = box(1.0, 2.15, 0.08, toon(0x5a6b80), [1.7, 1.075, -2.97]);
const doorPivot = new THREE.Group(); doorPivot.position.set(1.25, 0, -2.92); scene.add(doorPivot);
const door = box(0.88, 2.05, 0.06, toon(0x9fc3e6), [0.44, 1.025, 0], doorPivot);
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), toon(0xd8b040)); knob.position.set(0.78, 1.0, 0.05); doorPivot.add(knob);
const hall = box(0.84, 2.05, 0.02, new THREE.MeshBasicMaterial({ color: 0xfaf7ee }), [1.7, 1.03, -3.0]);
// notice board + calendar
box(0.9, 0.6, 0.04, toon(0xc8935a), [-1.6, 1.75, -2.97]);
for (let i = 0; i < 5; i++) box(0.18, 0.2, 0.01, toon([0xffffff, 0xfff3a0, 0xbfe3ff, 0xffd0d0, 0xffffff][i]), [-1.92 + i * 0.16, 1.75 + (i % 2) * 0.12 - 0.06, -2.94]);
// wall clock
const clockTex = cvs(256, 256, () => {});
const clockG = clockTex.image.getContext('2d');
function drawClock(t) {
  const g = clockG; g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
  g.lineWidth = 14; g.strokeStyle = '#c42a2a'; g.stroke();
  g.fillStyle = '#222'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88); }
  const min = (14 * 60 + 47 + t * 1.5) / 60, hr = 2 + min / 60;
  const hand = (a, len, w) => { g.lineWidth = w; g.strokeStyle = '#222'; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * len, 128 + Math.sin(a) * len); g.stroke(); };
  hand(hr / 12 * Math.PI * 2 - Math.PI / 2, 50, 9); hand((min % 1) * Math.PI * 2 - Math.PI / 2, 78, 6);
  const sec = Math.floor(t * 1) ; hand(sec / 60 * Math.PI * 2 - Math.PI / 2, 84, 2.5);
  clockTex.needsUpdate = true;
}
const clockM = new THREE.Mesh(new THREE.CircleGeometry(0.28, 48), new THREE.MeshBasicMaterial({ map: clockTex })); clockM.position.set(-0.2, 2.35, -2.95); scene.add(clockM);
box(0.62, 0.62, 0.04, toon(0xc42a2a), [-0.2, 2.35, -2.98]).geometry = new THREE.CylinderGeometry(0.31, 0.31, 0.04, 48).rotateX(Math.PI / 2);
const clock2 = new THREE.Mesh(new THREE.CircleGeometry(0.28, 48), new THREE.MeshBasicMaterial({ map: clockTex })); clock2.position.set(-1.05, 1.75, 2.95); clock2.rotation.y = Math.PI; scene.add(clock2);
const rim2 = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.04, 48).rotateX(Math.PI / 2), toon(0xc42a2a)); rim2.position.set(-1.05, 1.75, 2.98); scene.add(rim2);
// desk, chair, monitor, papers, plant
const deskMat = toon(0xd9dde2);
box(1.5, 0.06, 0.75, deskMat, [0, 0.76, 0]);
box(0.45, 0.72, 0.7, toon(0xc5cad1), [0.5, 0.37, 0]);
for (let i = 0; i < 3; i++) box(0.4, 0.2, 0.02, toon(0xd9dde2), [0.5, 0.58 - i * 0.23, 0.36]);
box(0.05, 0.72, 0.7, deskMat, [-0.7, 0.37, 0]);
box(0.5, 0.33, 0.03, toon(0x202430), [-0.3, 1.04, -0.22]); box(0.05, 0.16, 0.05, toon(0x202430), [-0.3, 0.86, -0.22]);
box(0.46, 0.29, 0.005, new THREE.MeshBasicMaterial({ color: 0x5aa0e8 }), [-0.3, 1.04, -0.204]);
box(0.3, 0.02, 0.22, toon(0xffffff), [0.25, 0.8, 0.1]); box(0.28, 0.02, 0.2, toon(0xfffbe0), [0.27, 0.815, 0.12]);
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.12, 16), toon(0xc8643c)); pot.position.set(0.6, 0.85, -0.25); scene.add(pot);
for (let i = 0; i < 5; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon(0x3f9a4a)); lf.scale.set(0.5, 1.6, 0.3); lf.position.set(0.6 + Math.sin(i * 1.3) * 0.04, 0.98, -0.25 + Math.cos(i * 1.3) * 0.04); lf.rotation.z = Math.sin(i) * 0.6; scene.add(lf); }
const chair = new THREE.Group(); chair.position.set(-0.15, 0, 0.62); scene.add(chair);
box(0.48, 0.07, 0.46, toon(0x3b3f48), [0, 0.47, 0], chair); box(0.46, 0.5, 0.06, toon(0x3b3f48), [0, 0.78, 0.24], chair);
box(0.05, 0.4, 0.05, toon(0x8a8f99), [0, 0.25, 0], chair); box(0.5, 0.04, 0.06, toon(0x8a8f99), [0, 0.05, 0], chair); box(0.06, 0.04, 0.5, toon(0x8a8f99), [0, 0.05, 0], chair);
// second desk in the background for depth
box(1.5, 0.06, 0.75, deskMat, [-1.6, 0.76, -1.8]); box(0.05, 0.72, 0.7, deskMat, [-2.3, 0.37, -1.8]); box(0.05, 0.72, 0.7, deskMat, [-0.9, 0.37, -1.8]);
box(0.5, 0.33, 0.03, toon(0x202430), [-1.6, 1.04, -2.0]);
box(0.6, 0.35, 0.4, toon(0xb98a52), [2.2, 0.175, -2.3]); box(0.5, 0.3, 0.36, toon(0xc79a62), [2.2, 0.5, -2.3]);
// lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 1.3));
const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-2, 5, 3); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = sc.bottom = -4; sc.right = sc.top = 4; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
scene.add(sun);
// a yellow sun-patch on the wall, like the reference
const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.45, depthWrite: false })); patch.position.set(-1.6, 1.6, -2.96); patch.rotation.z = 0.35; patch.userData.noInk = true; scene.add(patch);

// ---------------- characters ----------------
const sleeper = bean({ suit: 0x2fa36f, tie: 0x2b3a5c, hair: 0x5a3a1e }); sleeper.position.set(-0.15, 0.0, 0.58); sleeper.rotation.y = Math.PI; scene.add(sleeper);
sleeper.rotation.y = 0;   // facing the desk (-z)... the desk is at -z, so face -z
sleeper.rotation.y = Math.PI;
const boss = bean({ suit: 0x1f2a44, tie: 0xc8202a, grey: true }); scene.add(boss);
// floating Z's and sparkles (sprites, no ink)
const spriteTex = (draw) => cvs(128, 128, draw);
const zTex = spriteTex(g => { g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1a22'; g.lineWidth = 10; g.font = '900 100px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('Z', 64, 68); g.fillText('Z', 64, 68); });
const zs = [0, 1, 2].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false })); scene.add(s); return s; });
const starTex = spriteTex(g => { g.fillStyle = '#ffd43b'; g.strokeStyle = '#1a1a22'; g.lineWidth = 6; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 22 : 54; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); });
const stars = [0, 1, 2, 3, 4].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false })); scene.add(s); return s; });

const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 100);
const place = (p, l) => { camera.position.set(...p); camera.lookAt(...l); };
const shake = (t, a) => [Math.sin(t * 13.1) * a, Math.sin(t * 17.3 + 1) * a];

// ---------------- timeline ----------------
const capEl = document.getElementById('cap');
window.DURATION = DURATION;
window.renderAt = (t) => {
  drawClock(t);
  // the sleeper: head on one side, slow breathing
  const br = Math.sin(t * 2.2);
  sleeper.pose({ sit: 1, lean: -0.42 + br * 0.015, headTilt: [-0.15 + br * 0.03, -0.45, -0.38], arm: { 1: [-0.85, -1.05], [-1]: [-0.8, -1.1] } });
  sleeper.face('sleep');
  // the boss: door opens at 3.2, he walks in, stops, stares, then grins
  const open = easeOut(range(t, 3.15, 3.6));
  doorPivot.rotation.y = 1.4 * open;
  const wk = easeInOut(range(t, 3.35, 4.6));
  const bp = V(lerp(1.7, 1.05, wk), 0, lerp(-2.7, -1.0, wk));
  boss.position.copy(bp);
  boss.rotation.y = Math.atan2(sleeper.position.x - bp.x, sleeper.position.z - bp.z) * smooth(range(t, 4.2, 4.8)) + (1 - smooth(range(t, 4.2, 4.8))) * 0.35;
  const walking = t > 3.35 && t < 4.6;
  const nod = t > 5.3 ? Math.max(0, Math.sin((t - 5.3) * 9)) * 0.16 * (1 - range(t, 6.8, 7.4)) : 0;
  boss.pose({ walk: walking ? t * 9 : 0, bob: walking ? Math.abs(Math.sin(t * 9)) * 0.02 : 0, headTilt: [nod, 0, 0], arm: t > 5.3 ? { 1: [-0.3, -1.6], [-1]: [-0.3, -1.6] } : undefined });
  boss.visible = t > 3.1;
  boss.face(t < 4.5 ? 'normal' : t < 5.25 ? 'wide' : 'grin', 0);
  // Z's rise from the sleeper
  scene.updateMatrixWorld(true);
  const hp = sleeper.headWorld();
  zs.forEach((z, i) => { const a = ((t * 0.5 + i / 3) % 1); z.position.set(hp.x + 0.12 + a * 0.25, hp.y + 0.2 + a * 0.6, hp.z - 0.05); z.scale.setScalar(0.08 + a * 0.12); z.material.opacity = Math.sin(Math.PI * a); z.material.rotation = 0.2 * Math.sin(t * 3 + i); });
  // sparkles around the boss when he's impressed
  const bh = boss.headWorld();
  stars.forEach((s, i) => { const a = clamp((t - 5.3 - i * 0.12) / 0.5); const ang = i / 5 * Math.PI * 2 + t * 0.8; s.position.set(bh.x + Math.cos(ang) * 0.38, bh.y + 0.05 + Math.sin(ang) * 0.32, bh.z + 0.1); s.scale.setScalar(0.12 * Math.sin(Math.PI * Math.min(1, a)) + (a >= 1 ? 0.06 + 0.02 * Math.sin(t * 8 + i) : 0)); s.visible = a > 0; });
  // cameras
  if (t < 3.15) { const k = easeInOut(range(t, 0, 3.15)); place([lerp(1.25, 0.95, k), lerp(1.45, 1.3, k), lerp(-0.9, -0.6, k)], [lerp(-0.25, -0.2, k), lerp(1.15, 1.05, k), 0.6]); }
  else if (t < 5.0) { const s = shake(t, 0.004); place([-1.25 + s[0], 1.35 + s[1], 1.75], [0.7, 1.05, -1.4]); }
  else { const k = easeOut(range(t, 5.0, 6.0)); const dir = V(sleeper.position.x - boss.position.x, 0, sleeper.position.z - boss.position.z).normalize(); const p = bh.clone().addScaledVector(dir, lerp(1.6, 1.25, k)).add(V(0.15, -0.05, 0)); place([p.x, p.y, p.z], [bh.x, bh.y - 0.06, bh.z]); }
  camera.updateProjectionMatrix();
  ink.render(scene, camera, t);
  const c = CAPTIONS.filter(c => t >= c[0]).pop();
  capEl.textContent = c && (c[2] == null || t < c[2]) ? c[1] : '';
};
window.ready = document.fonts.ready.then(() => true);
const qs = new URLSearchParams(location.search);
if (qs.has('t')) window.ready.then(() => window.renderAt(parseFloat(qs.get('t'))));

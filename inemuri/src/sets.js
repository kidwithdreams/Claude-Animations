// Sets for the toon office story: office, meeting room, train, classroom, Japan (flag + Fuji).
import * as THREE from 'three';
import { toon } from './toon.js';

export const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), c); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
export const box = (parent, w, h, d, mat, p, r = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(...p); m.rotation.set(...r); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
const tileTex = (base, line, rep = [4, 2]) => { const t = cvs(512, 512, g => { g.fillStyle = base[0]; g.fillRect(0, 0, 512, 512); g.strokeStyle = line; g.lineWidth = 5; for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { const ox = (y % 2) * 64; g.fillStyle = base[(x + y) % base.length]; g.fillRect(x * 128 + ox + 3, y * 64 + 3, 122, 58); g.strokeRect(x * 128 + ox + 3, y * 64 + 3, 122, 58); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); return t; };
const carpetTex = (a = '#2449b8', b = '#2a52c8', rep = 5) => { const t = cvs(256, 256, g => { g.fillStyle = a; g.fillRect(0, 0, 256, 256); g.fillStyle = b; g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128); g.strokeStyle = 'rgba(10,20,60,0.35)'; g.lineWidth = 3; g.strokeRect(1, 1, 254, 254); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke(); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t; };

export function lights(scene, { hemi = 1.3, sun = 2.2, pos = [-2, 5, 3], size = 4 } = {}) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, hemi));
  const s = new THREE.DirectionalLight(0xffffff, sun); s.position.set(...pos); s.castShadow = true;
  s.shadow.mapSize.set(2048, 2048); const c = s.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; s.shadow.bias = -0.0005; s.shadow.normalBias = 0.03;
  scene.add(s); return s;
}
function room(scene, { wall = ['#86c9a1', '#79bc93', '#7fc39a'], line = '#4e8f6a', floorA = '#2449b8', floorB = '#2a52c8', w = 6.4, d = 6 } = {}) {
  const wm = toon(0xffffff, { map: tileTex(wall, line) });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w + 2, d + 2), toon(0xffffff, { map: carpetTex(floorA, floorB) })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  const mk = (W, p, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(W, 3.2), wm); m.position.set(...p); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); };
  mk(w + 2, [0, 1.6, -d / 2], 0); mk(w + 2, [0, 1.6, d / 2], Math.PI); mk(d + 2, [-w / 2, 1.6, 0], Math.PI / 2); mk(d + 2, [w / 2, 1.6, 0], -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w + 2, d + 2), toon(0xf2f4f6)); ceil.position.y = 3.2; ceil.rotation.x = Math.PI / 2; scene.add(ceil);
  for (const [x, z] of [[-1, -1.5], [1.2, -1.5], [-1, 0.8], [1.2, 0.8]]) box(scene, 1.0, 0.03, 0.5, new THREE.MeshBasicMaterial({ color: 0xffffff }), [x, 3.18, z]);
  box(scene, w + 2, 0.12, 0.04, toon(0x3c4a5a), [0, 0.06, -d / 2 + 0.02]);
}
export function wallClock(parent, p, ry = 0, r = 0.28) {
  const tex = cvs(256, 256, () => {});
  const g = tex.image.getContext('2d');
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(...p); m.rotation.y = ry; parent.add(m);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.04, 48).rotateX(Math.PI / 2), toon(0xc42a2a)); rim.position.set(...p); rim.rotation.y = ry; rim.translateZ(-0.03); parent.add(rim);
  m.draw = (t, base = 14 * 60 + 47, speed = 1.5) => {
    g.clearRect(0, 0, 256, 256); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
    g.fillStyle = '#222'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88); }
    const min = (base + t * speed) / 60, hr = (min / 60) % 12;
    const hand = (a, len, w) => { g.lineWidth = w; g.strokeStyle = '#222'; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * len, 128 + Math.sin(a) * len); g.stroke(); };
    hand(hr / 12 * Math.PI * 2 - Math.PI / 2, 50, 9); hand((min % 1) * Math.PI * 2 - Math.PI / 2, 78, 6); hand(Math.floor(t) / 60 * Math.PI * 2 - Math.PI / 2, 84, 2.5);
    tex.needsUpdate = true;
  };
  return m;
}
export function desk(parent, p, ry = 0, { monitor = true, plant = false } = {}) {
  const d = new THREE.Group(); d.position.set(...p); d.rotation.y = ry; parent.add(d);
  const dm = toon(0xd9dde2);
  box(d, 1.5, 0.06, 0.75, dm, [0, 0.76, 0]); box(d, 0.45, 0.72, 0.7, toon(0xc5cad1), [0.5, 0.37, 0]);
  for (let i = 0; i < 3; i++) box(d, 0.4, 0.2, 0.02, dm, [0.5, 0.58 - i * 0.23, 0.36]);
  box(d, 0.05, 0.72, 0.7, dm, [-0.7, 0.37, 0]);
  if (monitor) { box(d, 0.5, 0.33, 0.03, toon(0x202430), [-0.3, 1.04, -0.22]); box(d, 0.05, 0.16, 0.05, toon(0x202430), [-0.3, 0.86, -0.22]); box(d, 0.46, 0.29, 0.005, new THREE.MeshBasicMaterial({ color: 0x5aa0e8 }), [-0.3, 1.04, -0.204]); }
  box(d, 0.3, 0.02, 0.22, toon(0xffffff), [0.25, 0.8, 0.1]); box(d, 0.28, 0.02, 0.2, toon(0xfffbe0), [0.27, 0.815, 0.12]);
  if (plant) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.12, 16), toon(0xc8643c)); pot.position.set(0.6, 0.85, -0.25); d.add(pot); for (let i = 0; i < 5; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon(0x3f9a4a)); lf.scale.set(0.5, 1.6, 0.3); lf.position.set(0.6 + Math.sin(i * 1.3) * 0.04, 0.98, -0.25 + Math.cos(i * 1.3) * 0.04); lf.rotation.z = Math.sin(i) * 0.6; d.add(lf); } }
  return d;
}
export function chair(parent, p, ry = 0) {
  const c = new THREE.Group(); c.position.set(...p); c.rotation.y = ry; parent.add(c);
  box(c, 0.48, 0.07, 0.46, toon(0x3b3f48), [0, 0.47, 0]); box(c, 0.46, 0.5, 0.06, toon(0x3b3f48), [0, 0.78, 0.24]);
  box(c, 0.05, 0.4, 0.05, toon(0x8a8f99), [0, 0.25, 0]); box(c, 0.5, 0.04, 0.06, toon(0x8a8f99), [0, 0.05, 0]); box(c, 0.06, 0.04, 0.5, toon(0x8a8f99), [0, 0.05, 0]);
  return c;
}
export function phone(parent, p) {
  const g = new THREE.Group(); g.position.set(...p); parent.add(g);
  box(g, 0.2, 0.06, 0.16, toon(0xe8e8ea), [0, 0.03, 0]); box(g, 0.22, 0.05, 0.05, toon(0x2a2a30), [0, 0.08, -0.05]);
  return g;
}

// ---------------- full sets ----------------
export function officeSet(scene) {
  scene.background = new THREE.Color(0xdfe9f2);
  room(scene);
  const frame = box(scene, 1.0, 2.15, 0.08, toon(0x5a6b80), [1.7, 1.075, -2.97]);
  const doorPivot = new THREE.Group(); doorPivot.position.set(1.25, 0, -2.92); scene.add(doorPivot);
  box(doorPivot, 0.88, 2.05, 0.06, toon(0x9fc3e6), [0.44, 1.025, 0]);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), toon(0xd8b040)); knob.position.set(0.78, 1.0, 0.05); doorPivot.add(knob);
  box(scene, 0.84, 2.05, 0.02, new THREE.MeshBasicMaterial({ color: 0xfaf7ee }), [1.7, 1.03, -3.0]);
  box(scene, 0.9, 0.6, 0.04, toon(0xc8935a), [-1.6, 1.75, -2.97]);
  for (let i = 0; i < 5; i++) box(scene, 0.18, 0.2, 0.01, toon([0xffffff, 0xfff3a0, 0xbfe3ff, 0xffd0d0, 0xffffff][i]), [-1.92 + i * 0.16, 1.75 + (i % 2) * 0.12 - 0.06, -2.94]);
  const clocks = [wallClock(scene, [-0.2, 2.35, -2.95]), wallClock(scene, [-1.05, 1.75, 2.95], Math.PI)];
  desk(scene, [0, 0, 0], 0, { plant: true }); chair(scene, [-0.15, 0, 0.62]);
  desk(scene, [-1.6, 0, -1.8]); desk(scene, [1.8, 0, 1.6], Math.PI);
  // partition for peeking coworkers
  box(scene, 1.6, 1.25, 0.06, toon(0x7b8aa0), [-1.6, 0.62, -1.2]);
  box(scene, 0.6, 0.35, 0.4, toon(0xb98a52), [2.2, 0.175, -2.3]); box(scene, 0.5, 0.3, 0.36, toon(0xc79a62), [2.2, 0.5, -2.3]);
  const ph = phone(scene, [-0.62, 0.79, 0.15]);
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.45, depthWrite: false })); patch.position.set(-1.6, 1.6, -2.96); patch.rotation.z = 0.35; patch.userData.noInk = true; scene.add(patch);
  lights(scene);
  return { doorPivot, clocks, phone: ph };
}
export function meetingSet(scene) {
  scene.background = new THREE.Color(0xdfe9f2);
  room(scene, { wall: ['#d9c8a6', '#cfbd98', '#d4c39f'], line: '#a8936c', floorA: '#6a4a8a', floorB: '#74529a' });
  const t = toon(0x8a5a3a);
  box(scene, 3.4, 0.08, 1.2, t, [0, 0.76, 0]); for (const x of [-1.5, 1.5]) for (const z of [-0.45, 0.45]) box(scene, 0.07, 0.72, 0.07, t, [x, 0.37, z]);
  for (let i = 0; i < 6; i++) { box(scene, 0.22, 0.02, 0.3, toon(0xffffff), [-1.2 + i * 0.48, 0.81, (i % 2 ? 0.3 : -0.3)]); }
  // whiteboard with a chart
  const wb = cvs(512, 320, g => { g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, 512, 320); g.strokeStyle = '#2a6ad0'; g.lineWidth = 8; g.beginPath(); g.moveTo(40, 260); g.lineTo(140, 200); g.lineTo(240, 220); g.lineTo(340, 120); g.lineTo(460, 60); g.stroke(); g.fillStyle = '#e03a3a'; g.font = '900 40px sans-serif'; g.fillText('Q3 ↑', 40, 60); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), toon(0xffffff, { map: wb })); board.position.set(0, 1.75, -2.96); scene.add(board);
  box(scene, 1.7, 1.1, 0.04, toon(0x9aa3ad), [0, 1.75, -2.99]);
  const clk = wallClock(scene, [2.0, 2.3, -2.95]);
  lights(scene, { pos: [-1, 5, 3] });
  return { clocks: [clk] };
}
export function trainSet(scene) {
  scene.background = new THREE.Color(0x9ec8ee);
  const inner = toon(0xe8ecef), seat = toon(0x3a6ad0), pole = toon(0xc8ccd2);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), toon(0x8a8f99)); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), inner); ceil.rotation.x = Math.PI / 2; ceil.position.y = 2.3; scene.add(ceil);
  // walls with windows (the city scrolls past behind)
  const city = cvs(1024, 256, g => { g.fillStyle = '#9ec8ee'; g.fillRect(0, 0, 1024, 256); for (let i = 0; i < 40; i++) { const x = i * 26 + (i % 3) * 7, h = 60 + (i * 53 % 140); g.fillStyle = ['#7a8ca8', '#8c9cb6', '#6a7c98'][i % 3]; g.fillRect(x, 256 - h, 24, h); g.fillStyle = '#ffe9a0'; for (let k = 0; k < h / 22; k++) g.fillRect(x + 6, 256 - h + 8 + k * 22, 5, 7); } });
  city.wrapS = THREE.RepeatWrapping; city.repeat.set(2, 1);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.9), new THREE.MeshBasicMaterial({ map: city })); win.position.set(0, 1.45, -1.52); scene.add(win);
  for (const z of [-1.5, 1.5]) {
    const w = new THREE.Group(); scene.add(w);
    box(w, 14, 1.0, 0.05, inner, [0, 0.5, z]); box(w, 14, 0.5, 0.05, inner, [0, 2.05, z]);
    for (let i = -6; i <= 6; i++) box(w, 0.12, 0.9, 0.06, inner, [i * 1.1, 1.45, z]);
    box(w, 14, 0.12, 0.45, seat, [0, 0.45, z * 0.82]); box(w, 14, 0.45, 0.08, seat, [0, 0.72, z * 0.95]);
  }
  for (let i = -5; i <= 5; i += 2.5) box(scene, 0.04, 2.3, 0.04, pole, [i, 1.15, 0]);
  box(scene, 14, 0.04, 0.04, pole, [0, 2.0, 0.6]); box(scene, 14, 0.04, 0.04, pole, [0, 2.0, -0.6]);
  for (let i = -6; i <= 6; i += 0.6) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 16), pole); r.position.set(i, 1.82, 0.6); scene.add(r); }
  lights(scene, { pos: [-1, 4, 2], size: 6 });
  return { city };
}
export function classroomSet(scene) {
  scene.background = new THREE.Color(0xe8eef4);
  room(scene, { wall: ['#f3d9a8', '#ecd09c', '#f0d6a3'], line: '#c4a46a', floorA: '#b98a5a', floorB: '#c49464' });
  const cb = cvs(1024, 400, g => { g.fillStyle = '#2f5d46'; g.fillRect(0, 0, 1024, 400); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = '700 70px sans-serif'; g.fillText('2 + 2 = 4', 80, 140); g.font = '700 54px sans-serif'; g.fillText('MATH TEST TODAY!', 80, 260); g.lineWidth = 6; g.beginPath(); g.moveTo(80, 290); g.lineTo(640, 290); g.stroke(); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.0), toon(0xffffff, { map: cb })); board.position.set(0, 1.7, -2.96); scene.add(board);
  box(scene, 2.75, 1.15, 0.04, toon(0x8a5a3a), [0, 1.7, -2.99]);
  const sd = toon(0xd8a868);
  const studentDesk = (x, z) => { box(scene, 0.7, 0.05, 0.5, sd, [x, 0.62, z]); for (const dx of [-0.3, 0.3]) for (const dz of [-0.2, 0.2]) box(scene, 0.04, 0.6, 0.04, toon(0x8a8f99), [x + dx, 0.3, z + dz]); box(scene, 0.4, 0.04, 0.4, toon(0x3a6ad0), [x, 0.38, z + 0.55]); box(scene, 0.4, 0.4, 0.04, toon(0x3a6ad0), [x, 0.6, z + 0.75]); };
  for (const [x, z] of [[-1.3, 0.2], [0, 0.2], [1.3, 0.2], [-1.3, 1.6], [1.3, 1.6]]) studentDesk(x, z);
  const clk = wallClock(scene, [2.1, 2.35, -2.95]);
  lights(scene, { pos: [-1, 5, 4] });
  return { clocks: [clk] };
}
export function japanSet(scene) {
  scene.background = new THREE.Color(0x8fd0ff);
  // ground + Fuji + flag on a pole
  const gr = new THREE.Mesh(new THREE.CircleGeometry(30, 64), toon(0x7cc36a)); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; scene.add(gr);
  const fuji = new THREE.Mesh(new THREE.ConeGeometry(9, 6, 48, 1, true), toon(0x5a6a9a)); fuji.position.set(2, 3, -22); scene.add(fuji);
  const snow = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.15, 48), toon(0xffffff)); snow.position.set(2, 4.93, -22); scene.add(snow);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 4.2, 16), toon(0xd8dde4)); pole.position.set(-1.0, 2.1, 0); scene.add(pole);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), toon(0xffc83a)); ball.position.set(-1.0, 4.25, 0); scene.add(ball);
  const ft = cvs(600, 400, g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 600, 400); g.fillStyle = '#bc002d'; g.beginPath(); g.arc(300, 200, 120, 0, 7); g.fill(); });
  const fg = new THREE.PlaneGeometry(2.4, 1.6, 40, 20); fg.translate(1.2, 0, 0);
  const flag = new THREE.Mesh(fg, toon(0xffffff, { map: ft, side: THREE.DoubleSide })); flag.position.set(-0.98, 3.4, 0); scene.add(flag);
  const base = fg.attributes.position.array.slice();
  flag.wave = (t) => { const p = fg.attributes.position; for (let i = 0; i < p.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; p.setZ(i, Math.sin(x * 2.6 - t * 6) * 0.18 * (x / 2.4) + Math.sin(y * 2 + t * 3) * 0.03 * (x / 2.4)); } p.needsUpdate = true; fg.computeVertexNormals(); };
  // cherry trees
  for (const [x, z] of [[2.6, -1.5], [-3.2, -3], [4.5, -5]]) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.4, 10), toon(0x6b4a2c)); tr.position.set(x, 0.7, z); scene.add(tr);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.55 + (i % 3) * 0.12, 18, 14), toon(0xf6b8cc)); b.position.set(x + Math.sin(i * 1.7) * 0.5, 1.7 + (i % 2) * 0.3, z + Math.cos(i * 1.7) * 0.4); scene.add(b); }
  }
  lights(scene, { pos: [-3, 6, 4], size: 6 });
  return { flag };
}

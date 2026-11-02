// Props for "Why Onions Make You Cry": onion, knife, hand, kitchen, cells, eye, nerves, brain, tear gland, fridge, gas.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { materials } from './materials.js';
import { rng, glowTexture } from './textures.js';

export const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const cv = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const ctex = (c, srgb = true, rep) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
};

// ---------------- onion ----------------
const OH = 0.092, OR = 0.044;
const PROFILE = [[0, 0], [0.01, 0.002], [0.026, 0.009], [0.038, 0.022], [0.0435, 0.038], [0.042, 0.052], [0.035, 0.066], [0.022, 0.078], [0.009, 0.086], [0.003, 0.09], [0, 0.092]];
function profilePts(n = 40) {
  const c = new THREE.SplineCurve(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)));
  return c.getPoints(n).map(p => new THREE.Vector2(Math.max(0, p.x), p.y));
}
let _onionTex = null;
function onionTextures() {
  if (_onionTex) return _onionTex;
  // cut face: nested onion-shaped layers
  const W = 512, H = Math.round(512 * OH / (2 * OR));
  const [c, g] = cv(W, H);
  const P = profilePts(60);
  const toPx = (r, y, s) => { const root = 0.006; const yy = root + (y - root) * s; return [(r * s + OR) / (2 * OR) * W, (1 - yy / OH) * H]; };
  const path = (s) => {
    g.beginPath();
    P.forEach(([r, y], i) => { const [x, yy] = toPx(r, y, s); i ? g.lineTo(x, yy) : g.moveTo(x, yy); });
    for (let i = P.length - 1; i >= 0; i--) { const [x, yy] = toPx(-P[i].x, P[i].y, s); g.lineTo(x, yy); }
    g.closePath();
  };
  const N = 11;
  for (let k = N; k >= 1; k--) {
    const s = k / N;
    path(s);
    const outer = k === N;
    g.fillStyle = outer ? '#c79a55' : (k % 2 ? '#f4efd8' : '#ece8c8');
    g.fill();
    if (!outer) {
      const gr = g.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, W * 0.6 * s);
      gr.addColorStop(0, 'rgba(255,255,240,0.0)'); gr.addColorStop(1, 'rgba(210,220,150,0.35)');
      g.fillStyle = gr; g.fill();
    }
    g.lineWidth = outer ? 3 : 2.2; g.strokeStyle = outer ? 'rgba(120,70,30,0.9)' : 'rgba(170,175,110,0.75)'; g.stroke();
    if (k === N - 1) { g.lineWidth = 6; g.strokeStyle = 'rgba(230,225,190,0.9)'; g.stroke(); }
  }
  // core + root plate
  g.fillStyle = 'rgba(200,215,140,0.8)';
  g.beginPath(); g.ellipse(W / 2, H * 0.88, W * 0.11, H * 0.035, 0, 0, Math.PI * 2); g.fill();
  // wet speckle highlights
  const r = rng(4);
  for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(255,255,255,${0.08 + r() * 0.15})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  const cut = ctex(c);
  // papery skin: vertical streaks
  const [c2, g2] = cv(512, 256);
  g2.fillStyle = '#b06f2c'; g2.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512; g2.strokeStyle = `rgba(${r() < 0.5 ? '90,45,15' : '235,180,110'},${0.15 + r() * 0.35})`;
    g2.lineWidth = 0.6 + r() * 2.2; g2.beginPath(); g2.moveTo(x, 0); g2.bezierCurveTo(x + r() * 8 - 4, 90, x + r() * 8 - 4, 170, x + r() * 6 - 3, 256); g2.stroke();
  }
  const skin = ctex(c2);
  const [c3, g3] = cv(256, 128);
  g3.fillStyle = '#808080'; g3.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 140; i++) { const x = r() * 256; g3.strokeStyle = r() < 0.5 ? '#5a5a5a' : '#a8a8a8'; g3.lineWidth = 0.5 + r() * 1.5; g3.beginPath(); g3.moveTo(x, 0); g3.lineTo(x + r() * 4 - 2, 128); g3.stroke(); }
  const bump = ctex(c3, false);
  _onionTex = { cut, skin, bump };
  return _onionTex;
}
let _onionMats = null;
export function onionMaterials() {
  if (_onionMats) return _onionMats;
  const T = onionTextures();
  _onionMats = {
    skin: new THREE.MeshPhysicalMaterial({ map: T.skin, bumpMap: T.bump, bumpScale: 1.2, roughness: 0.5, sheen: 0.8, sheenColor: new THREE.Color(0xffd29a), sheenRoughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    cut: new THREE.MeshPhysicalMaterial({ map: T.cut, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.3, sheenColor: new THREE.Color(0xffffff), emissive: new THREE.Color(0x2a2a18), side: THREE.DoubleSide }),
    root: new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.9 }),
  };
  return _onionMats;
}
// half onion: shell on +x side, cut face in the x=0 plane facing -x. Origin = root (bottom centre).
export function onionHalf(side = 1) {
  const M = onionMaterials();
  const g = new THREE.Group();
  const pts = profilePts(40);
  const shell = new THREE.Mesh(new THREE.LatheGeometry(pts, 48, 0, Math.PI), M.skin);
  g.add(shell);
  // cut face from the mirrored profile
  const sh = new THREE.Shape();
  pts.forEach((p, i) => i ? sh.lineTo(p.x, p.y) : sh.moveTo(p.x, p.y));
  for (let i = pts.length - 1; i >= 0; i--) sh.lineTo(-pts[i].x, pts[i].y);
  const fg = new THREE.ShapeGeometry(sh, 24);
  const uv = fg.attributes.uv, pos = fg.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + OR) / (2 * OR), pos.getY(i) / OH);
  fg.rotateY(-Math.PI / 2);
  const face = new THREE.Mesh(fg, M.cut); face.position.x = -0.0002; g.add(face);
  g.face = face;
  // tuft + root hairs
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.018, 8, 1, false, 0, Math.PI), M.skin);
  tip.position.y = 0.098; g.add(tip);
  const root = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 8, 0, Math.PI), M.root);
  root.scale.y = 0.35; g.add(root);
  if (side < 0) g.rotation.y = Math.PI;
  return shadow(g);
}
// whole onion made of two halves; .split(d) separates them along x, .halves = [right, left]
export function onion() {
  const g = new THREE.Group();
  const a = onionHalf(1), b = onionHalf(-1);
  g.add(a, b);
  g.halves = [a, b];
  g.split = (d, tilt = 0) => { a.position.x = d; b.position.x = -d; a.rotation.z = -tilt; b.rotation.z = tilt; };
  return g;
}

// ---------------- knife + hand ----------------
export function chefKnife() {
  const M = materials();
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(0.15, 0); s.quadraticCurveTo(0.2, 0.004, 0.225, 0.036); s.lineTo(0.2, 0.042); s.lineTo(0, 0.048); s.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.0012, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0012, bevelSegments: 2, curveSegments: 24 });
  geo.translate(0, 0.0012, -0.0006);
  const [bc, bg2] = cv(256, 64);
  const grd = bg2.createLinearGradient(0, 0, 0, 64); grd.addColorStop(0, '#f4f6f8'); grd.addColorStop(0.55, '#c9ced6'); grd.addColorStop(0.8, '#e9edf2'); grd.addColorStop(1, '#ffffff');
  bg2.fillStyle = grd; bg2.fillRect(0, 0, 256, 64);
  const br = rng(19); for (let i = 0; i < 200; i++) { bg2.fillStyle = `rgba(${br() < 0.5 ? '255,255,255' : '120,125,135'},0.12)`; bg2.fillRect(0, br() * 64, 256, 0.6); }
  const bladeTex = ctex(bc); bladeTex.repeat.set(1 / 0.225, 1 / 0.048);
  const bladeMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: bladeTex, metalness: 0.75, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.08, envMapIntensity: 1.6 });
  const blade = new THREE.Mesh(geo, bladeMat); g.add(blade);
  // edge bevel line (bright)
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.0025, 0.0032), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05 }));
  edge.position.set(0.075, 0.0016, 0); g.add(edge);
  const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.009), M.steel); bolster.position.set(-0.004, 0.033, 0); g.add(bolster);
  const handleMat = new THREE.MeshPhysicalMaterial({ color: 0x1c1a1a, roughness: 0.35, clearcoat: 0.6 });
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.0115, 0.11, 6, 16), handleMat);
  handle.rotation.z = Math.PI / 2; handle.scale.set(1.25, 1, 0.8); handle.position.set(-0.068, 0.034, 0); g.add(handle);
  for (const x of [-0.035, -0.07, -0.105]) { const rv = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.0195, 12), M.steelBright); rv.rotation.x = Math.PI / 2; rv.position.set(x, 0.034, 0); g.add(rv); }
  g.blade = blade; g.bladeMat = bladeMat;
  g.tip = new THREE.Vector3(0.225, 0.036, 0);
  return shadow(g);
}
// a right hand gripping the knife handle, forearm going back (-x, +y)
export function knifeHand() {
  const M = materials();
  const g = new THREE.Group();
  const k = chefKnife(); g.add(k); g.knife = k;
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.042, 32, 24), M.skin);
  palm.scale.set(1.35, 0.85, 0.75); palm.position.set(-0.07, 0.056, -0.012); g.add(palm);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.0165, 0.0095, 10, 18, Math.PI * 1.2), M.skin);
    f.position.set(-0.04 - i * 0.021, 0.034, 0.004); f.rotation.set(0, 0, Math.PI * 0.5); f.rotation.y = 0.0;
    f.rotation.set(Math.PI / 2, 0, 0); f.rotation.order = 'YXZ'; f.rotation.y = Math.PI / 2;
    g.add(f);
  }
  const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.04, 6, 12), M.skin);
  th.position.set(-0.02, 0.045, 0.014); th.rotation.set(0.3, 0, -1.25); g.add(th);
  const fa = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.3, 8, 20), M.skin);
  fa.position.set(-0.24, 0.12, -0.02); fa.rotation.z = 1.15; g.add(fa);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 24, 1, true), materials().cloth);
  sleeve.position.set(-0.36, 0.18, -0.02); sleeve.rotation.z = 1.15; g.add(sleeve);
  return shadow(g);
}

// ---------------- kitchen ----------------
let _tileTex = null;
function tileTex() {
  if (_tileTex) return _tileTex;
  const [c, g] = cv(512, 512);
  g.fillStyle = '#c9c4ba'; g.fillRect(0, 0, 512, 512);
  const r = rng(8);
  for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
    const ox = (y % 2) * 64;
    const v = 238 + Math.floor(r() * 12);
    g.fillStyle = `rgb(${v},${v - 3},${v - 8})`;
    g.beginPath(); g.roundRect(x * 128 + ox + 3, y * 64 + 3, 122, 58, 8); g.fill();
  }
  _tileTex = ctex(c, true, [3, 3]);
  return _tileTex;
}
export function kitchen({ counterY = 0.9, wallZ = -0.55, warm = true } = {}) {
  const M = materials();
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(4, 0.04, 1.4), new THREE.MeshPhysicalMaterial({ color: 0xe9e4da, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3 }));
  top.position.set(0, counterY - 0.02, wallZ + 0.7); top.receiveShadow = true; g.add(top);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(4, counterY - 0.04, 1.3), new THREE.MeshStandardMaterial({ color: 0x5f7f73, roughness: 0.6 }));
  cab.position.set(0, (counterY - 0.04) / 2, wallZ + 0.65); g.add(cab);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ map: tileTex(), roughness: 0.3 }));
  wall.position.set(0, counterY + 1.0, wallZ); wall.receiveShadow = true; g.add(wall);
  const board = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.024, 0.28, 3, 0.006), M.wood);
  board.position.set(0, counterY + 0.012, wallZ + 0.85); g.add(board);
  g.boardTop = counterY + 0.024; g.boardPos = board.position;
  // a plant and a pot for depth
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0xc8643c, roughness: 0.8 }));
  pot.position.set(0.55, counterY + 0.06, wallZ + 0.2); g.add(pot);
  const r = rng(12);
  for (let i = 0; i < 9; i++) {
    const lf = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.6 }));
    lf.scale.set(0.45, 1.6, 0.25); lf.position.set(0.55 + (r() - 0.5) * 0.08, counterY + 0.17 + r() * 0.06, wallZ + 0.2 + (r() - 0.5) * 0.08); lf.rotation.set(r() - 0.5, r() * 3, (r() - 0.5) * 1.2); g.add(lf);
  }
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 24), new THREE.MeshPhysicalMaterial({ color: 0xddeeff, roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1 }));
  jar.position.set(-0.5, counterY + 0.08, wallZ + 0.18); g.add(jar);
  shadow(g); wall.castShadow = false;
  return g;
}
export function kitchenSky(scene, warm = true) {
  const u = scene.userData.sky.material.uniforms;
  if (warm) { u.top.value.set(0xf3e2c8); u.mid.value.set(0xf6e8d4); u.horizon.value.set(0xfbf1e2); u.floorC.value.set(0xe9dcc6); }
}
export function darkSky(scene, top, mid, hor, floor) {
  const u = scene.userData.sky.material.uniforms;
  u.top.value.set(top); u.mid.value.set(mid); u.horizon.value.set(hor); u.floorC.value.set(floor ?? hor);
  scene.children.forEach(c => { if (c.material && c.material.isShadowMaterial) c.visible = false; });
}

// ---------------- soft particles (gas, mist, frost, motes) ----------------
let _soft = null;
export function softPoints(count, { color = [0.7, 0.9, 0.35], additive = false } = {}) {
  _soft = _soft || glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), size = new Float32Array(count), alpha = new Float32Array(count), col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { col[i * 3] = color[0]; col[i * 3 + 1] = color[1]; col[i * 3 + 2] = color[2]; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: _soft }, uScale: { value: 1280 * 0.5 / Math.tan(17 * Math.PI / 180) } },
    vertexShader: `attribute float aSize, aAlpha; attribute vec3 aColor; varying float vA; varying vec3 vC; uniform float uScale;
      void main(){ vA = aAlpha; vC = aColor; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = aSize*uScale/max(-mv.z,1e-3); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D map; varying float vA; varying vec3 vC;
      void main(){ float a = texture2D(map, gl_PointCoord).a * vA; if (a < 0.003) discard; gl_FragColor = vec4(vC, a); }`,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 8;
  pts.set = (i, p, s, a, c) => {
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; size[i] = s; alpha[i] = a;
    if (c) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
  };
  pts.commit = () => { for (const k of ['position', 'aSize', 'aAlpha', 'aColor']) geo.attributes[k].needsUpdate = true; };
  pts.setFov = (fov) => { mat.uniforms.uScale.value = 1280 * 0.5 / Math.tan(fov * Math.PI / 360); };
  return pts;
}
// deterministic rising gas plume. update(t, origin, height, spread)
export function gasPlume(count = 260, { seed = 5, color = [0.78, 0.92, 0.45], size = 0.05, alpha = 0.32 } = {}) {
  const pts = softPoints(count, { color });
  const r = rng(seed);
  const P = Array.from({ length: count }, () => ({ t0: r(), a: r() * Math.PI * 2, rr: r(), sw: r() * 6, s: 0.6 + r() * 0.8, sp: 0.7 + r() * 0.6 }));
  const tmp = new THREE.Vector3();
  pts.update = (t, origin, { rise = 0.25, spread = 0.06, life = 2.2, amount = 1, target = null, pull = 0 } = {}) => {
    for (let i = 0; i < count; i++) {
      const q = P[i];
      const age = ((t / life + q.t0) % 1);       // looping emitter
      const born = t - age * life;                // when this puff was emitted
      const on = born >= 0 ? 1 : 0;
      const h = age * rise * q.sp;
      const sw = Math.sin(t * 1.3 + q.sw) * 0.25 + Math.sin(t * 2.1 + q.sw * 2) * 0.12;
      const rad = spread * (0.2 + age * 1.4) * q.rr;
      tmp.set(origin.x + Math.cos(q.a + sw) * rad, origin.y + h, origin.z + Math.sin(q.a + sw) * rad);
      if (target && pull > 0) tmp.lerp(target, Math.min(1, pull * age * age));
      const fade = Math.sin(Math.PI * Math.min(1, age)) * amount * on;
      pts.set(i, tmp, size * q.s * (0.4 + age * 1.6), alpha * fade);
    }
    pts.commit();
  };
  return pts;
}

// ---------------- micro world: onion cells ----------------
export function cellField({ nx = 9, nz = 26, L = 0.9, Wd = 0.26, Ht = 0.22, seed = 2 } = {}) {
  const g = new THREE.Group();
  const geo = new RoundedBoxGeometry(L, Ht, Wd, 3, 0.06);
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xe6efc6, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.62, emissive: new THREE.Color(0x30381a), sheen: 0.6, sheenColor: new THREE.Color(0xffffff), depthWrite: false });
  const n = nx * nz;
  const cells = new THREE.InstancedMesh(geo, mat, n);
  const nucMat = new THREE.MeshPhysicalMaterial({ color: 0xc3b16a, roughness: 0.3, clearcoat: 0.6, emissive: 0x2a2208 });
  const nuc = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 20, 12), nucMat, n);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8d9a5a, roughness: 0.7 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), wallMat); floor.rotation.x = -Math.PI / 2; floor.position.y = -Ht / 2 - 0.005;
  g.add(floor, cells, nuc);
  const r = rng(seed);
  const info = [];
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const off = (iz % 2) * L * 0.5;
    const x = (ix - nx / 2) * (L + 0.02) + off, z = (iz - nz / 2) * (Wd + 0.02);
    info.push({ x, z, sx: 1 + (r() - 0.5) * 0.06, sz: 1 + (r() - 0.5) * 0.12, nx: (r() - 0.5) * L * 0.5, nz: (r() - 0.5) * Wd * 0.3, burst: Infinity, seed: r() });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  g.info = info; g.cells = cells; g.nuc = nuc; g.cellMat = mat; g.L = L; g.Wd = Wd; g.Ht = Ht;
  // droplets from bursting cells
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.02, 12, 8), new THREE.MeshPhysicalMaterial({ color: 0xeef6d2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.8 }), n * 6);
  drops.frustumCulled = false; g.add(drops);
  const dv = Array.from({ length: n * 6 }, () => new THREE.Vector3(r() - 0.5, 0.4 + r(), r() - 0.5).normalize().multiplyScalar(0.6 + r() * 1.4));
  g.update = (t) => {
    for (let i = 0; i < n; i++) {
      const c = info[i], it = t - c.burst;
      let k = 1, sy = 1, vis = true;
      if (it > 0) { // swell, then pop
        const sw = Math.min(1, it / 0.12);
        k = 1 + 0.18 * sw; sy = 1 + 0.35 * sw;
        if (it > 0.12) vis = false;
      }
      const wob = Math.sin(t * 2 + c.seed * 9) * 0.01;
      p.set(c.x, 0, c.z); s.set(c.sx * k + wob, vis ? sy : 0.0001, c.sz * k - wob);
      if (!vis) s.set(0.0001, 0.0001, 0.0001);
      m4.compose(p, q.identity(), s); cells.setMatrixAt(i, m4);
      p.set(c.x + c.nx, 0.02, c.z + c.nz); s.setScalar(vis ? 1 : 0.0001); m4.compose(p, q, s); nuc.setMatrixAt(i, m4);
      for (let j = 0; j < 6; j++) {
        const d = dv[i * 6 + j], a = it - 0.1;
        if (a > 0 && a < 1.2) {
          p.set(c.x + d.x * a * 0.5, d.y * a * 0.6 - 1.2 * a * a, c.z + d.z * a * 0.5);
          s.setScalar(Math.max(0.0001, (1 - a / 1.2)) * (0.8 + j * 0.15));
        } else { p.set(0, -50, 0); s.setScalar(0.0001); }
        m4.compose(p, q, s); drops.setMatrixAt(i * 6 + j, m4);
      }
    }
    cells.instanceMatrix.needsUpdate = true; nuc.instanceMatrix.needsUpdate = true; drops.instanceMatrix.needsUpdate = true;
  };
  return g;
}

// one big cell with a vacuole of sulfur compounds and enzymes floating outside it
export function bigCell({ seed = 7 } = {}) {
  const g = new THREE.Group();
  const mem = new THREE.Mesh(new RoundedBoxGeometry(3.2, 1.6, 1.6, 6, 0.55), new THREE.MeshPhysicalMaterial({ color: 0xd8e8b0, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, emissive: 0x1a2410 }));
  mem.renderOrder = 2; g.add(mem);
  const vac = new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0xfff1a0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.32, depthWrite: false, emissive: 0x3a3008 }));
  vac.position.set(0.35, 0, 0); vac.renderOrder = 3; g.add(vac);
  const nucl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 20), new THREE.MeshPhysicalMaterial({ color: 0xb59a52, roughness: 0.35, clearcoat: 0.6 }));
  nucl.position.set(-0.95, -0.15, 0.2); g.add(nucl);
  const r = rng(seed);
  // sulfur compounds (yellow) inside the vacuole, enzymes (purple) in the cytoplasm
  const NS = 140, NE = 90;
  const sGeo = new THREE.IcosahedronGeometry(0.035, 1), eGeo = new THREE.TorusKnotGeometry(0.03, 0.011, 40, 6);
  const sMat = new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffb000, emissiveIntensity: 0.9, roughness: 0.4 });
  const eMat = new THREE.MeshStandardMaterial({ color: 0xa04ae0, emissive: 0x7a1fd0, emissiveIntensity: 0.9, roughness: 0.4 });
  const S = new THREE.InstancedMesh(sGeo, sMat, NS), E = new THREE.InstancedMesh(eGeo, eMat, NE);
  S.frustumCulled = E.frustumCulled = false;
  g.add(S, E);
  const sP = Array.from({ length: NS }, () => { const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(Math.cbrt(r()) * 0.47); return { home: v.add(new THREE.Vector3(0.35, 0, 0)), ph: r() * 9, mix: new THREE.Vector3((r() - 0.5) * 2.2, (r() - 0.5) * 1.0, (r() - 0.5) * 1.0) }; });
  const eP = Array.from({ length: NE }, () => {
    let v; do { v = new THREE.Vector3((r() - 0.5) * 2.7, (r() - 0.5) * 1.2, (r() - 0.5) * 1.2); } while (v.distanceTo(new THREE.Vector3(0.35, 0, 0)) < 0.68);
    return { home: v, ph: r() * 9, mix: new THREE.Vector3((r() - 0.5) * 2.2, (r() - 0.5) * 1.0, (r() - 0.5) * 1.0), rot: new THREE.Euler(r() * 6, r() * 6, r() * 6) };
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  g.vac = vac; g.mem = mem; g.S = S; g.E = E; g.sMat = sMat; g.eMat = eMat;
  // mix: 0 = separate, 1 = fully mixed (swirling in the middle); react 0..1 fades them out (they become gas)
  g.update = (t, mix = 0, react = 0) => {
    const sw = t * 1.6;
    for (let i = 0; i < NS; i++) {
      const a = sP[i];
      p.copy(a.home).lerp(a.mix, mix);
      const ang = sw * mix * 1.5 + a.ph;
      p.x += Math.sin(t * 1.5 + a.ph) * 0.02 + Math.cos(ang) * 0.12 * mix; p.y += Math.cos(t * 1.7 + a.ph) * 0.02 + Math.sin(ang) * 0.12 * mix;
      q.setFromEuler(new THREE.Euler(t + a.ph, t * 0.7, 0));
      s.setScalar(Math.max(0.0001, 1 - react));
      m4.compose(p, q, s); S.setMatrixAt(i, m4);
    }
    for (let i = 0; i < NE; i++) {
      const a = eP[i];
      p.copy(a.home).lerp(a.mix, mix);
      const ang = -sw * mix * 1.3 + a.ph;
      p.x += Math.sin(t * 1.2 + a.ph) * 0.03 + Math.cos(ang) * 0.12 * mix; p.y += Math.cos(t * 1.4 + a.ph) * 0.03 + Math.sin(ang) * 0.12 * mix;
      q.setFromEuler(new THREE.Euler(a.rot.x + t * 0.8, a.rot.y + t, a.rot.z));
      s.setScalar(Math.max(0.0001, 1 - react));
      m4.compose(p, q, s); E.setMatrixAt(i, m4);
    }
    S.instanceMatrix.needsUpdate = E.instanceMatrix.needsUpdate = true;
  };
  g.update(0);
  return g;
}

// ---------------- eye (radius 1 eyeball, looking +z) ----------------
let _eyeTex = null;
function eyeTextures() {
  if (_eyeTex) return _eyeTex;
  const r = rng(31);
  // iris (planar disc map)
  const [c, g] = cv(512);
  const cx = 256;
  const gr = g.createRadialGradient(cx, cx, 0, cx, cx, 256);
  gr.addColorStop(0, '#2c1a0e'); gr.addColorStop(0.3, '#6b4423'); gr.addColorStop(0.62, '#8a6a3a'); gr.addColorStop(0.9, '#3c5a4a'); gr.addColorStop(1, '#1d2620');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const a = r() * Math.PI * 2, r0 = 70 + r() * 40, r1 = 160 + r() * 90;
    g.strokeStyle = r() < 0.5 ? `rgba(220,170,90,${0.15 + r() * 0.3})` : `rgba(40,25,10,${0.2 + r() * 0.3})`;
    g.lineWidth = 0.8 + r() * 1.8; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cx + Math.sin(a) * r0);
    g.quadraticCurveTo(cx + Math.cos(a + 0.05) * (r0 + r1) / 2, cx + Math.sin(a + 0.05) * (r0 + r1) / 2, cx + Math.cos(a) * r1, cx + Math.sin(a) * r1); g.stroke();
  }
  g.fillStyle = '#050505'; g.beginPath(); g.arc(cx, cx, 78, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(10,10,10,0.9)'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cx, 249, 0, Math.PI * 2); g.stroke();
  const iris = ctex(c);
  // sclera veins (alpha map), equirect
  const [c2, g2] = cv(1024, 512);
  g2.clearRect(0, 0, 1024, 512);
  const vein = (x, y, ang, len, w, depth) => {
    if (depth > 5 || w < 0.4) return;
    g2.strokeStyle = `rgba(255,255,255,${0.5 + w * 0.12})`; g2.lineWidth = w; g2.beginPath(); g2.moveTo(x, y);
    let px = x, py = y;
    for (let i = 0; i < len; i++) { ang += (r() - 0.5) * 0.5; px += Math.cos(ang) * 3; py += Math.sin(ang) * 3; g2.lineTo(px, py); if (r() < 0.04) vein(px, py, ang + (r() - 0.5) * 1.6, len * 0.6, w * 0.7, depth + 1); }
    g2.stroke();
  };
  // veins start at the corners (left and right edges of the front) and reach toward the iris (u = 0.75 is +z)
  for (let i = 0; i < 26; i++) { const side = r() < 0.5 ? -1 : 1; vein(768 + side * (190 + r() * 60), 140 + r() * 230, side < 0 ? (r() - 0.5) * 0.8 : Math.PI + (r() - 0.5) * 0.8, 40 + r() * 30, 2.6, 0); }
  const veins = ctex(c2, false);
  _eyeTex = { iris, veins };
  return _eyeTex;
}
export function bigEye() {
  const M = materials();
  const T = eyeTextures();
  const g = new THREE.Group();
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshPhysicalMaterial({ color: 0xf4efe8, roughness: 0.3, sheen: 0.3, sheenColor: new THREE.Color(0xffd0c8) }));
  sclera.rotation.y = -Math.PI / 2;  // put u=0.75 seam-free side to +z
  g.add(sclera);
  const vmat = new THREE.MeshBasicMaterial({ color: 0xd8202a, alphaMap: T.veins, transparent: true, opacity: 0.0, depthWrite: false });
  const veins = new THREE.Mesh(new THREE.SphereGeometry(1.002, 96, 64), vmat); veins.rotation.y = -Math.PI / 2; g.add(veins);
  const redness = new THREE.Mesh(new THREE.SphereGeometry(1.003, 64, 48), new THREE.MeshBasicMaterial({ color: 0xe04848, transparent: true, opacity: 0.0, depthWrite: false }));
  g.add(redness);
  // iris: spherical cap at the front with planar uv
  const ig = new THREE.SphereGeometry(1.004, 64, 24, 0, Math.PI * 2, 0, 0.52);
  ig.rotateX(Math.PI / 2);
  const iuv = ig.attributes.uv, ip = ig.attributes.position;
  for (let i = 0; i < ip.count; i++) iuv.setXY(i, 0.5 + ip.getX(i) / (2 * Math.sin(0.52) * 1.004), 0.5 + ip.getY(i) / (2 * Math.sin(0.52) * 1.004));
  const iris = new THREE.Mesh(ig, new THREE.MeshPhysicalMaterial({ map: T.iris, roughness: 0.5 })); g.add(iris);
  const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.62, 64, 32, 0, Math.PI * 2, 0, 1.1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.0, transparent: true, opacity: 0.08, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 3, depthWrite: false }));
  cornea.rotation.x = Math.PI / 2; cornea.position.z = 0.42; cornea.renderOrder = 4; g.add(cornea);
  const film = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 64), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transparent: true, opacity: 0.0, clearcoat: 1, depthWrite: false }));
  film.renderOrder = 5; g.add(film);
  // lids
  const lidMat = M.skin;
  const upper = new THREE.Mesh(new THREE.SphereGeometry(1.08, 96, 48, 0, Math.PI * 2, 0, 1.25), lidMat);
  const lower = new THREE.Mesh(new THREE.SphereGeometry(1.07, 96, 48, 0, Math.PI * 2, 0, 1.35), lidMat);
  lower.rotation.x = Math.PI;
  const upP = new THREE.Group(), loP = new THREE.Group(); upP.add(upper); loP.add(lower); g.add(upP, loP);
  // lid rims (wet edge) + lashes
  const rimMat = new THREE.MeshPhysicalMaterial({ color: 0xc9827a, roughness: 0.2, clearcoat: 1 });
  const upRim = new THREE.Mesh(new THREE.TorusGeometry(Math.sin(1.25) * 1.08, 0.035, 12, 96), rimMat); upRim.rotation.x = Math.PI / 2; upRim.position.y = Math.cos(1.25) * 1.08; upper.add(upRim);
  const loRim = new THREE.Mesh(new THREE.TorusGeometry(Math.sin(1.35) * 1.07, 0.035, 12, 96), rimMat); loRim.rotation.x = Math.PI / 2; loRim.position.y = Math.cos(1.35) * 1.07; lower.add(loRim);
  const lashMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.7 });
  const lr = rng(5);
  for (let i = 0; i < 70; i++) {
    const a = -1.25 + (i / 69) * 2.5 + (lr() - 0.5) * 0.03; // around +z
    const R = Math.sin(1.25) * 1.08, y = Math.cos(1.25) * 1.08;
    const L = 0.22 + lr() * 0.12 - Math.abs(a) * 0.06;
    const lash = new THREE.Mesh(new THREE.ConeGeometry(0.008, L, 4), lashMat);
    lash.geometry.translate(0, L / 2, 0);
    lash.position.set(Math.sin(a) * R, y, Math.cos(a) * R);
    lash.rotation.set(1.0 + lr() * 0.3, a, 0, 'YXZ'); upper.add(lash);
  }
  // face skin around (big shell) and the pink inner corner
  const face = new THREE.Mesh(new THREE.SphereGeometry(3.2, 96, 64, 0, Math.PI * 2, 0, 0.62), lidMat);
  face.rotation.x = Math.PI / 2; face.position.z = -2.62; face.scale.set(1.4, 1.0, 1);
  g.add(face);
  const car = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xd9727a, roughness: 0.2, clearcoat: 1 }));
  car.position.set(-0.93, -0.06, 0.38); car.scale.set(0.8, 1.2, 0.8); g.add(car);
  g.upper = upP; g.lower = loP; g.veinMat = vmat; g.redness = redness; g.film = film; g.iris = iris;
  // blink/squint: 0 open, 1 shut
  g.squint = (k) => { upP.rotation.x = 0.55 * k; loP.rotation.x = -0.22 * k; };
  g.squint(0);
  return shadow(g);
}

// ---------------- nerves ----------------
export function nerveNet({ seed = 3, n = 14 } = {}) {
  const g = new THREE.Group();
  const r = rng(seed);
  const baseMat = new THREE.MeshPhysicalMaterial({ color: 0xe8b0a0, roughness: 0.35, clearcoat: 0.8, sheen: 0.5, sheenColor: new THREE.Color(0xffd8d0) });
  const pulseMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uAmp: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uT, uAmp; varying vec2 vUv; varying vec3 vN;
      void main(){ float x = vUv.x*6.0 - uT*2.2; float p = pow(0.5+0.5*sin(x*6.2832), 10.0);
        float rim = pow(1.0 - abs(vN.z), 1.5);
        float a = uAmp*(0.35 + p*1.2) * (0.6 + 0.4*rim);
        gl_FragColor = vec4(vec3(1.0,0.12,0.08)*(1.0+p*2.5), clamp(a,0.,1.)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const tubes = [];
  const branch = (start, dir, len, rad, depth) => {
    const pts = [start.clone()];
    let p = start.clone(), d = dir.clone();
    const segs = 6;
    for (let i = 0; i < segs; i++) { d.add(new THREE.Vector3((r() - 0.5) * 0.7, (r() - 0.5) * 0.7, (r() - 0.5) * 0.4)).normalize(); p = p.clone().addScaledVector(d, len / segs); pts.push(p); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 48, rad, 10, false);
    g.add(new THREE.Mesh(geo, baseMat));
    const pm = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, rad * 1.35, 10, false), pulseMat); pm.renderOrder = 6; g.add(pm);
    tubes.push(curve);
    if (depth < 2) for (let k = 0; k < 2; k++) { const t0 = 0.35 + r() * 0.5; branch(curve.getPoint(t0), d.clone().add(new THREE.Vector3((r() - 0.5) * 1.5, (r() - 0.5) * 1.5, (r() - 0.5))).normalize(), len * 0.6, rad * 0.6, depth + 1); }
  };
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    branch(new THREE.Vector3(Math.cos(a) * 0.15, Math.sin(a) * 0.15, -r() * 0.6), new THREE.Vector3(Math.cos(a), Math.sin(a), -0.3 - r() * 0.6).normalize(), 2.2 + r(), 0.05 + r() * 0.03, 0);
  }
  g.pulse = pulseMat; g.tubes = tubes;
  return g;
}

// ---------------- brain ----------------
export function brain() {
  const geo = new THREE.SphereGeometry(1, 160, 120);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const fold = Math.sin(v.x * 9 + Math.sin(v.y * 7) * 1.6) * Math.sin(v.y * 8 + Math.sin(v.z * 6) * 1.8) * Math.sin(v.z * 7 + Math.sin(v.x * 5) * 1.5);
    const fold2 = Math.sin(v.x * 17 + v.z * 5) * Math.sin(v.y * 15 + v.x * 4) * Math.sin(v.z * 16 + v.y * 3);
    const k = 1 + 0.06 * fold + 0.025 * fold2 - (Math.abs(v.x) < 0.06 ? 0.08 * (1 - Math.abs(v.x) / 0.06) : 0);
    p.setXYZ(i, v.x * 0.85 * k, v.y * 0.72 * k, v.z * 1.05 * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xe7a3a6, roughness: 0.35, clearcoat: 0.7, sheen: 0.6, sheenColor: new THREE.Color(0xffc8c8), emissive: new THREE.Color(0x000000) }));
  return shadow(m);
}

// ---------------- tear gland + duct ----------------
export function tearGland() {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xe48a8f, roughness: 0.3, clearcoat: 0.8, sheen: 0.6, sheenColor: new THREE.Color(0xffd0d0), emissive: new THREE.Color(0x000000) });
  const r = rng(17);
  for (let i = 0; i < 18; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.14 + r() * 0.08, 24, 16), mat);
    s.position.set((r() - 0.5) * 0.7, (r() - 0.5) * 0.25, (r() - 0.5) * 0.3); g.add(s);
  }
  g.mat = mat;
  return shadow(g);
}

// clear droplets (instanced) for tears and juice
export function droplets(n = 120, color = 0xdff4ff) {
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0, transparent: true, opacity: 0.55, envMapIntensity: 2.5, depthWrite: false });
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), mat, n);
  mat.opacity = 0.4;
  m.frustumCulled = false; m.renderOrder = 7;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  m.setDrop = (i, pos, r, stretch = 1) => { p.copy(pos); s.set(r, r * stretch, r); m4.compose(p, q, s); m.setMatrixAt(i, m4); };
  m.hide = (i) => { p.set(0, -999, 0); s.setScalar(1e-4); m4.compose(p, q, s); m.setMatrixAt(i, m4); };
  m.commit = () => { m.instanceMatrix.needsUpdate = true; };
  for (let i = 0; i < n; i++) m.hide(i);
  return m;
}

// ---------------- fridge interior ----------------
export function fridgeInside() {
  const g = new THREE.Group();
  const W = 0.6, H = 0.9, D = 0.5;
  const inner = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), new THREE.MeshPhysicalMaterial({ color: 0xc4d6ea, roughness: 0.35, clearcoat: 0.4, side: THREE.BackSide }));
  inner.position.set(0, H / 2, -D / 2); inner.receiveShadow = true; g.add(inner);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x8fb4d8, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  for (const y of [0.3, 0.6]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.01, 0.01, D - 0.02), glass); sh.position.set(0, y, -D / 2); g.add(sh);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(W - 0.01, 0.014, 0.012), new THREE.MeshStandardMaterial({ color: 0xbfc8d2, metalness: 0.6, roughness: 0.3 })); trim.position.set(0, y, -0.012); g.add(trim);
  }
  // some fridge contents for depth
  const r = rng(22);
  const cols = [0xf0b030, 0xd83a3a, 0x58a840, 0xffffff, 0xe0703a];
  for (let i = 0; i < 7; i++) {
    const y = i < 4 ? 0.6 : 0.0;
    const it = i % 2 ? new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12 + r() * 0.08, 20), new THREE.MeshPhysicalMaterial({ color: cols[i % 5], roughness: 0.3, clearcoat: 0.5 }))
                     : new THREE.Mesh(new THREE.SphereGeometry(0.04 + r() * 0.015, 24, 16), new THREE.MeshPhysicalMaterial({ color: cols[(i + 2) % 5], roughness: 0.4, clearcoat: 0.4 }));
    it.geometry.computeBoundingBox(); const hb = -it.geometry.boundingBox.min.y;
    it.position.set(-0.22 + (i % 4) * 0.14 + (i >= 4 ? 0.05 : 0), y + hb + 0.004, -0.33 + r() * 0.08); g.add(it);
  }
  const body = new THREE.MeshPhysicalMaterial({ color: 0xe8ebee, roughness: 0.3, clearcoat: 0.6 });
  for (const [w, h, x, y] of [[W + 0.12, 0.06, 0, H + 0.03], [W + 0.12, 0.06, 0, -0.03], [0.06, H + 0.12, -W / 2 - 0.03, H / 2], [0.06, H + 0.12, W / 2 + 0.03, H / 2]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), body); f.position.set(x, y, 0.0); g.add(f);
  }
  const lamp = new THREE.PointLight(0xcfe6ff, 0.9, 2, 1.2); lamp.position.set(0, H - 0.05, -0.15); g.add(lamp);
  shadow(g);
  g.W = W; g.H = H; g.D = D;
  return g;
}

// soft dark blob under an object resting on a surface the key light can't reach
export function contactShadow(radius = 0.05, opacity = 0.6) {
  const [c, g] = cv(128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: ctex(c, false), transparent: true, opacity, depthWrite: false, color: 0x0a1420 }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

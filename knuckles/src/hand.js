// Props for "Why Do Knuckles Crack": poseable hand (with X-ray bones), knuckle joint model, gauge, stopwatch, calendar.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { materials } from './materials.js';
import { glowTexture } from './textures.js';

const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const cv = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const ctex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// ---------- X-ray materials ----------
export function xrayMat(color = 0x9fd4ff, power = 1.6, base = 0.12) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPow: { value: power }, uBase: { value: base }, uAmp: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uPow, uBase, uAmp; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow); gl_FragColor = vec4(uColor*(uBase + f*1.4)*uAmp, (uBase + f)*uAmp); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
  });
}

// ---------- hand ----------
// Fingers point along +x, back of the hand is +y, the thumb is on +z (mirror with scale.z = -1 for the other hand).
// hand.pose({ curl: [i, m, r, p] 0..1, spread, thumb }) ; hand.bendFinger(i, [mcp, pip, dip]) ; hand.setXray(on)
const FING = [ // z offset, segment lengths
  [0.029, [0.044, 0.026, 0.02]], [0.0095, [0.048, 0.03, 0.021]], [-0.0105, [0.045, 0.028, 0.02]], [-0.029, [0.036, 0.021, 0.018]],
];
export function makeHand({ sleeve = 0x2f6aa6, skin } = {}) {
  const M = materials();
  const skinMat = skin || M.skin;
  const g = new THREE.Group();
  const palm = new THREE.Mesh(new RoundedBoxGeometry(0.095, 0.03, 0.085, 4, 0.013), skinMat);
  palm.position.set(-0.0, 0, 0); g.add(palm);
  const xbones = new THREE.Group(); g.add(xbones); xbones.visible = false;
  const bm = xrayMat(0xbfe4ff, 1.2, 0.25);
  const bone = (len, r, parent, x0 = 0) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 12), bm); m.rotation.z = Math.PI / 2; m.position.x = x0 + len / 2 + r * 0.2; parent.add(m);
    const h = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 16, 10), bm); h.position.x = x0 + len + r; parent.add(h);
    return m;
  };
  const fingers = [];
  const knuckles = [];
  FING.forEach(([z, L], i) => {
    // metacarpal (X-ray only) inside the palm
    const mc = new THREE.Group(); mc.position.set(-0.05, 0.002, z * 0.8); g.add(mc);
    const mcb = bone(0.085, 0.0042, mc); mcb.parent.children.forEach(c => { if (c.material === bm) { c.visible = false; xbones.userData.list = (xbones.userData.list || []).concat(c); } });
    const chain = [];
    let parent = g, x = 0.046;
    for (let s = 0; s < 3; s++) {
      const j = new THREE.Group(); j.position.set(s === 0 ? x : L[s - 1], s === 0 ? 0.002 : 0, s === 0 ? z : 0); parent.add(j);
      const r = 0.0092 - s * 0.0007;
      const seg = new THREE.Mesh(new THREE.CapsuleGeometry(r, L[s], 6, 14), skinMat);
      seg.rotation.z = Math.PI / 2; seg.position.x = L[s] / 2; seg.scale.set(1, 1, 0.9); j.add(seg);
      const b = bone(L[s] - 0.006, 0.0034 - s * 0.0004, j, 0.001);
      b.visible = false; j.children.forEach(c => { if (c.material === bm) { c.visible = false; xbones.userData.list = (xbones.userData.list || []).concat(c); } });
      if (s === 0) { const k = new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 18, 12), skinMat); k.position.set(0, 0.002, 0); j.add(k); knuckles.push(k); }
      if (s === 2) { const nail = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 14, 8, 0, Math.PI * 2, 0, 1.2), new THREE.MeshPhysicalMaterial({ color: 0xf1c6b4, roughness: 0.25, clearcoat: 1 })); nail.position.set(L[s] - 0.005, r * 0.55, 0); nail.scale.set(1.2, 0.6, 0.95); j.add(nail); }
      chain.push(j); parent = j;
    }
    fingers.push(chain);
  });
  // carpal blob (X-ray)
  const carp = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), bm); carp.scale.set(1, 0.4, 1.6); carp.position.set(-0.06, 0, 0); g.add(carp); carp.visible = false;
  xbones.userData.list.push(carp);
  // thumb
  const th0 = new THREE.Group(); th0.position.set(-0.025, -0.004, 0.044); th0.rotation.set(0.3, -0.75, -0.2); g.add(th0);
  const thChain = [th0];
  { let p = th0; [0.04, 0.03, 0.024].forEach((l, s) => { const j = s === 0 ? th0 : new THREE.Group(); if (s) { j.position.x = [0.04, 0.03][s - 1]; p.add(j); } const r = 0.0115 - s * 0.0012; const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), skinMat); m.rotation.z = Math.PI / 2; m.position.x = l / 2; j.add(m); const b = bone(l - 0.008, 0.004, j, 0.002); j.children.forEach(c => { if (c.material === bm) { c.visible = false; xbones.userData.list.push(c); } }); if (s) thChain.push(j); p = j; }); }
  // wrist + forearm + sleeve
  const fa = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.24, 8, 20), skinMat); fa.rotation.z = Math.PI / 2; fa.scale.set(1, 1, 1.25); fa.position.set(-0.17, -0.002, 0); g.add(fa);
  const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.052, 0.3, 28, 1, true), new THREE.MeshStandardMaterial({ color: sleeve, roughness: 0.85, side: THREE.DoubleSide }));
  sl.rotation.z = Math.PI / 2; sl.position.set(-0.36, 0, 0); g.add(sl);
  const skinShell = xrayMat(0x6fb6ff, 2.2, 0.03);
  const skinMeshes = []; g.traverse(o => { if (o.isMesh && o.material === skinMat) skinMeshes.push(o); });
  g.fingers = fingers; g.thumb = thChain; g.knuckles = knuckles; g.palm = palm; g.sleeve = sl;
  g.bendFinger = (i, [a, b, c]) => { fingers[i][0].rotation.z = -a; fingers[i][1].rotation.z = -b; fingers[i][2].rotation.z = -c; };
  g.pose = ({ curl = [0, 0, 0, 0], spread = 0, thumb = 0 } = {}) => {
    curl.forEach((k, i) => { g.bendFinger(i, [k * 1.45, k * 1.6, k * 1.1]); fingers[i][0].rotation.y = (i - 1.5) * -0.08 * spread; });
    th0.rotation.set(0.3 + thumb * 0.6, -0.75 + thumb * 0.5, -0.2 - thumb * 0.5);
  };
  g.setXray = (on, skinA = 1) => {
    xbones.userData.list.forEach(m => { m.visible = on; });
    skinMeshes.forEach(m => { m.material = on ? skinShell : skinMat; });
    skinShell.uniforms.uAmp.value = skinA;
    sl.visible = !on;
  };
  g.boneMat = bm;
  g.pose({});
  return shadow(g);
}

// ---------- the knuckle joint, big (≈ 1 unit = 1 cm) ----------
// metacarpal head comes from -x, phalanx base from +x. joint.set({ gap, bubble, bubbleT, capsuleA, fluidA })
export function knuckleJoint() {
  const g = new THREE.Group();
  const boneMat = new THREE.MeshPhysicalMaterial({ color: 0xeee2c8, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xffffff), clearcoat: 0.2 });
  const cartMat = new THREE.MeshPhysicalMaterial({ color: 0xdcecff, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.85 });
  // metacarpal: shaft + rounded head
  const A = new THREE.Group(); g.add(A);
  const shaftA = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 4, 40), boneMat); shaftA.rotation.z = Math.PI / 2; shaftA.position.x = -2.6; A.add(shaftA);
  const headA = new THREE.Mesh(new THREE.SphereGeometry(0.75, 48, 32), boneMat); headA.scale.set(0.85, 0.95, 1.0); headA.position.x = -0.6; A.add(headA);
  const capA = new THREE.Mesh(new THREE.SphereGeometry(0.78, 48, 32, 0, Math.PI * 2, 0, 1.1), cartMat); capA.rotation.z = -Math.PI / 2; capA.scale.set(0.95, 0.88, 1.03); capA.position.x = -0.6; A.add(capA);
  // phalanx: shaft + cupped base
  const B = new THREE.Group(); g.add(B);
  const shaftB = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 4, 40), boneMat); shaftB.rotation.z = Math.PI / 2; shaftB.position.x = 2.6; B.add(shaftB);
  const prof = []; for (let i = 0; i <= 24; i++) { const a = i / 24; prof.push(new THREE.Vector2(0.15 + a * 0.62, 0.55 - Math.sin(a * Math.PI * 0.5) * 0.15 - (1 - a) * 0.0)); }
  prof.push(new THREE.Vector2(0.72, 0.62)); prof.push(new THREE.Vector2(0.5, 1.3));
  const baseB = new THREE.Mesh(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p.x, p.y)), 48), boneMat); baseB.rotation.z = -Math.PI / 2; baseB.position.x = -0.39; B.add(baseB);   // wide cupped face toward the head
  const cup = new THREE.Mesh(new THREE.SphereGeometry(0.8, 48, 24, 0, Math.PI * 2, 0, 0.95), cartMat); cup.rotation.z = Math.PI / 2; cup.position.x = 0.56; cup.scale.set(1, 0.5, 1); B.add(cup);
  // capsule (sleeve) + fluid
  const capPts = []; for (let i = 0; i <= 30; i++) { const a = i / 30; capPts.push(new THREE.Vector2(0.92 + Math.sin(a * Math.PI) * 0.45, -2.2 + a * 4.4)); }
  const capsuleMat = new THREE.MeshPhysicalMaterial({ color: 0xe8a0a0, roughness: 0.25, clearcoat: 0.8, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, sheen: 0.6, sheenColor: new THREE.Color(0xffd0d0) });
  const capsule = new THREE.Mesh(new THREE.LatheGeometry(capPts, 64), capsuleMat); capsule.rotation.z = -Math.PI / 2; capsule.renderOrder = 4; g.add(capsule);
  const fluidPts = capPts.map(p => new THREE.Vector2(p.x * 0.95, p.y * 0.9));
  const fluidMat = new THREE.MeshPhysicalMaterial({ color: 0xfff2b0, roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false, emissive: 0x2a2205 });
  const fluid = new THREE.Mesh(new THREE.LatheGeometry(fluidPts, 64), fluidMat); fluid.rotation.z = -Math.PI / 2; fluid.renderOrder = 3; g.add(fluid);
  // gas bubble
  const bubMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, metalness: 0, clearcoat: 1, clearcoatRoughness: 0, transparent: true, opacity: 0.35, envMapIntensity: 3, iridescence: 1, iridescenceIOR: 1.6, depthWrite: false });
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), bubMat); bubble.renderOrder = 6; g.add(bubble);
  const rim = new THREE.Mesh(new THREE.SphereGeometry(1.02, 48, 32), xrayMat(0xcfe8ff, 2.5, 0.0)); rim.renderOrder = 7; bubble.add(rim);
  // small dissolved-gas specks in the fluid
  const specks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.7 }), 160);
  g.add(specks);
  const sp = Array.from({ length: 160 }, (_, i) => { const a = i * 2.39996, r = 0.2 + ((i * 37) % 100) / 100 * 0.9, x = -0.3 + ((i * 53) % 100) / 100 * 0.9; return new THREE.Vector3(x, Math.sin(a) * r, Math.cos(a) * r); });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3();
  g.A = A; g.B = B; g.capsule = capsule; g.fluid = fluid; g.bubble = bubble; g.boneMat = boneMat; g.cartMat = cartMat; g.capsuleMat = capsuleMat; g.fluidMat = fluidMat;
  g.set = ({ gap = 0, bubble: br = 0, specks: sk = 0, t = 0, center = 0.25 } = {}) => {
    B.position.x = gap; A.position.x = 0;
    capsule.scale.set(1 + gap * 0.25, 1, 1); fluid.scale.copy(capsule.scale);
    capsule.position.x = fluid.position.x = gap / 2;
    bubble.visible = br > 0.002; bubble.scale.setScalar(Math.max(0.001, br)); bubble.position.set(0.125 + gap * 0.5, 0, 0);
    for (let i = 0; i < 160; i++) {
      const v = sp[i];
      pp.set(v.x + gap * 0.5 + Math.sin(t * 0.7 + i) * 0.04, v.y + Math.sin(t + i * 1.3) * 0.05, v.z + Math.cos(t * 0.8 + i) * 0.05);
      ss.setScalar(sk > 0 ? sk * (0.5 + (i % 5) * 0.2) : 0.0001);
      m4.compose(pp, q, ss); specks.setMatrixAt(i, m4);
    }
    specks.instanceMatrix.needsUpdate = true;
  };
  g.set({});
  return shadow(g);
}

// ---------- 3D dial with a canvas face (gauge / stopwatch) ----------
export function dial(draw, { r = 1, depth = 0.25, rim = 0xc9ced6 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.1, depth, 64), new THREE.MeshPhysicalMaterial({ color: rim, metalness: 1, roughness: 0.25, clearcoat: 0.6 }));
  body.rotation.x = Math.PI / 2; g.add(body);
  const [c, x] = cv(512); const tex = ctex(c);
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  face.position.z = depth / 2 + 0.002; g.add(face);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, clearcoat: 1, transparent: true, opacity: 0.08 }));
  glass.position.z = depth / 2 + 0.02; g.add(glass);
  let last = null;
  g.update = (v) => { const key = Math.round(v * 400); if (key === last) return; last = key; x.clearRect(0, 0, 512, 512); draw(x, v); tex.needsUpdate = true; };
  return shadow(g);
}
export function gaugeFace(x, v) {   // v 0..1 (needle position)
  x.fillStyle = '#f7f5ef'; x.beginPath(); x.arc(256, 256, 256, 0, Math.PI * 2); x.fill();
  for (let i = 0; i <= 40; i++) { const a = Math.PI * (0.75 + 1.5 * i / 40); const r0 = i % 5 ? 200 : 180; x.strokeStyle = i > 30 ? '#c0141c' : '#222'; x.lineWidth = i % 5 ? 4 : 9; x.beginPath(); x.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0); x.lineTo(256 + Math.cos(a) * 228, 256 + Math.sin(a) * 228); x.stroke(); }
  x.fillStyle = '#222'; x.font = '900 46px sans-serif'; x.textAlign = 'center'; x.fillText('PRESSURE', 256, 380);
  const a = Math.PI * (0.75 + 1.5 * v);
  x.strokeStyle = '#d01a1a'; x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.moveTo(256 - Math.cos(a) * 30, 256 - Math.sin(a) * 30); x.lineTo(256 + Math.cos(a) * 190, 256 + Math.sin(a) * 190); x.stroke();
  x.fillStyle = '#333'; x.beginPath(); x.arc(256, 256, 24, 0, Math.PI * 2); x.fill();
}
export function watchFace(x, v) {   // v = minutes 0..20 (dial shows 0..20)
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(256, 256, 256, 0, Math.PI * 2); x.fill();
  const frac = v / 20;
  x.fillStyle = 'rgba(255,170,40,0.35)'; x.beginPath(); x.moveTo(256, 256); x.arc(256, 256, 236, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); x.closePath(); x.fill();
  for (let i = 0; i < 20; i++) { const a = -Math.PI / 2 + Math.PI * 2 * i / 20; x.strokeStyle = '#222'; x.lineWidth = i % 5 ? 4 : 10; const r0 = i % 5 ? 205 : 185; x.beginPath(); x.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0); x.lineTo(256 + Math.cos(a) * 232, 256 + Math.sin(a) * 232); x.stroke(); }
  x.fillStyle = '#111'; x.font = '900 120px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(Math.floor(v)), 256, 230);
  x.font = '800 44px sans-serif'; x.fillText('MIN', 256, 320);
  const a = -Math.PI / 2 + Math.PI * 2 * frac;
  x.strokeStyle = '#d01a1a'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(256, 256); x.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); x.stroke();
}
// tear-off wall calendar showing a year
export function calendar() {
  const g = new THREE.Group();
  const [c, x] = cv(512, 640); const tex = ctex(c);
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
  g.add(page);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.02), new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.7 })); back.position.z = -0.012; g.add(back);
  let last = null;
  g.update = (year) => {
    if (year === last) return; last = year;
    x.fillStyle = '#fbf8f1'; x.fillRect(0, 0, 512, 640);
    x.fillStyle = '#c0141c'; x.fillRect(0, 0, 512, 150);
    x.fillStyle = '#fff'; x.font = '900 70px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('YEAR', 256, 78);
    x.fillStyle = '#111'; x.font = '900 190px sans-serif'; x.fillText(String(year), 256, 400);
    tex.needsUpdate = true;
  };
  return shadow(g);
}
let _g = null;
export function glow(color = 0xffffff, size = 1) {
  _g = _g || glowTexture();
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _g, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }));
  s.scale.setScalar(size); return s;
}

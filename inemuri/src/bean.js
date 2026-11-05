// A "bean" character: big round head with a drawn face, capsule body, stick limbs.
import * as THREE from 'three';
import { toon } from './toon.js';

const FACE_W = 1024, FACE_H = 512;
// face modes: normal | sleep | snore | wide | grin | angry | shock | tired | smile
function drawFace(g, mode, blink = 0) {
  g.clearRect(0, 0, FACE_W, FACE_H);
  const cx = FACE_W * 0.25, cy = FACE_H * 0.5;   // +z on the sphere
  const ink = '#1a1a22';
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = ink; g.fillStyle = ink;
  const eye = (ex, ey, side) => {
    if (mode === 'sleep' || mode === 'snore') { g.lineWidth = 7; g.beginPath(); g.arc(ex, ey - 6, 20, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); return; }
    if (mode === 'grin' || mode === 'smile') { g.lineWidth = 8; g.beginPath(); g.arc(ex, ey + 14, 22, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); return; }
    if (mode === 'wide' || mode === 'shock') { g.fillStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.ellipse(ex, ey, 22, 28, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(ex, ey + 2, mode === 'shock' ? 5 : 7, 0, 7); g.fill(); return; }
    if (mode === 'tired') {
      g.lineWidth = 6; g.beginPath(); g.moveTo(ex - 18, ey - 2); g.lineTo(ex + 18, ey - 2); g.stroke();
      g.beginPath(); g.arc(ex, ey - 2, 14, 0, Math.PI); g.fill();
      g.strokeStyle = 'rgba(120,90,160,0.75)'; g.lineWidth = 5; for (const k of [12, 22]) { g.beginPath(); g.arc(ex, ey + k - 6, 20, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
      g.strokeStyle = ink; return;
    }
    if (blink > 0.5) { g.lineWidth = 6; g.beginPath(); g.moveTo(ex - 14, ey); g.lineTo(ex + 14, ey); g.stroke(); return; }
    g.beginPath(); g.ellipse(ex, ey, 8, 11, 0, 0, 7); g.fill();
    if (mode === 'angry') { g.lineWidth = 9; g.beginPath(); g.moveTo(ex - 24 * side, ey - 34); g.lineTo(ex + 20 * side, ey - 18); g.stroke(); }
  };
  eye(cx - 52, cy - 10, -1); eye(cx + 52, cy - 10, 1);
  g.fillStyle = ink;
  if (mode === 'grin') {
    g.lineWidth = 7; g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(cx - 62, cy + 34); g.quadraticCurveTo(cx, cy + 40, cx + 62, cy + 34); g.quadraticCurveTo(cx + 58, cy + 96, cx, cy + 100); g.quadraticCurveTo(cx - 58, cy + 96, cx - 62, cy + 34); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 4; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 22, cy + 38); g.lineTo(cx + i * 22, cy + 98); g.stroke(); }
    g.beginPath(); g.moveTo(cx - 58, cy + 66); g.lineTo(cx + 58, cy + 66); g.stroke();
  } else if (mode === 'wide' || mode === 'shock') {
    g.beginPath(); g.ellipse(cx, cy + 58, 16, 20, 0, 0, 7); g.fill();
    if (mode === 'shock') { g.fillStyle = 'rgba(120,200,255,0.95)'; g.beginPath(); g.moveTo(cx + 120, cy - 70); g.quadraticCurveTo(cx + 140, cy - 30, cx + 120, cy - 20); g.quadraticCurveTo(cx + 100, cy - 30, cx + 120, cy - 70); g.fill(); }
  } else if (mode === 'sleep') {
    g.beginPath(); g.ellipse(cx + 6, cy + 54, 12, 9, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(140,200,255,0.9)'; g.beginPath(); g.ellipse(cx + 22, cy + 76, 6, 12, 0, 0, 7); g.fill();
  } else if (mode === 'snore') {
    g.beginPath(); g.ellipse(cx, cy + 58, 26, 22, 0, 0, 7); g.fill();
  } else if (mode === 'angry') {
    g.lineWidth = 7; g.beginPath(); g.arc(cx, cy + 74, 30, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke();
  } else if (mode === 'tired') {
    g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 20, cy + 52); g.lineTo(cx + 20, cy + 48); g.stroke();
  } else {
    g.lineWidth = 6; g.beginPath(); g.arc(cx, cy + 30, 30, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
  }
  g.fillStyle = mode === 'angry' ? 'rgba(255,60,60,0.35)' : 'rgba(255,140,140,0.25)';
  g.beginPath(); g.ellipse(cx - 92, cy + 30, 22, 12, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx + 92, cy + 30, 22, 12, 0, 0, 7); g.fill();
}

// opts: suit, tie, hair, grey, hairStyle ('normal'|'bun'|'spiky'|'bald'), skin, glasses, scale, badge ('NEW'), shirt
export function bean({ suit = 0x2b3a5c, tie = 0xc8202a, hair = 0x3a2a1c, skin = 0xf6efe2, grey = false, hairStyle = 'normal', glasses = false, scale = 1, badge = null, noTie = false } = {}) {
  const root = new THREE.Group();
  const g = new THREE.Group(); g.scale.setScalar(scale); root.add(g);
  const hip = new THREE.Group(); hip.position.y = 0.5; g.add(hip);
  const torso = new THREE.Group(); hip.add(torso);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.28, 8, 24), toon(suit)); body.position.y = 0.26; body.scale.set(1, 1, 0.82); torso.add(body);
  if (!noTie) {
    const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.36, 3, 1), toon(0xf4f4f0)); shirt.position.set(0, 0.32, 0.15); shirt.rotation.set(0.08, Math.PI, 0); shirt.scale.z = 0.3; torso.add(shirt);
    const tieM = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.3, 4), toon(tie)); tieM.position.set(0, 0.3, 0.172); tieM.rotation.set(Math.PI + 0.1, Math.PI / 4, 0); tieM.scale.z = 0.4; torso.add(tieM);
  }
  if (badge) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 80; const x = c.getContext('2d');
    x.fillStyle = '#ffd43b'; x.fillRect(0, 0, 128, 80); x.fillStyle = '#1a1a22'; x.font = '900 46px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(badge, 64, 42);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.07), new THREE.MeshBasicMaterial({ map: t })); b.position.set(-0.1, 0.3, 0.172); b.rotation.x = -0.1; torso.add(b);
  }
  // head
  const neck = new THREE.Group(); neck.position.y = 0.58; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.2; neck.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.24, 48, 32), toon(skin)); head.add(skull);
  const cc = document.createElement('canvas'); cc.width = FACE_W; cc.height = FACE_H; const fx = cc.getContext('2d');
  const faceTex = new THREE.CanvasTexture(cc); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.2412, 48, 32), new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false }));
  face.userData.noInk = true; face.renderOrder = 2; head.add(face);
  const hc = grey ? 0x9a9aa2 : hair;
  if (hairStyle !== 'bald') {
    const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.248, 48, 24, 0, Math.PI * 2, 0, 1.15), toon(hc));
    hairM.rotation.x = -0.45; hairM.position.set(0, 0.012, -0.012); head.add(hairM);
  }
  if (grey) for (const s of [-1, 1]) { const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), toon(hc)); tuft.position.set(s * 0.2, 0.02, -0.02); tuft.scale.set(0.6, 1, 1); head.add(tuft); }
  if (hairStyle === 'bun') { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), toon(hc)); bun.position.set(0, 0.24, -0.1); head.add(bun); }
  if (hairStyle === 'spiky') for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 8), toon(hc)); const a = -0.6 + i * 0.3; sp.position.set(Math.sin(a) * 0.17, 0.22, -0.02 + Math.cos(a) * 0.04); sp.rotation.z = -a * 0.8; head.add(sp); }
  if (glasses) {
    const gm = toon(0x1a1a22);
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.009, 8, 24), gm); r.position.set(s * 0.065, -0.005, 0.228); r.rotation.y = s * 0.25; head.add(r); }
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6), gm); br.rotation.z = Math.PI / 2; br.position.set(0, 0, 0.24); head.add(br);
  }
  // crown (hidden until shown)
  const crown = new THREE.Group(); crown.visible = false; crown.position.y = 0.27; head.add(crown);
  { const gold = toon(0xffc83a); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 24, 1, true), gold); band.material.side = THREE.DoubleSide; crown.add(band);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 6), gold); sp.position.set(Math.cos(a) * 0.13, 0.07, Math.sin(a) * 0.13); crown.add(sp); const j = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), toon(i % 2 ? 0xe03a3a : 0x3a7ae0)); j.position.set(Math.cos(a) * 0.132, 0.0, Math.sin(a) * 0.132); crown.add(j); } }
  // snot bubble (hidden until used)
  const bub = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.55, roughness: 0, clearcoat: 1 }));
  bub.position.set(0.03, -0.04, 0.27); bub.visible = false; bub.userData.noInk = true; head.add(bub);
  // limbs
  const limb = (len, r, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat); m.position.y = -len / 2; return m; };
  const arms = {};
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.2, 0.42, 0); torso.add(sh);
    sh.add(limb(0.2, 0.035, toon(suit)));
    const el = new THREE.Group(); el.position.y = -0.2; sh.add(el);
    el.add(limb(0.18, 0.032, toon(suit)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 12), toon(skin)); hand.position.y = -0.2; el.add(hand);
    arms[s] = { sh, el, hand };
  }
  const legs = {};
  for (const s of [-1, 1]) {
    const h = new THREE.Group(); h.position.set(s * 0.085, 0.0, 0); hip.add(h);
    h.add(limb(0.25, 0.028, toon(0x2a2a30)));
    const kn = new THREE.Group(); kn.position.y = -0.25; h.add(kn);
    kn.add(limb(0.24, 0.026, toon(0x2a2a30)));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 10), toon(0x6b4a2c)); shoe.position.set(0, -0.25, 0.035); shoe.scale.set(0.8, 0.6, 1.4); kn.add(shoe);
    legs[s] = { h, kn };
  }
  let mode = null, blinkS = -1;
  root.face = (m, blink = 0) => { const b = blink > 0.5 ? 1 : 0; if (m === mode && b === blinkS) return; mode = m; blinkS = b; drawFace(fx, m, blink); faceTex.needsUpdate = true; };
  root.face('normal');
  // pose: { sit, lean, headTilt:[x,y,z], arm:{1:[sh,el, side],-1:[...]}, walk, bob, squash, headScale }
  root.pose = ({ sit = 0, lean = 0, leanZ = 0, headTilt = [0, 0, 0], arm = {}, walk = 0, bob = 0, squash = 0, headScale = 1 } = {}) => {
    hip.position.y = 0.5 - 0.06 * sit + bob;
    torso.rotation.set(lean, 0, leanZ);
    head.rotation.set(...headTilt); head.scale.setScalar(headScale);
    g.scale.set(scale * (1 + squash * 0.5), scale * (1 - squash), scale * (1 + squash * 0.5));
    for (const s of [-1, 1]) {
      const sw = Math.sin(walk) * 0.5 * s;
      legs[s].h.rotation.x = -1.45 * sit + sw;
      legs[s].kn.rotation.x = 1.45 * sit + Math.max(0, -sw) * 0.6;
      const [a, b, side] = arm[s] || [-sw * 0.8, -0.2, 0];
      arms[s].sh.rotation.x = a; arms[s].sh.rotation.z = s * (0.12 + (side || 0)); arms[s].el.rotation.x = b;
    }
  };
  root.pose();
  root.head = head; root.crown = crown; root.bubble = bub; root.arms = arms;
  root.headWorld = () => head.getWorldPosition(new THREE.Vector3());
  root.handWorld = (s) => arms[s].hand.getWorldPosition(new THREE.Vector3());
  root.traverse(o => { if (o.isMesh && !o.userData.noInk) { o.castShadow = true; o.receiveShadow = true; } });
  return root;
}

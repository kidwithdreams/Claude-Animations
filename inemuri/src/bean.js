// A "bean" office character: big round head with a drawn face, capsule body, stick limbs.
import * as THREE from 'three';
import { toon } from './toon.js';

const FACE_W = 1024, FACE_H = 512;
// face modes: 'normal' | 'sleep' | 'wide' | 'grin' | 'smug'
function drawFace(g, mode, blink = 0) {
  g.clearRect(0, 0, FACE_W, FACE_H);
  const cx = FACE_W * 0.25, cy = FACE_H * 0.5;   // +z on the sphere
  const ink = '#1a1a22';
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = ink; g.fillStyle = ink;
  const eye = (ex, ey) => {
    if (mode === 'sleep') { g.lineWidth = 7; g.beginPath(); g.arc(ex, ey - 6, 20, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); return; }
    if (mode === 'grin') { g.lineWidth = 8; g.beginPath(); g.arc(ex, ey + 14, 22, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); return; }
    if (mode === 'wide') { g.fillStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.ellipse(ex, ey, 22, 28, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(ex, ey + 2, 7, 0, 7); g.fill(); return; }
    if (blink > 0.5) { g.lineWidth = 6; g.beginPath(); g.moveTo(ex - 14, ey); g.lineTo(ex + 14, ey); g.stroke(); return; }
    g.beginPath(); g.ellipse(ex, ey, 8, 11, 0, 0, 7); g.fill();
    if (mode === 'smug') { g.lineWidth = 6; g.beginPath(); g.moveTo(ex - 20, ey - 22); g.lineTo(ex + 20, ey - 16); g.stroke(); }
  };
  eye(cx - 52, cy - 10); eye(cx + 52, cy - 10);
  g.fillStyle = ink;
  if (mode === 'grin') {
    // big toothy grin
    g.lineWidth = 7; g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(cx - 62, cy + 34); g.quadraticCurveTo(cx, cy + 40, cx + 62, cy + 34); g.quadraticCurveTo(cx + 58, cy + 96, cx, cy + 100); g.quadraticCurveTo(cx - 58, cy + 96, cx - 62, cy + 34); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 4; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 22, cy + 38); g.lineTo(cx + i * 22, cy + 98); g.stroke(); }
    g.beginPath(); g.moveTo(cx - 58, cy + 66); g.lineTo(cx + 58, cy + 66); g.stroke();
  } else if (mode === 'wide') {
    g.beginPath(); g.ellipse(cx, cy + 58, 16, 20, 0, 0, 7); g.fill();
  } else if (mode === 'sleep') {
    g.beginPath(); g.ellipse(cx + 6, cy + 54, 12, 9, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(140,200,255,0.9)'; g.beginPath(); g.ellipse(cx + 22, cy + 76, 6, 12, 0, 0, 7); g.fill();   // drool
  } else {
    g.lineWidth = 6; g.beginPath(); g.arc(cx, cy + 30, 30, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
  }
  // cheeks
  g.fillStyle = 'rgba(255,140,140,0.25)'; g.beginPath(); g.ellipse(cx - 92, cy + 30, 22, 12, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx + 92, cy + 30, 22, 12, 0, 0, 7); g.fill();
}

export function bean({ suit = 0x2b3a5c, tie = 0xc8202a, hair = 0x3a2a1c, skin = 0xf6efe2, grey = false } = {}) {
  const g = new THREE.Group();
  const hip = new THREE.Group(); hip.position.y = 0.5; g.add(hip);
  const torso = new THREE.Group(); hip.add(torso);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.28, 8, 24), toon(suit)); body.position.y = 0.26; body.scale.set(1, 1, 0.82); torso.add(body);
  const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.36, 3, 1), toon(0xf4f4f0)); shirt.position.set(0, 0.32, 0.15); shirt.rotation.set(0.08, Math.PI, 0); shirt.scale.z = 0.3; torso.add(shirt);
  const tieM = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.3, 4), toon(tie)); tieM.position.set(0, 0.3, 0.172); tieM.rotation.set(Math.PI + 0.1, Math.PI / 4, 0); tieM.scale.z = 0.4; torso.add(tieM);
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.01), toon(0xffffff)); badge.position.set(0.1, 0.28, 0.16); badge.rotation.x = -0.1; torso.add(badge);
  // head
  const neck = new THREE.Group(); neck.position.y = 0.58; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.2; neck.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.24, 48, 32), toon(skin)); head.add(skull);
  const [c, x] = (() => { const cc = document.createElement('canvas'); cc.width = FACE_W; cc.height = FACE_H; return [cc, cc.getContext('2d')]; })();
  const faceTex = new THREE.CanvasTexture(c); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.2412, 48, 32), new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false }));
  face.userData.noInk = true; face.renderOrder = 2; head.add(face);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.248, 48, 24, 0, Math.PI * 2, 0, 1.15), toon(grey ? 0x9a9aa2 : hair));
  hairM.rotation.x = -0.45; hairM.position.set(0, 0.012, -0.012); head.add(hairM);
  if (grey) { for (const s of [-1, 1]) { const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), toon(0x9a9aa2)); tuft.position.set(s * 0.2, 0.02, -0.02); tuft.scale.set(0.6, 1, 1); head.add(tuft); } }
  // arms (shoulder -> elbow -> hand), legs (hip -> knee -> foot)
  const limb = (len, r, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat); m.position.y = -len / 2; return m; };
  const arms = {};
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.2, 0.42, 0); torso.add(sh);
    sh.add(limb(0.2, 0.035, toon(suit)));
    const el = new THREE.Group(); el.position.y = -0.2; sh.add(el);
    el.add(limb(0.18, 0.032, toon(suit)));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 12), toon(skin)); hand.position.y = -0.2; el.add(hand);
    arms[s] = { sh, el };
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
  g.face = (m, blink = 0) => { const b = blink > 0.5 ? 1 : 0; if (m === mode && b === blinkS) return; mode = m; blinkS = b; drawFace(x, m, blink); faceTex.needsUpdate = true; };
  g.face('normal');
  // pose: { sit, lean, headTilt:[x,y,z], arm:{1:[sh,el],-1:[...]}, walk }
  g.pose = ({ sit = 0, lean = 0, headTilt = [0, 0, 0], arm = {}, walk = 0, bob = 0 } = {}) => {
    hip.position.y = 0.5 - 0.06 * sit + bob;
    torso.rotation.x = lean;
    head.rotation.set(...headTilt);
    for (const s of [-1, 1]) {
      const sw = Math.sin(walk) * 0.5 * s;
      legs[s].h.rotation.x = -1.45 * sit + sw;
      legs[s].kn.rotation.x = 1.45 * sit + Math.max(0, -sw) * 0.6;
      const [a, b] = arm[s] || [-sw * 0.8, -0.2];
      arms[s].sh.rotation.x = a; arms[s].sh.rotation.z = s * 0.12; arms[s].el.rotation.x = b;
    }
  };
  g.pose();
  g.head = head; g.headWorld = () => head.getWorldPosition(new THREE.Vector3());
  g.traverse(o => { if (o.isMesh && !o.userData.noInk) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

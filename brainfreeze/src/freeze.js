// Props for "Brain Freeze": ice-cream cone, ice shell, head cross-section, blood vessels.
import * as THREE from 'three';
import { rng, glowTexture } from './textures.js';

const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const cv = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const ctex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// ---------- ice-cream cone (tip at the origin, scoops up +y), ~0.2 m tall ----------
export function iceCream() {
  const g = new THREE.Group();
  const [c, x] = cv(256);
  x.fillStyle = '#d99a4e'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#a8692c'; x.lineWidth = 6;
  for (let i = -256; i < 512; i += 34) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 256, 256); x.stroke(); x.beginPath(); x.moveTo(i + 256, 0); x.lineTo(i, 256); x.stroke(); }
  const wt = ctex(c); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(3, 2);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.13, 32, 1, true), new THREE.MeshStandardMaterial({ map: wt, roughness: 0.8, side: THREE.DoubleSide }));
  cone.rotation.x = Math.PI; cone.position.y = 0.065; g.add(cone);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.006, 10, 40), new THREE.MeshStandardMaterial({ color: 0xc88a42, roughness: 0.8 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.13; g.add(rim);
  const scoopMat = (col) => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.5, sheenColor: new THREE.Color(0xffffff) });
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 40, 28), scoopMat(0xf7b6c8)); s1.position.y = 0.155; s1.scale.set(1, 0.9, 1); g.add(s1);
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 40, 28), scoopMat(0xf6efe0)); s2.position.y = 0.212; s2.scale.set(1, 0.92, 1); g.add(s2);
  // drips
  for (let i = 0; i < 5; i++) { const a = i * 1.3; const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.012 + (i % 3) * 0.006, 4, 8), scoopMat(0xf7b6c8)); d.position.set(Math.cos(a) * 0.037, 0.128, Math.sin(a) * 0.037); g.add(d); }
  g.top = s2;
  return shadow(g);
}

// ---------- icy shell for a mesh (grows over it) + crystal shards ----------
export function iceShell(target, { seed = 3, shards = 90 } = {}) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(target.geometry, new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.0, emissive: 0x16304a, envMapIntensity: 2.5, depthWrite: false }));
  shell.renderOrder = 5; g.add(shell);
  const shardMat = new THREE.MeshPhysicalMaterial({ color: 0xe6f6ff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9, emissive: 0x2a5070 });
  const inst = new THREE.InstancedMesh(new THREE.ConeGeometry(0.04, 0.22, 5), shardMat, shards);
  inst.frustumCulled = false; g.add(inst);
  const r = rng(seed), pos = target.geometry.attributes.position, nrm = target.geometry.attributes.normal;
  const S = Array.from({ length: shards }, () => { const i = Math.floor(r() * pos.count); return { p: new THREE.Vector3().fromBufferAttribute(pos, i), n: new THREE.Vector3().fromBufferAttribute(nrm, i).normalize(), d: r(), s: 0.5 + r() * 0.9, tw: r() * 6 }; });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  g.set = (k) => {   // 0..1 frozen amount
    shell.material.opacity = 0.6 * k; shell.scale.setScalar(1 + 0.05 * k);
    S.forEach((o, i) => {
      const a = THREE.MathUtils.clamp((k - o.d * 0.6) / 0.4, 0, 1);
      q.setFromUnitVectors(up, o.n).multiply(new THREE.Quaternion().setFromAxisAngle(up, o.tw));
      p.copy(o.p).addScaledVector(o.n, 0.06 * a * o.s);
      sc.set(a * o.s, a * o.s, a * o.s);
      if (a <= 0) sc.setScalar(0.0001);
      m4.compose(p, q, sc); inst.setMatrixAt(i, m4);
    });
    inst.instanceMatrix.needsUpdate = true;
  };
  g.set(0);
  target.add(g);
  return g;
}

// ---------- head cross-section (side profile facing +x), ≈ 2.4 units tall ----------
const PROFILE = [[-0.98, 0.1], [-0.92, 0.7], [-0.55, 1.1], [0.0, 1.2], [0.5, 1.05], [0.82, 0.68], [0.9, 0.3], [0.97, 0.18], [1.16, -0.08], [1.1, -0.16], [0.96, -0.22], [1.0, -0.33], [0.97, -0.43], [1.01, -0.53], [0.95, -0.62], [0.88, -0.85], [0.6, -0.98], [0.3, -1.0], [0.24, -1.6], [-0.42, -1.6], [-0.5, -0.95], [-0.82, -0.55]];
export function headSection({ depth = 0.5 } = {}) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(PROFILE.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  const pts = curve.getPoints(160).map(v => new THREE.Vector2(v.x, v.y));
  const shape = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 4 });
  const bb = { x0: -1.05, x1: 1.25, y0: -1.7, y1: 1.3 };
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - bb.x0) / (bb.x1 - bb.x0), (pos.getY(i) - bb.y0) / (bb.y1 - bb.y0));
  // the cut face: anatomy painted on a canvas in the same coordinates
  const W = 1024, H = Math.round(1024 * (bb.y1 - bb.y0) / (bb.x1 - bb.x0));
  const [c, x] = cv(W, H);
  const P = (px, py) => [(px - bb.x0) / (bb.x1 - bb.x0) * W, (1 - (py - bb.y0) / (bb.y1 - bb.y0)) * H];
  const S = W / (bb.x1 - bb.x0);
  x.fillStyle = '#e9a183'; x.fillRect(0, 0, W, H);   // tissue
  // skull + brain
  x.fillStyle = '#f3ead8'; x.beginPath(); x.ellipse(...P(-0.08, 0.5), 0.86 * S, 0.66 * S, -0.08, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f0a7b3'; x.beginPath(); x.ellipse(...P(-0.08, 0.5), 0.76 * S, 0.56 * S, -0.08, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(190,90,110,0.6)'; x.lineWidth = 6; const r = rng(4);
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, rr = r() * 0.6; const [cx, cy] = P(-0.08 + Math.cos(a) * rr * 0.9, 0.5 + Math.sin(a) * rr * 0.65); x.beginPath(); x.arc(cx, cy, 20 + r() * 40, r() * 6, r() * 6 + 2.4); x.stroke(); }
  // nasal cavity + sinus
  x.fillStyle = '#7a2a2a'; x.beginPath(); x.ellipse(...P(0.62, 0.0), 0.3 * S, 0.12 * S, -0.15, 0, Math.PI * 2); x.fill();
  // hard palate (the roof of the mouth)
  x.fillStyle = '#f7c3c3'; x.beginPath(); x.ellipse(...P(0.5, -0.2), 0.48 * S, 0.06 * S, 0, 0, Math.PI * 2); x.fill();
  // mouth cavity + throat
  x.fillStyle = '#4a1414'; x.beginPath(); x.ellipse(...P(0.52, -0.38), 0.47 * S, 0.14 * S, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(...P(0.1, -0.35)); x.lineTo(...P(0.22, -0.4)); x.lineTo(...P(0.12, -1.6)); x.lineTo(...P(-0.08, -1.6)); x.closePath(); x.fill();
  // teeth
  x.fillStyle = '#fbf8f0'; for (const yy of [-0.27, -0.5]) { const [tx, ty] = P(0.88, yy); x.fillRect(tx - 0.06 * S, ty - 0.035 * S, 0.1 * S, 0.07 * S); }
  // spine
  x.fillStyle = '#efe2c8'; for (let i = 0; i < 4; i++) { const [sx, sy] = P(-0.3, -0.75 - i * 0.22); x.fillRect(sx - 0.12 * S, sy - 0.08 * S, 0.24 * S, 0.16 * S); }
  const faceMat = new THREE.MeshStandardMaterial({ map: ctex(c), roughness: 0.6 });
  const skinMat = new THREE.MeshPhysicalMaterial({ color: 0xd99b7a, roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color(0xffc8b0) });
  const head = new THREE.Mesh(geo, [faceMat, skinMat]);
  g.add(head);
  // hair cap on the back/top
  const hair = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.12, 12, 60, Math.PI * 0.75), new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.85 }));
  hair.position.set(-0.08, 0.15, depth / 2); hair.rotation.z = 0.55; hair.scale.set(1, 1, 3.4); g.add(hair);
  // eye (side)
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })); eye.position.set(0.82, 0.35, depth * 0.5); eye.scale.z = 4; g.add(eye);
  // tongue: separate mesh in front of the cut face so it can move
  const ts = new THREE.Shape(); ts.moveTo(0.1, -0.5); ts.bezierCurveTo(0.3, -0.36, 0.7, -0.36, 0.84, -0.44); ts.bezierCurveTo(0.9, -0.5, 0.7, -0.56, 0.4, -0.55); ts.bezierCurveTo(0.2, -0.55, 0.1, -0.52, 0.1, -0.5);
  const tongue = new THREE.Mesh(new THREE.ExtrudeGeometry(ts, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 }), new THREE.MeshPhysicalMaterial({ color: 0xd8565f, roughness: 0.3, clearcoat: 0.6 }));
  tongue.position.z = depth + 0.06; g.add(tongue);
  g.tongue = tongue; g.depth = depth; g.front = depth + 0.08;
  g.at = (px, py) => new THREE.Vector3(px, py, depth + 0.08);
  return shadow(g);
}

// ---------- blood vessels on tissue: swell(-1..1) tightens / widens, cold 0..1 tints them blue ----------
export function vessels({ seed = 9, n = 7 } = {}) {
  const g = new THREE.Group();
  const r = rng(seed);
  const [c, x] = cv(512); x.fillStyle = '#e59a8c'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,200,190' : '170,80,80'},0.18)`; x.beginPath(); x.arc(r() * 512, r() * 512, 4 + r() * 18, 0, 7); x.fill(); }
  const tissue = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshPhysicalMaterial({ map: ctex(c), roughness: 0.35, clearcoat: 0.7, sheen: 0.5, sheenColor: new THREE.Color(0xffd0d0) }));
  tissue.rotation.x = -Math.PI / 2; g.add(tissue);
  const uni = { uSwell: { value: 0 } };
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xc8202a, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 0.4, sheenColor: new THREE.Color(0xff8080) });
  mat.onBeforeCompile = (sh) => { sh.uniforms.uSwell = uni.uSwell; sh.vertexShader = 'uniform float uSwell;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * uSwell;'); };
  const curves = [];
  for (let i = 0; i < n; i++) {
    const z0 = -5 + i * (10 / (n - 1)) + (r() - 0.5) * 0.6;
    const pts = []; for (let k = 0; k <= 8; k++) pts.push(new THREE.Vector3(-7 + k * 1.75, 0.12, z0 + Math.sin(k * 0.9 + i) * 0.6 + (r() - 0.5) * 0.3));
    const cu = new THREE.CatmullRomCurve3(pts); curves.push(cu);
    const rad = 0.16 + r() * 0.08;
    const m = new THREE.Mesh(new THREE.TubeGeometry(cu, 96, rad, 16, false), mat); g.add(m);
    // a branch
    const b0 = cu.getPoint(0.3 + r() * 0.4); const bp = [b0]; for (let k = 1; k < 5; k++) bp.push(b0.clone().add(new THREE.Vector3(k * 0.5, 0, (r() < 0.5 ? -1 : 1) * k * 0.45)));
    const bc = new THREE.CatmullRomCurve3(bp); curves.push(bc);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(bc, 48, rad * 0.6, 12, false), mat));
  }
  // blood cells flowing along the main vessels
  const N = 260, cells = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshStandardMaterial({ color: 0xff4040, emissive: 0x500808, roughness: 0.4 }), N);
  cells.frustumCulled = false; g.add(cells);
  const C = Array.from({ length: N }, () => ({ c: Math.floor(r() * n) * 2, u: r(), o: new THREE.Vector3((r() - 0.5) * 0.1, (r() - 0.5) * 0.1, (r() - 0.5) * 0.1) }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 0.5, 1);
  const red = new THREE.Color(0xc8202a), blue = new THREE.Color(0x5a6fa8);
  g.set = ({ swell = 0, cold = 0, t = 0, speed = 0.12 } = {}) => {
    uni.uSwell.value = swell * 0.09;
    mat.color.copy(red).lerp(blue, cold); mat.emissive.setRGB(0.25 * Math.max(0, swell), 0.0, 0.0);
    C.forEach((o, i) => {
      const u = (o.u + t * speed * (1 - 0.7 * cold)) % 1;
      p.copy(curves[o.c].getPoint(u)).add(o.o);
      s.set(1, 0.5, 1).multiplyScalar(1 + 0.2 * swell);
      m4.compose(p, q.setFromEuler(new THREE.Euler(u * 9, i, 0)), s); cells.setMatrixAt(i, m4);
    });
    cells.instanceMatrix.needsUpdate = true;
  };
  g.set({});
  return shadow(g);
}

// a pulse tube following points: pulse.set(progress 0..1, amp)
export function pulseLine(points, { r = 0.03, color = 0xff2a1a } = {}) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uP: { value: 0 }, uAmp: { value: 0 }, uCol: { value: new THREE.Color(color) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uP, uAmp; uniform vec3 uCol; varying vec2 vUv;
      void main(){ float d = vUv.x - uP; float head = exp(-d*d*900.0); float trail = d < 0.0 ? exp(d*6.0) * 0.45 : 0.0;
        float a = uAmp*(0.25 + head*1.6 + trail); gl_FragColor = vec4(uCol*(1.0+head*2.0), clamp(a,0.,1.)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, r, 10, false), mat); m.renderOrder = 9;
  m.set = (p, amp = 1) => { mat.uniforms.uP.value = p; mat.uniforms.uAmp.value = amp; };
  m.curve = curve;
  return m;
}
let _g = null;
export function glow(color = 0xffffff, size = 1) {
  _g = _g || glowTexture();
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _g, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }));
  s.scale.setScalar(size); return s;
}
// soft flat disc of colour lying on the cut face (frost / warmth)
export function stain(color = 0x8fd0ff) {
  const [c, x] = cv(256); const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ctex(c, false), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.renderOrder = 8; return m;
}

// Toon office story — renderer, shot runner, overlay and captions.
import * as THREE from 'three';
import { InkRenderer } from './toon.js';
import { SHOTS, DURATION } from './shots.js';
import { CAPTIONS } from './captions.js';
import { wipe, captions, OW, OH } from './fx.js';

const W = 720, H = 1280;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').prepend(renderer.domElement);
const ink = new InkRenderer(renderer, W, H, { thick: 2.4 });
const fxc = document.getElementById('fx'); const g = fxc.getContext('2d');
const built = new Map();
const get = (i) => { if (!built.has(i)) built.set(i, SHOTS[i].build()); return built.get(i); };
const WIPES = ['#ffd43b', '#4dabf7', '#ff6b6b', '#51cf66', '#cc5de8'];

window.DURATION = DURATION;
window.renderAt = (t) => {
  let i = SHOTS.findIndex(s => t >= s.s && t < s.e); if (i < 0) i = SHOTS.length - 1;
  const S = SHOTS[i], lt = t - S.s, shot = get(i);
  const r = shot.update(lt, t) || {};
  const c = shot.camera; c.aspect = W / H; c.updateProjectionMatrix();
  if (r.shake) { const k = r.shake * 0.0012; c.translateX(Math.sin(t * 61) * k); c.translateY(Math.cos(t * 47) * k); }
  c.updateMatrixWorld(true);
  ink.render(shot.scene, c, t);
  g.clearRect(0, 0, OW, OH);
  if (shot.fx) shot.fx(g, lt, t);
  if (i > 0) wipe(g, Math.min(1, lt / 0.28), WIPES[i % WIPES.length]);
  captions(g, CAPTIONS, t);
  return i;
};
window.ready = Promise.all([document.fonts.load('900 60px Cap'), document.fonts.ready]).then(() => true);
const qs = new URLSearchParams(location.search);
if (qs.has('t')) window.ready.then(() => window.renderAt(parseFloat(qs.get('t'))));

import { W, H, clamp, lerp, range, easeInOut, wob, clock, label, captions, grain, vignette } from './draw.js';
import { SHOTS, DURATION } from './scenes.js';
import { CAPTIONS } from './captions.js';

const cv = document.getElementById('c');
const c = cv.getContext('2d');
window.DURATION = DURATION;

window.renderAt = (t) => {
  let i = SHOTS.findIndex(s => t >= s.s && t < s.e);
  if (i < 0) i = SHOTS.length - 1;
  const S = SHOTS[i], lt = t - S.s, d = S.e - S.s;
  const k = easeInOut(clamp(lt / Math.min(d, 6)));
  const cam = S.cam || {};
  const z = cam.z ? lerp(cam.z[0], cam.z[1], k) : 1;
  let fx = 540, fy = 960;
  if (cam.f) { if (Array.isArray(cam.f[0])) { fx = lerp(cam.f[0][0], cam.f[1][0], k); fy = lerp(cam.f[0][1], cam.f[1][1], k); } else { fx = cam.f[0]; fy = cam.f[1]; } }
  fy += S.lift || 0;
  const sh = (typeof cam.shake === 'function' ? cam.shake(lt) : (cam.shake || 0)) + 2.5;   // constant subtle handheld tension
  const sx = wob(t, 1.7, 1) * sh, sy = wob(t, 1.9, 7) * sh;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.save();
  c.translate(W / 2 + sx, H / 2 + sy); c.scale(z, z); c.translate(-fx, -fy);
  S.draw(c, lt, t, d);
  c.restore();
  // overlays (screen space)
  vignette(c, 0.7);
  grain(c, t, 0.07);
  const ck = typeof S.clock === 'function' ? S.clock(lt) : S.clock;
  clock(c, ck, t);
  if (S.label) {
    const prev = SHOTS[i - 1], cont = prev && prev.label === S.label;
    label(c, S.label, cont ? 1 : range(lt, 0, 0.3));
  }
  captions(c, CAPTIONS, t);
  return i;
};
const qs = new URLSearchParams(location.search);
window.ready = document.fonts.load('900 92px Mont').then(() => Promise.all([document.fonts.load('800 40px Mont'), document.fonts.load('700 34px Mono'), document.fonts.load('700 40px Mont')])).then(() => true);
if (qs.has('t')) window.ready.then(() => window.renderAt(parseFloat(qs.get('t'))));

// Shared drawing kit for STUCK: palette, easing, shapes, characters, clock, labels, captions, grain.
export const W = 1080, H = 1920;

export const C = {
  night: '#070b16', navy: '#0d1426', navy2: '#141e38', blue: '#1f3360', blue2: '#2c4a86', steel: '#3a4a66', steel2: '#56688a',
  light: '#7fb2ff', ice: '#bcd8ff', orange: '#ff9a3c', amber: '#ffbe6b', warm: '#ffd9a0', red: '#ff2a2a', red2: '#c0141c',
  skin: '#c98f6a', skinD: '#8f5f45', hair: '#17110d', jacket: '#2f5e8e', jacketD: '#1f3f63', pants: '#1a2236', guard: '#3a3f4a',
  concrete: '#2a2e38', concrete2: '#353a46', white: '#f4f6fb', yellow: '#ffd43b',
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = t => 1 - (1 - clamp(t)) ** 3;
export const easeIn = t => clamp(t) ** 3;
export const easeInOut = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; };
export const backOut = t => { t = clamp(t); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// smooth pseudo-noise in [-1,1]
export const wob = (t, f = 1, seed = 0) => Math.sin(t * f * 1.3 + seed) * .5 + Math.sin(t * f * 2.9 + seed * 2.3) * .3 + Math.sin(t * f * 5.1 + seed * 4.1) * .2;
// flicker 0..1 (deterministic)
export const flick = (t, rate = 18, seed = 1) => { const k = Math.floor(t * rate); const r = Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453; return r - Math.floor(r); };

export function rr(c, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
export function fillRR(c, x, y, w, h, r, fill) { rr(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); }
export function circle(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
export function line(c, x1, y1, x2, y2, w, col, cap = 'round') { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.strokeStyle = col; c.lineCap = cap; c.stroke(); }
export function glow(c, x, y, r, col, a = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
export function shade(c, a, col = '#000') { c.save(); c.globalAlpha = clamp(a); c.fillStyle = col; c.fillRect(-W, -H, W * 3, H * 3); c.restore(); }
export function vgrad(c, x, y, w, h, stops) { const g = c.createLinearGradient(0, y, 0, y + h); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(x, y, w, h); }
export function text(c, s, x, y, { size = 40, weight = 800, font = 'Mont', col = C.white, align = 'center', base = 'middle', alpha = 1, spacing = 0 } = {}) {
  c.save(); c.globalAlpha = alpha; c.font = `${weight} ${size}px ${font}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = base;
  if (spacing) c.letterSpacing = spacing + 'px';
  c.fillText(s, x, y); c.restore();
}

// ---------------- characters ----------------
// a person standing on (x, y). Angles in radians from straight down; positive swings toward +x.
// o: { s, face (-1 left, 0 front, 1 right), lean, armL:[sh, el], armR, legL:[hip, knee], legR, sit, eyes, look:[dx,dy], blink,
//      body, cap, sweat, shake, fistR, fistL }
export function person(c, o) {
  const s = o.s ?? 1, face = o.face ?? 0;
  const body = o.body ?? C.jacket, bodyD = o.bodyD ?? C.jacketD, skin = o.skin ?? C.skin;
  c.save();
  c.translate(o.x + (o.shake ? Math.sin(o.shake * 77) * 3 : 0), o.y);
  c.scale(s, s);
  const sit = o.sit ?? 0;     // 0 standing .. 1 seated on the floor
  const hipY = lerp(-250, -120, sit);
  const lean = o.lean ?? 0;
  const legW = 36, armW = 30;
  const leg = (k, ang, def) => {
    const [h, kn] = ang ?? def;
    const x0 = k * 22, y0 = hipY;
    const x1 = x0 + Math.sin(h) * 125, y1 = y0 + Math.cos(h) * 125;
    const a2 = h + kn, x2 = x1 + Math.sin(a2) * 125, y2 = y1 + Math.cos(a2) * 125;
    c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = legW; c.strokeStyle = o.pants ?? C.pants; c.lineCap = 'round'; c.stroke();
    fillRR(c, x2 - 22 + (face || 1) * 10, y2 - 8, 46, 22, 10, '#0c0f18');
  };
  // seated: side view -> thighs forward, shins down; front view -> knees out to the sides
  const sf = face || 0;
  const sitL = sf ? [lerp(0, 1.45 * sf, sit), lerp(0, -1.2 * sf, sit)] : [lerp(0, 1.25, sit), lerp(0, -1.75, sit)];
  const sitR = sf ? [lerp(0, 1.3 * sf, sit), lerp(0, -1.05 * sf, sit)] : [lerp(0, -1.25, sit), lerp(0, 1.75, sit)];
  // torso frame
  c.save(); c.translate(0, hipY); c.rotate(lean);
  const shY = -205;
  const arm = (k, ang, def, front) => {
    const [sh, el] = ang ?? def;
    const x0 = k * 52, y0 = shY + 18;
    const x1 = x0 + Math.sin(sh) * 105, y1 = y0 + Math.cos(sh) * 105;
    const a2 = sh + el, x2 = x1 + Math.sin(a2) * 98, y2 = y1 + Math.cos(a2) * 98;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = armW; c.strokeStyle = front ? body : bodyD; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
    const fist = k > 0 ? o.fistL : o.fistR;
    circle(c, x2, y2, fist ? 22 : 17, front ? skin : C.skinD);
    const cl = Math.cos(lean), sl = Math.sin(lean);
    return [o.x + s * (x2 * cl - y2 * sl), o.y + s * (hipY + x2 * sl + y2 * cl)];   // world position of the hand
  };
  c.restore();
  // back leg/arm first
  const backK = face >= 0 ? -1 : 1;
  leg(backK, backK < 0 ? o.legR : o.legL, backK < 0 ? sitR : sitL);
  c.save(); c.translate(0, hipY); c.rotate(lean);
  const hands = {};
  hands[backK < 0 ? 'r' : 'l'] = arm(backK, backK < 0 ? o.armR : o.armL, [0.12 * backK, -0.1 * backK], false);
  c.restore();
  leg(-backK, -backK < 0 ? o.legR : o.legL, -backK < 0 ? sitR : sitL);
  c.save(); c.translate(0, hipY); c.rotate(lean);
  // torso
  fillRR(c, -62, shY, 124, 225, 40, body);
  fillRR(c, -62, shY + 160, 124, 65, 26, bodyD);
  if (o.badge) { fillRR(c, 18, shY + 50, 26, 30, 6, C.amber); }
  if (o.pack) { fillRR(c, -62 - 34 * (face || -1) * -1 - 17, shY + 25, 34, 120, 14, '#20304a'); }
  // head
  const hx = face * 6, hy = shY - 62;
  c.save(); c.translate(hx, hy); c.rotate(o.headTilt ?? 0);
  circle(c, 0, 0, 60, skin);
  c.beginPath(); c.arc(0, -6, 62, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(48, -22); c.quadraticCurveTo(0, -38, -48, -22); c.closePath(); c.fillStyle = o.hairCol ?? C.hair; c.fill();
  if (o.cap) { fillRR(c, -64, -60, 128, 34, 14, '#1d2230'); fillRR(c, -10 + face * 30, -34, 84 * (face || 1) * 0.0 + 70, 14, 7, '#1d2230'); fillRR(c, -10, -55, 20, 16, 4, C.amber); }
  eyes(c, face, o.eyes ?? 'open', o.look ?? [0, 0], o.blink ?? 0, o.eyeScale ?? 1);
  if (o.sweat) {
    for (let i = 0; i < 3; i++) {
      const ph = ((o.sweat * 0.8 + i * .37) % 1);
      const sx = (i - 1) * 34 + 46 * (i === 2 ? 1 : -0.2), sy = -30 + ph * 70;
      c.save(); c.globalAlpha = Math.sin(Math.PI * ph); c.fillStyle = C.ice;
      c.beginPath(); c.moveTo(sx, sy - 12); c.quadraticCurveTo(sx + 9, sy + 4, sx, sy + 9); c.quadraticCurveTo(sx - 9, sy + 4, sx, sy - 12); c.fill(); c.restore();
    }
  }
  c.restore();
  hands[backK < 0 ? 'l' : 'r'] = arm(-backK, -backK < 0 ? o.armR : o.armL, [-0.12 * backK, 0.1 * backK], true);
  c.restore();
  c.restore();
  return hands;
}
export function eyes(c, face, mode, look, blink, k = 1) {
  const ox = face * 18;
  for (const e of [-1, 1]) {
    const x = ox + e * 22 * (1 - Math.abs(face) * 0.25), y = 2;
    c.save(); c.translate(x, y); c.scale(k, k);
    if (mode === 'closed' || blink > 0.9) {
      c.beginPath(); c.arc(0, -2, 11, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 5; c.strokeStyle = '#1a0f0a'; c.lineCap = 'round'; c.stroke();
    } else if (mode === 'happy') {
      c.beginPath(); c.arc(0, 6, 12, 1.15 * Math.PI, 1.85 * Math.PI); c.lineWidth = 6; c.strokeStyle = '#1a0f0a'; c.lineCap = 'round'; c.stroke();
    } else {
      const wide = mode === 'wide' ? 1.3 : 1;
      const ry = 14 * wide * (1 - blink);
      c.beginPath(); c.ellipse(0, 0, 10.5 * wide, Math.max(1.5, ry), 0, 0, Math.PI * 2); c.fillStyle = '#f7f3ea'; c.fill();
      const pr = mode === 'wide' ? 4.5 : 6;
      if (ry > 4) circle(c, look[0] * 4, look[1] * 4, pr, '#0d0806');
      if (mode === 'frown' || mode === 'squint') {
        // heavy lid slanting toward the nose
        c.beginPath(); c.moveTo(-16, -18); c.lineTo(16, -18); c.lineTo(16 * 1, e * 8 - (mode === 'squint' ? 0 : 2)); c.lineTo(-16, -e * 8 - 2); c.closePath();
        c.fillStyle = C.skin; c.fill();
        line(c, -14, -e * 8 - 3, 14, e * 8 - 3, 5, '#1a0f0a');
      }
    }
    c.restore();
  }
}

// a big flat hand (for close-ups). Fingers point toward +x. pose: 'point' | 'fist' | 'grip' | 'open'
export function hand(c, x, y, ang, s, pose = 'point', col = C.skin, sleeve = C.jacket) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  fillRR(c, -420, -62, 330, 124, 40, sleeve);
  fillRR(c, -120, -55, 120, 110, 42, col);   // palm
  if (pose === 'point') {
    fillRR(c, -10, -52, 150, 34, 17, col);
    for (let i = 0; i < 3; i++) fillRR(c, -20, -14 + i * 26, 52, 28, 14, col);
    fillRR(c, -80, 26, 70, 30, 15, col);
  } else if (pose === 'fist') {
    for (let i = 0; i < 4; i++) fillRR(c, -14, -52 + i * 27, 48, 29, 14, col);
    fillRR(c, -70, -66, 70, 30, 15, col);
  } else if (pose === 'grip') {
    for (let i = 0; i < 4; i++) fillRR(c, -10, -52 + i * 27, 100, 26, 13, col);
    fillRR(c, -70, -70, 90, 30, 15, col);
  } else {
    for (let i = 0; i < 4; i++) fillRR(c, -10, -60 + i * 30, 120 - Math.abs(i - 1.5) * 18, 26, 13, col);
    fillRR(c, -60, 40, 80, 30, 15, col);
  }
  c.restore();
}

// ---------------- HUD ----------------
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
function seg7(c, ch, x, y, h, on, off) {
  const w = h * 0.52, t = h * 0.12, g = t * 0.25;
  const S = {
    a: [x + g + t / 2, y, w - 2 * g - t, t, 1], d: [x + g + t / 2, y + h - t, w - 2 * g - t, t, 1], g: [x + g + t / 2, y + h / 2 - t / 2, w - 2 * g - t, t, 1],
    f: [x, y + g + t / 2, t, h / 2 - 2 * g - t / 2, 0], b: [x + w - t, y + g + t / 2, t, h / 2 - 2 * g - t / 2, 0],
    e: [x, y + h / 2 + g, t, h / 2 - 2 * g - t / 2, 0], c: [x + w - t, y + h / 2 + g, t, h / 2 - 2 * g - t / 2, 0],
  };
  const lit = SEG[ch] || '';
  for (const k of 'abcdefg') {
    const [sx, sy, sw, sh] = S[k];
    fillRR(c, sx, sy, sw, sh, t / 2, lit.includes(k) ? on : off);
  }
  return w + h * 0.16;
}
// red digital clock, top right: "FRI 19:42"
export function clock(c, label, t, alpha = 1) {
  if (!label || alpha <= 0) return;
  const [day, hm] = label.split(' ');
  c.save(); c.globalAlpha = alpha;
  const x1 = W - 44, y = 70, h = 64;
  const digits = hm.replace(':', '');
  const dw = h * 0.68;
  const totalW = 4 * dw + 26 + 92;
  const x0 = x1 - totalW;
  fillRR(c, x0 - 26, y - 22, totalW + 50, h + 44, 18, 'rgba(10,4,6,0.72)');
  c.strokeStyle = 'rgba(255,42,42,0.35)'; c.lineWidth = 2; rr(c, x0 - 26, y - 22, totalW + 50, h + 44, 18); c.stroke();
  c.shadowColor = 'rgba(255,30,30,0.9)'; c.shadowBlur = 18;
  text(c, day, x0 + 38, y + h / 2 + 2, { size: 34, weight: 700, font: 'Mono', col: C.red });
  let x = x0 + 92;
  for (let i = 0; i < 4; i++) {
    x += seg7(c, digits[i], x, y, h, C.red, 'rgba(255,40,40,0.07)');
    if (i === 1) { const on = (t % 1) < 0.6; circle(c, x + 4, y + h * 0.3, 5, on ? C.red : 'rgba(255,40,40,0.1)'); circle(c, x + 4, y + h * 0.7, 5, on ? C.red : 'rgba(255,40,40,0.1)'); x += 22; }
  }
  c.restore();
}
// fact label plate, top centre
export function label(c, s, a) {
  if (!s || a <= 0) return;
  c.save(); c.globalAlpha = clamp(a);
  c.font = `800 40px Mont`; c.letterSpacing = '1px';
  const tw = c.measureText(s).width;
  const w = tw + 110, x = (W - w) / 2, y = 196 + (1 - easeOut(a)) * -20;
  fillRR(c, x, y, w, 76, 14, 'rgba(8,10,18,0.86)');
  c.strokeStyle = 'rgba(255,190,107,0.55)'; c.lineWidth = 2; rr(c, x, y, w, 76, 14); c.stroke();
  fillRR(c, x + 22, y + 22, 32, 32, 8, C.amber);
  text(c, '!', x + 38, y + 39, { size: 28, weight: 900, col: '#140c04' });
  c.letterSpacing = '1px';
  text(c, s, x + 70, y + 40, { size: 40, weight: 800, col: C.white, align: 'left' });
  c.restore();
}
// captions: lower third, 2-4 words, words appear as they're spoken, one yellow key word
export function captions(c, CAP, t) {
  const g = CAP.find(g => t >= g.s && t < g.e);
  if (!g) return;
  c.save();
  c.font = `900 92px Mont`; c.textBaseline = 'middle';
  const gap = 32;
  const ws = g.w.map(w => c.measureText(w[0]).width);
  // wrap to at most two lines within 960px
  const lines = [[]]; let lw = 0;
  g.w.forEach((w, i) => { if (lw + ws[i] > 940 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(i); lw += ws[i] + gap; });
  const lh = 104, y0 = 1560 - (lines.length - 1) * lh / 2;
  lines.forEach((ln, li) => {
    const tw = ln.reduce((a, i) => a + ws[i], 0) + gap * (ln.length - 1);
    let x = (W - tw) / 2;
    for (const i of ln) {
      const [word, ws0] = g.w[i];
      const k = t - ws0;
      if (k >= 0) {
        const pop = 1 + 0.07 * Math.exp(-k * 14) * (k < 0.25 ? 1 : 0);
        c.save(); c.translate(x + ws[i] / 2, y0 + li * lh); c.scale(pop, pop);
        c.lineJoin = 'round'; c.lineWidth = 16; c.strokeStyle = '#000'; c.strokeText(word, -ws[i] / 2, 0);
        c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 18; c.shadowOffsetY = 6;
        c.fillStyle = i === g.key ? C.yellow : '#ffffff'; c.fillText(word, -ws[i] / 2, 0);
        c.restore();
      }
      x += ws[i] + gap;
    }
  });
  c.restore();
}
let _grain = null;
export function grain(c, t, a = 0.06) {
  if (!_grain) {
    _grain = [];
    const r = rng(9);
    for (let k = 0; k < 6; k++) {
      const g = document.createElement('canvas'); g.width = 360; g.height = 640;
      const x = g.getContext('2d'); const im = x.createImageData(360, 640);
      for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0); _grain.push(g);
    }
  }
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay';
  c.drawImage(_grain[Math.floor(t * 24) % 6], 0, 0, W, H); c.restore();
}
export function vignette(c, a = 0.65) {
  const g = c.createRadialGradient(W / 2, H * 0.48, H * 0.28, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

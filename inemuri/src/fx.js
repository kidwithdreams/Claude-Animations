// Comic overlay effects drawn on a 2D canvas over the 3D frame (720x1280).
export const OW = 720, OH = 1280;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const backOut = (t) => { t = clamp(t); const c1 = 2.2, c3 = c1 + 1; return t <= 0 ? 0 : 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
const INK = '#1a1a22';
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// world position -> overlay pixels
export function project(v, camera) { const p = v.clone().project(camera); return [(p.x + 1) / 2 * OW, (1 - p.y) / 2 * OH, p.z < 1]; }

export function burst(c, x, y, r, text, k, { fill = '#ffd43b', col = '#e0201a', rot = -0.12, spikes = 14, size = 0.42 } = {}) {
  if (k <= 0) return;
  const s = backOut(k);
  x = clamp(x, r * 1.3 + 10, OW - r * 1.3 - 10); y = clamp(y, r + 20, OH - r - 20);
  c.save(); c.translate(x, y); c.rotate(rot + Math.sin(k * 20) * 0.02); c.scale(s, s);
  c.beginPath(); for (let i = 0; i < spikes * 2; i++) { const a = i / (spikes * 2) * Math.PI * 2, rr = i % 2 ? r * 0.72 : r; c.lineTo(Math.cos(a) * rr * 1.25, Math.sin(a) * rr); } c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  if (text) { c.font = `900 ${Math.round(r * size)}px Cap`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 10; c.strokeStyle = INK; c.strokeText(text, 0, 4); c.fillStyle = col; c.fillText(text, 0, 4); }
  c.restore();
}
export function stamp(c, text, x, y, k, { col = '#e0201a', rot = -0.18, size = 64, box = true } = {}) {
  if (k <= 0) return;
  const s = k < 1 ? 2.6 - 1.6 * (1 - (1 - k) ** 3) : 1;
  y = Math.max(y, size + 40);
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha = Math.min(1, k * 3);
  c.font = `900 ${size}px Cap`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(text).width;
  if (box) { c.lineWidth = 9; c.strokeStyle = col; c.strokeRect(-w / 2 - 22, -size * 0.7, w + 44, size * 1.4); }
  c.fillStyle = col; c.fillText(text, 0, 4);
  c.restore();
}
export function redX(c, x, y, size, k) {
  if (k <= 0) return; const s = backOut(k);
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round';
  for (const [a, b] of [[-1, 1], [1, 1]]) { c.beginPath(); c.moveTo(-size * a, -size); c.lineTo(size * a, size); c.lineWidth = 46; c.strokeStyle = INK; c.stroke(); c.lineWidth = 32; c.strokeStyle = '#ff2a2a'; c.stroke(); }
  c.restore();
}
export function speedLines(c, cx, cy, a, t, { n = 46, inner = 230, col = 'rgba(26,26,34,' } = {}) {
  if (a <= 0) return;
  const r = rng(Math.floor(t * 12) + 3);
  c.save();
  for (let i = 0; i < n; i++) {
    const ang = i / n * Math.PI * 2 + r() * 0.1, r0 = inner + r() * 80, r1 = 900;
    const w = 3 + r() * 9;
    c.beginPath(); c.moveTo(cx + Math.cos(ang - w / r1) * r1, cy + Math.sin(ang - w / r1) * r1); c.lineTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); c.lineTo(cx + Math.cos(ang + w / r1) * r1, cy + Math.sin(ang + w / r1) * r1); c.closePath();
    c.fillStyle = col + (0.55 * a) + ')'; c.fill();
  }
  c.restore();
}
export function confetti(c, t, { n = 90, seed = 5 } = {}) {
  if (t <= 0) return;
  const r = rng(seed), cols = ['#ff4d6d', '#ffd43b', '#4dabf7', '#51cf66', '#cc5de8', '#ff922b'];
  for (let i = 0; i < n; i++) {
    const x0 = r() * OW, vx = (r() - 0.5) * 220, vy = 120 + r() * 260, d = r() * 0.4, rot = r() * 6, sp = 4 + r() * 8;
    const tt = t - d; if (tt < 0) continue;
    const x = x0 + vx * tt + Math.sin(tt * 4 + i) * 20, y = -40 + vy * tt + 160 * tt * tt;
    if (y > OH + 40) continue;
    c.save(); c.translate(x, y); c.rotate(rot + tt * sp); c.scale(1, Math.cos(tt * sp * 1.3));
    c.fillStyle = cols[i % cols.length]; c.fillRect(-9, -5, 18, 10); c.restore();
  }
}
// colour wipe at a cut: k 0..1 (panel slides away diagonally)
export function wipe(c, k, col = '#ffd43b') {
  if (k >= 1) return;
  const x = -200 + k * (OW + 600);
  c.save(); c.beginPath(); c.moveTo(x, 0); c.lineTo(OW + 400, 0); c.lineTo(OW + 400, OH); c.lineTo(x - 300, OH); c.closePath();
  c.fillStyle = col; c.fill(); c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); c.restore();
}
export function flash(c, a, col = '#ffffff') { if (a <= 0) return; c.save(); c.globalAlpha = a; c.fillStyle = col; c.fillRect(0, 0, OW, OH); c.restore(); }
export function exclaim(c, x, y, k, text = '!') {
  if (k <= 0) return; const s = backOut(k);
  x = clamp(x, 60, OW - 60); y = clamp(y, 90, OH - 90);
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(k * 30) * 0.08 * (1 - Math.min(1, k)));
  c.font = '900 120px Cap'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(text, 0, 0); c.fillStyle = '#ff3b3b'; c.fillText(text, 0, 0);
  c.restore();
}
// thought bubble with an icon drawn by fn(c, r)
export function thought(c, x, y, r, k, icon, tailTo = null) {
  if (k <= 0) return; const s = backOut(k);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#ffffff'; c.strokeStyle = INK; c.lineWidth = 7;
  c.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; c.moveTo(Math.cos(a) * r * 0.7 + r * 0.32, Math.sin(a) * r * 0.62); c.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.62, r * 0.32, 0, 7); } c.fill();
  c.beginPath(); c.ellipse(0, 0, r * 0.92, r * 0.8, 0, 0, 7); c.fill();
  c.restore();
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; c.beginPath(); c.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.62, r * 0.32, 0, 7); c.strokeStyle = INK; c.lineWidth = 7; c.stroke(); }
  c.beginPath(); c.ellipse(0, 0, r * 0.92, r * 0.8, 0, 0, 7); c.fillStyle = '#fff'; c.fill();
  icon(c, r * 0.62);
  c.restore();
  if (tailTo) { const [tx, ty] = tailTo; for (let i = 1; i <= 3; i++) { const f = i / 4; c.beginPath(); c.arc(x + (tx - x) * f, y + r * 0.6 * s + (ty - y - r * 0.6 * s) * f, (12 - i * 3) * s, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); } }
}
export const icons = {
  trophy(c, r) { c.fillStyle = '#ffc83a'; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(-r * 0.55, -r * 0.6); c.lineTo(r * 0.55, -r * 0.6); c.quadraticCurveTo(r * 0.5, r * 0.15, 0, r * 0.25); c.quadraticCurveTo(-r * 0.5, r * 0.15, -r * 0.55, -r * 0.6); c.fill(); c.stroke(); c.fillRect(-r * 0.1, r * 0.25, r * 0.2, r * 0.3); c.strokeRect(-r * 0.1, r * 0.25, r * 0.2, r * 0.3); c.fillRect(-r * 0.4, r * 0.55, r * 0.8, r * 0.18); c.strokeRect(-r * 0.4, r * 0.55, r * 0.8, r * 0.18); for (const s of [-1, 1]) { c.beginPath(); c.arc(s * r * 0.62, -r * 0.3, r * 0.2, 0, 7); c.stroke(); } },
  muscle(c, r) { c.fillStyle = '#f6c49a'; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(-r * 0.7, r * 0.6); c.lineTo(-r * 0.2, r * 0.6); c.quadraticCurveTo(r * 0.7, r * 0.5, r * 0.55, -r * 0.1); c.quadraticCurveTo(r * 0.5, -r * 0.55, r * 0.15, -r * 0.65); c.lineTo(r * 0.05, -r * 0.35); c.quadraticCurveTo(r * 0.25, -r * 0.2, r * 0.05, r * 0.05); c.quadraticCurveTo(-r * 0.3, -r * 0.1, -r * 0.7, r * 0.15); c.closePath(); c.fill(); c.stroke(); },
  zzz(c, r) { c.font = `900 ${r}px Cap`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#4dabf7'; c.fillText('Zz', 0, 4); },
};
export function meter(c, x, y, w, h, level, label) {
  c.save(); c.lineWidth = 7; c.strokeStyle = INK;
  c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(x, y, w, h, 14); c.fill(); c.stroke();
  c.fillRect(x + w, y + h * 0.3, 14, h * 0.4); c.strokeRect(x + w, y + h * 0.3, 14, h * 0.4);
  const col = level > 0.5 ? '#51cf66' : level > 0.25 ? '#ffd43b' : '#ff3b3b';
  c.fillStyle = col; c.beginPath(); c.roundRect(x + 8, y + 8, (w - 16) * clamp(level), h - 16, 8); c.fill();
  c.font = '900 34px Cap'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 8; c.strokeText(label, x + w / 2, y - 30); c.fillStyle = '#fff'; c.fillText(label, x + w / 2, y - 30);
  c.restore();
}
export function scroll(c, k, title, lines) {
  if (k <= 0) return;
  const W = 520, H = 640 * clamp(k * 1.2), x = (OW - W) / 2, y = 300;
  c.save(); c.lineWidth = 8; c.strokeStyle = INK;
  c.fillStyle = '#f6e7c1'; c.fillRect(x, y, W, H); c.strokeRect(x, y, W, H);
  for (const yy of [y, y + H]) { c.fillStyle = '#b5652e'; c.beginPath(); c.roundRect(x - 30, yy - 22, W + 60, 44, 22); c.fill(); c.stroke(); }
  c.save(); c.beginPath(); c.rect(x, y + 20, W, Math.max(0, H - 40)); c.clip();
  c.fillStyle = '#c0141c'; c.font = '900 64px Cap'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(title, OW / 2, y + 90);
  c.restore(); c.restore();
}
export function sign(c, x, y, k, text) {
  if (k <= 0) return; const s = backOut(k);
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.06);
  c.fillStyle = '#8a5a3a'; c.fillRect(-10, 40, 20, 160); c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(-10, 40, 20, 160);
  c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(-210, -70, 420, 140, 18); c.fill(); c.lineWidth = 9; c.stroke();
  c.font = '900 70px Cap'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e0201a'; c.fillText(text, 0, 4);
  c.restore();
}

// ---------- captions: bouncy words, one yellow key word ----------
export function captions(c, CAP, t) {
  const g = CAP.find(g => t >= g.s && t < g.e);
  if (!g) return;
  c.save(); c.font = '900 60px Cap'; c.textBaseline = 'middle';
  const gap = 34, ws = g.w.map((w, i) => c.measureText(w[0]).width + (i === g.key ? 18 : 0));
  const lines = [[]]; let lw = 0;
  g.w.forEach((w, i) => { if (lw + ws[i] > 620 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(i); lw += ws[i] + gap; });
  const lh = 70, y0 = 1010 - (lines.length - 1) * lh / 2;
  lines.forEach((ln, li) => {
    const tw = ln.reduce((a, i) => a + ws[i], 0) + gap * (ln.length - 1);
    let x = (OW - tw) / 2;
    for (const i of ln) {
      const [word, ws0] = g.w[i], k = t - ws0;
      if (k >= 0) {
        const pop = k < 0.22 ? 1 + 0.12 * Math.sin(Math.min(1, k / 0.22) * Math.PI) : 1;
        c.save(); c.translate(x + ws[i] / 2, y0 + li * lh); c.scale(pop, pop); c.rotate(i === g.key ? -0.04 : 0);
        c.lineJoin = 'round'; c.lineWidth = 12; c.strokeStyle = '#1a1a22'; c.strokeText(word, -ws[i] / 2, 0);
        c.fillStyle = i === g.key ? '#ffd43b' : '#ffffff'; c.fillText(word, -ws[i] / 2, 0);
        c.restore();
      }
      x += ws[i] + gap;
    }
  });
  c.restore();
}

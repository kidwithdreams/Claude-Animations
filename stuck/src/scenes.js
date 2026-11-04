// STUCK — the edit. Each shot: { s, e, clock, label, cam: { z: [from, to], f: [x, y] | [[x0,y0],[x1,y1]], shake }, draw(c, lt, t, d) }
import { W, H, C, clamp, lerp, range, smooth, easeOut, easeIn, easeInOut, backOut, rng, wob, flick, rr, fillRR, circle, line, glow, shade, vgrad, text, person, hand, eyes } from './draw.js';

// ---------------- environments ----------------
// elevator cabin, seen from inside facing the back wall. light 0..1, tint: 'warm' | 'blue' | 'orange'
function cabin(c, { light = 1, tint = 'warm', doors = false, t = 0, dust = 0 } = {}) {
  const lit = tint === 'blue' ? '#9cc2ff' : tint === 'orange' ? '#ff9c4a' : '#ffd9a0';
  c.fillStyle = '#0a0e18'; c.fillRect(-200, -200, W + 400, H + 400);
  // side walls (perspective trapezoids)
  const bx0 = 150, bx1 = 930, by0 = 360, by1 = 1560;
  c.fillStyle = '#1b2232'; c.beginPath(); c.moveTo(-200, -200); c.lineTo(bx0, by0); c.lineTo(bx0, by1); c.lineTo(-200, H + 200); c.closePath(); c.fill();
  c.fillStyle = '#1e2638'; c.beginPath(); c.moveTo(W + 200, -200); c.lineTo(bx1, by0); c.lineTo(bx1, by1); c.lineTo(W + 200, H + 200); c.closePath(); c.fill();
  // ceiling + floor
  c.fillStyle = '#121826'; c.beginPath(); c.moveTo(-200, -200); c.lineTo(W + 200, -200); c.lineTo(bx1, by0); c.lineTo(bx0, by0); c.closePath(); c.fill();
  c.fillStyle = '#151a24'; c.beginPath(); c.moveTo(-200, H + 200); c.lineTo(W + 200, H + 200); c.lineTo(bx1, by1); c.lineTo(bx0, by1); c.closePath(); c.fill();
  for (let i = 1; i < 6; i++) { const k = i / 6; line(c, lerp(bx0, -200, k), lerp(by1, H + 200, k), lerp(bx1, W + 200, k), lerp(by1, H + 200, k), 2, 'rgba(255,255,255,0.03)'); }
  // back wall: brushed steel panels
  c.fillStyle = '#2a3346'; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  for (let i = 0; i < 3; i++) { const x = bx0 + 20 + i * 255; fillRR(c, x, by0 + 24, 235, by1 - by0 - 48, 10, i === 1 ? '#323c52' : '#2e374c'); }
  for (let i = 0; i < 40; i++) line(c, bx0 + 20, by0 + 40 + i * 28, bx1 - 20, by0 + 40 + i * 28, 1, 'rgba(255,255,255,0.025)');
  // handrail
  fillRR(c, bx0 + 10, 1180, bx1 - bx0 - 20, 22, 11, '#56637c'); line(c, bx0 + 60, 1202, bx0 + 60, 1230, 10, '#3d4860'); line(c, bx1 - 60, 1202, bx1 - 60, 1230, 10, '#3d4860');
  // right-wall button panel
  c.fillStyle = '#10141e'; c.beginPath(); c.moveTo(985, 780); c.lineTo(1040, 740); c.lineTo(1040, 1120); c.lineTo(985, 1100); c.closePath(); c.fill();
  for (let i = 0; i < 5; i++) circle(c, 1012, 800 + i * 60, 10, i === 4 ? '#c8a033' : '#3d4558');
  // ceiling light strip
  fillRR(c, 300, by0 - 60, 480, 30, 12, light > 0.05 ? lit : '#222');
  // lighting
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 1;
  const g = c.createRadialGradient(540, 420, 80, 540, 900, 1300);
  g.addColorStop(0, tint === 'blue' ? '#b7cdf5' : tint === 'orange' ? '#ffb070' : '#fff1d8'); g.addColorStop(1, '#1b2030');
  c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400); c.restore();
  glow(c, 540, by0 - 40, 520, tint === 'blue' ? 'rgba(120,170,255,0.35)' : tint === 'orange' ? 'rgba(255,140,60,0.35)' : 'rgba(255,215,150,0.35)', light);
  shade(c, (1 - light) * 0.82, '#02040a');
  if (dust > 0) {
    const r = rng(5);
    for (let i = 0; i < 70; i++) { const x = r() * W, sp = 120 + r() * 260, y = by0 - 40 + ((dust * sp + r() * 900) % 1300); circle(c, x, y, 2 + r() * 3, `rgba(200,210,230,${0.5 * (1 - (y - by0) / 1300)})`); }
  }
}
// cross-section: concrete shaft with a cabin. o.cabY = cabin top y, o.cabH, o.inner light, o.cables
function shaft(c, { cabY = 900, light = 0.8, tint = 'warm', cables = 4, floors = true, top = -600, people = null, t = 0 } = {}) {
  c.fillStyle = '#05070d'; c.fillRect(-300, -2000, W + 600, H + 4000);
  const x0 = 250, x1 = 830;
  // concrete walls
  for (const [a, b] of [[-300, x0], [x1, W + 300]]) {
    c.fillStyle = C.concrete; c.fillRect(a, -2000, b - a, H + 4000);
    const r = rng(a + 3);
    for (let i = 0; i < 260; i++) circle(c, a + r() * (b - a), -2000 + r() * (H + 4000), 2 + r() * 5, 'rgba(255,255,255,0.035)');
    for (let i = 0; i < 260; i++) circle(c, a + r() * (b - a), -2000 + r() * (H + 4000), 2 + r() * 4, 'rgba(0,0,0,0.18)');
  }
  // floor slabs and landing doors
  if (floors) for (let k = -6; k < 6; k++) {
    const y = 1500 - k * 620;
    c.fillStyle = C.concrete2; c.fillRect(-300, y, x0 + 300, 46); c.fillRect(x1, y, W, 46);
    fillRR(c, x0 - 14, y - 400, 14, 400, 4, '#30384a');
  }
  // rails
  line(c, x0 + 26, -2000, x0 + 26, H + 2000, 12, '#4b566c', 'butt'); line(c, x1 - 26, -2000, x1 - 26, H + 2000, 12, '#4b566c', 'butt');
  // cables
  for (let i = 0; i < cables; i++) line(c, 470 + i * 46, -2000, 470 + i * 46, cabY, 7, '#7d8aa3', 'butt');
  // cabin
  const cw = 500, ch = 520, cx = 290;
  fillRR(c, cx, cabY, cw, ch, 10, '#3a4458');
  fillRR(c, cx + 16, cabY + 16, cw - 32, ch - 32, 6, tint === 'orange' ? '#4a2c18' : tint === 'blue' ? '#1b2a48' : '#5a4630');
  glow(c, cx + cw / 2, cabY + 60, 320, tint === 'blue' ? 'rgba(120,170,255,0.6)' : tint === 'orange' ? 'rgba(255,130,50,0.6)' : 'rgba(255,210,140,0.6)', light);
  fillRR(c, cx + 140, cabY - 26, 220, 30, 6, '#2c3446');   // crosshead
  if (people) people(cx, cabY, cw, ch);
  shade(c, 0.0);
  return { x0, x1, cx, cw, ch };
}
// closed elevator doors seen from inside (close-up), gap px
function doors(c, gap, { light = 0.8, behind = null } = {}) {
  c.fillStyle = '#05070c'; c.fillRect(-200, -200, W + 400, H + 400);
  if (gap > 0 && behind) { c.save(); c.beginPath(); c.rect(540 - gap / 2, -200, gap, H + 400); c.clip(); behind(); c.restore(); }
  const L = (x0, x1) => {
    vgrad(c, x0, -200, x1 - x0, H + 400, [[0, '#4c5872'], [0.5, '#3a455c'], [1, '#2a3346']]);
    for (let i = 0; i < 60; i++) line(c, x0, -200 + i * 40, x1, -200 + i * 40, 1, 'rgba(255,255,255,0.03)');
  };
  L(-200, 540 - gap / 2); L(540 + gap / 2, W + 200);
  line(c, 540 - gap / 2, -200, 540 - gap / 2, H + 200, 4, '#1a2030'); line(c, 540 + gap / 2, -200, 540 + gap / 2, H + 200, 4, '#1a2030');
  glow(c, 540, 300, 900, 'rgba(255,215,150,0.18)', light);
  shade(c, (1 - light) * 0.7);
}
// phone in hand, screen drawn by fn(sx, sy, sw, sh)
function phone(c, screen, { x = 540, y = 930, rot = -0.06, s = 1, glowA = 1 } = {}) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  hand(c, -40, 330, -1.35, 1.25, 'grip');
  fillRR(c, -230, -440, 460, 900, 58, '#0b0d12');
  fillRR(c, -212, -422, 424, 864, 44, '#000');
  c.save(); rr(c, -212, -422, 424, 864, 44); c.clip(); screen(-212, -422, 424, 864); c.restore();
  fillRR(c, -60, -408, 120, 26, 13, '#000');
  // thumb over the edge
  fillRR(c, 150, 120, 110, 56, 28, C.skin);
  c.restore();
  if (glowA > 0) glow(c, x, y - 100, 700, 'rgba(140,180,255,0.18)', glowA);
}
function statusBar(c, sx, sy, sw, { time = '19:44', bars = 0, batt = 0.03, plane = false, battRed = true }) {
  text(c, time, sx + 54, sy + 54, { size: 30, weight: 700, col: '#fff', align: 'left' });
  if (plane) text(c, '✈', sx + sw - 170, sy + 54, { size: 32, weight: 700, col: '#fff' });
  else for (let i = 0; i < 4; i++) fillRR(c, sx + sw - 196 + i * 14, sy + 64 - i * 8 - 10, 9, 10 + i * 8, 2, i < bars ? '#fff' : 'rgba(255,255,255,0.22)');
  rr(c, sx + sw - 118, sy + 38, 60, 30, 8); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
  fillRR(c, sx + sw - 113, sy + 43, Math.max(4, 50 * batt), 20, 4, battRed && batt < 0.1 ? C.red : '#fff');
  fillRR(c, sx + sw - 56, sy + 46, 6, 14, 2, '#fff');
}
// office: rows of desks under ceiling lights; rows go dark one by one. off(i) -> 0..1
function office(c, off) {
  c.fillStyle = '#060912'; c.fillRect(-200, -200, W + 400, H + 400);
  // big windows with city
  vgrad(c, -200, 300, W + 400, 700, [[0, '#0d1a36'], [1, '#18284a']]);
  const r = rng(4);
  for (let i = 0; i < 26; i++) { const bx = -200 + i * 60 + r() * 20, bh = 150 + r() * 380; c.fillStyle = '#0a1224'; c.fillRect(bx, 1000 - bh, 52, bh); for (let k = 0; k < 14; k++) if (r() < 0.3) fillRR(c, bx + 6 + (k % 3) * 15, 1000 - bh + 14 + Math.floor(k / 3) * 26, 8, 12, 2, r() < 0.5 ? '#ffcf7a' : '#6f9cff'); }
  for (let i = 0; i < 6; i++) line(c, -200 + i * 290, 300, -200 + i * 290, 1000, 14, '#070b16', 'butt');
  c.fillStyle = '#0b0f1c'; c.fillRect(-200, 1000, W + 400, 1100);
  // rows: 0 far .. 3 near
  for (let i = 0; i < 4; i++) {
    const k = i / 3, y = lerp(1060, 1660, k), sc = lerp(0.45, 1.15, k), o = off(i);
    // ceiling light bar for this row
    const ly = lerp(250, -40, k);
    fillRR(c, 540 - 330 * sc, ly, 660 * sc, 22 * sc, 8, o < 1 ? `rgba(220,235,255,${1 - o})` : '#1a2030');
    if (o < 1) { c.save(); c.globalAlpha = (1 - o) * 0.5; c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, ly, 0, y + 80 * sc); g.addColorStop(0, 'rgba(170,200,255,0.25)'); g.addColorStop(1, 'rgba(170,200,255,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(540 - 330 * sc, ly); c.lineTo(540 + 330 * sc, ly); c.lineTo(540 + 520 * sc, y + 80 * sc); c.lineTo(540 - 520 * sc, y + 80 * sc); c.closePath(); c.fill(); c.restore(); }
    for (let d = -2; d <= 2; d++) {
      const x = 540 + d * 260 * sc;
      fillRR(c, x - 110 * sc, y, 220 * sc, 20 * sc, 4, '#1c2436');
      fillRR(c, x - 60 * sc, y - 100 * sc, 120 * sc, 80 * sc, 6, '#121828');
      fillRR(c, x - 52 * sc, y - 92 * sc, 104 * sc, 64 * sc, 4, o < 1 ? `rgba(80,130,220,${0.6 * (1 - o)})` : '#0c111e');
      fillRR(c, x - 70 * sc, y + 20 * sc, 16 * sc, 120 * sc, 3, '#121828');
      fillRR(c, x + 54 * sc, y + 20 * sc, 16 * sc, 120 * sc, 3, '#121828');
    }
  }
  shade(c, 0.15);
}
function elevatorFront(c, { x = 820, y = 1520, open = 1, inside = 1 } = {}) {
  // elevator in the office wall: frame + doors + lit interior
  const w = 300, h = 520;
  fillRR(c, x - w / 2 - 30, y - h - 40, w + 60, h + 40, 8, '#2a3244');
  c.fillStyle = '#ffcf8a'; c.fillRect(x - w / 2, y - h, w, h);
  glow(c, x, y - h / 2, 420, 'rgba(255,180,90,0.5)', inside);
  const g = (w / 2) * (1 - open);
  fillRR(c, x - w / 2, y - h, g, h, 2, '#55627d'); fillRR(c, x + w / 2 - g, y - h, g, h, 2, '#55627d');
  fillRR(c, x - 50, y - h - 34, 100, 26, 6, '#0b0e14'); text(c, '8', x, y - h - 21, { size: 22, weight: 800, font: 'Mono', col: C.orange });
}

// ---------------- shots ----------------
const sitPose = (eyesM = 'open', extra = {}) => ({ sit: 1, face: 1, eyes: eyesM, armL: [0.9, 0.5], armR: [0.75, 0.6], ...extra });
const knockPose = (k) => ({ face: 1, armR: [-2.0 + k * 0.5, -0.5 - k * 0.6], fistR: 1, armL: [0.1, -0.2], lean: 0.05 });
const knockAt = (lt, times) => { let k = 0; for (const tt of times) { const d = lt - tt; if (d > -0.18 && d < 0.12) k = Math.max(k, d < 0 ? 1 + d / 0.18 : 1 - d / 0.12); } return clamp(k); };
const ring = (c, x, y, d, col = 'rgba(255,255,255,0.7)', maxR = 160) => { if (d < 0 || d > 0.6) return; c.beginPath(); c.arc(x, y, 20 + d * maxR / 0.6, 0, Math.PI * 2); c.lineWidth = 8 * (1 - d / 0.6); c.strokeStyle = col; c.stroke(); };

export const END = 108.75;          // voice ends; black + knocks + card follow
export const DURATION = 111.8;

export const SHOTS = [
  // ===== 1. office, lights go off (FRI 19:42)
  { s: 0, e: 2.4, clock: 'FRI 19:42', cam: { z: [1.0, 1.06], f: [540, 1100] }, draw(c, lt, t) {
    const offT = [0.7, 1.15, 1.6, 2.05];
    office(c, i => (lt > offT[i] ? 1 : 0));
    elevatorFront(c, { x: 870, y: 1500, open: 1 });
    const x = lerp(220, 470, lt / 2.4);
    person(c, { x, y: 1720, s: 0.95, face: 1, pack: 1, legL: [Math.sin(lt * 7) * 0.4, 0.2], legR: [-Math.sin(lt * 7) * 0.4, 0.2], armL: [-Math.sin(lt * 7) * 0.3, -0.2], armR: [Math.sin(lt * 7) * 0.3, -0.2] });
    shade(c, 0.12 + 0.12 * offT.filter(o => lt > o).length);
  } },
  { s: 2.4, e: 4.5, clock: 'FRI 19:42', cam: { z: [1.15, 1.25], f: [760, 1180] }, draw(c, lt) {
    office(c, () => 1);
    elevatorFront(c, { x: 820, y: 1500, open: 1 });
    const k = easeInOut(range(lt, 0, 1.8));
    const x = lerp(520, 810, k);
    person(c, { x, y: 1500 + (1 - k) * 60, s: lerp(0.95, 0.8, k), face: 1, pack: 1, legL: [Math.sin(lt * 7) * 0.35 * (1 - k * 0.6), 0.2], legR: [-Math.sin(lt * 7) * 0.35 * (1 - k * 0.6), 0.2] });
    shade(c, 0.3);
    glow(c, 820, 1240, 380, 'rgba(255,170,80,0.35)');
  } },
  { s: 4.5, e: 7.24, clock: 'FRI 19:42', cam: { z: [1.0, 1.12], f: [540, 1000] }, draw(c, lt) {
    // inside the lit cabin looking out; doors slide shut at "out until Monday"
    cabin(c, { light: 1, tint: 'warm' });
    person(c, { x: 540, y: 1600, s: 1.25, face: 0, pack: 0, eyes: 'open', look: [0, -0.3] });
    const k = easeInOut(range(lt, 0.9, 2.3));
    const g = (W / 2 + 200) * k;
    vgrad(c, -200, -200, g, H + 400, [[0, '#4c5872'], [1, '#2a3346']]);
    vgrad(c, W + 200 - g, -200, g, H + 400, [[0, '#4c5872'], [1, '#2a3346']]);
    if (k > 0.98) line(c, 540, -200, 540, H + 200, 4, '#141a26');
  } },
  // ===== 2. floor display, jolt (FRI 19:43)
  { s: 7.24, e: 9.68, clock: 'FRI 19:43', cam: { z: [1.0, 1.1], f: [540, 900] }, draw(c, lt, t) {
    c.fillStyle = '#0c1018'; c.fillRect(-200, -200, W + 400, H + 400);
    fillRR(c, 190, 560, 700, 620, 40, '#05070b'); fillRR(c, 210, 580, 660, 580, 30, '#0d0607');
    const n = lt < 1.35 ? '8' : '7';
    const fl = lt > 1.2 && lt < 1.6 && flick(lt, 22) < 0.5;
    c.save(); c.shadowColor = C.orange; c.shadowBlur = 40;
    text(c, fl ? (n === '8' ? '7' : '8') : n, 600, 880, { size: 420, weight: 700, font: 'Mono', col: C.orange });
    c.beginPath(); const ay = 760 + ((lt * 1.2) % 1) * 90; c.moveTo(300, ay); c.lineTo(380, ay); c.lineTo(340, ay + 70); c.closePath(); c.fillStyle = C.orange; c.fill();
    c.restore();
    for (let i = 0; i < 30; i++) line(c, 210, 590 + i * 20, 870, 590 + i * 20, 2, 'rgba(0,0,0,0.25)');
  } },
  { s: 9.68, e: 12.56, clock: 'FRI 19:43', cam: { z: [1.05, 1.0], f: [540, 1000], shake: (lt) => (lt > 0.8 ? 26 * Math.exp(-(lt - 0.8) * 3) : 0) }, draw(c, lt) {
    const j = lt - 0.8;    // "jerked" at 10.48
    const fl = j > 0 && j < 1.2 ? (flick(lt, 16, 3) < 0.45 ? 0.15 : 1) : 1;
    cabin(c, { light: j < 0 ? 1 : (j > 1.2 ? 0.62 : fl), tint: 'warm' });
    const stag = j > 0 ? Math.sin(j * 14) * Math.exp(-j * 4) : 0;
    person(c, { x: 540 + stag * 30, y: 1600 + Math.abs(stag) * 20, s: 1.25, face: 0, eyes: j > 0.05 ? 'wide' : 'open', lean: stag * 0.15, armL: [0.25 + Math.abs(stag), -0.4], armR: [-0.25 - Math.abs(stag), 0.4] });
    // floor display above the doors, frozen
    fillRR(c, 470, 250, 140, 70, 10, '#05070b');
    text(c, j > 0 && flick(lt, 10) < 0.3 ? '' : '7', 540, 287, { size: 48, weight: 700, font: 'Mono', col: C.orange });
  } },
  // ===== 3. emergency button, no service, battery 3%
  { s: 12.56, e: 14.56, clock: 'FRI 19:44', cam: { z: [1.0, 1.12], f: [520, 900] }, draw(c, lt) {
    c.fillStyle = '#20283a'; c.fillRect(-200, -200, W + 400, H + 400);
    fillRR(c, 260, 280, 560, 1240, 40, '#141a26');
    for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) { const x = 430 + q * 220, y = 420 + r * 200; circle(c, x, y, 70, '#2c3448'); circle(c, x, y, 58, '#3a4560'); text(c, String(8 - (r * 2 + q)), x, y + 2, { size: 54, weight: 800, col: '#8b97b3' }); }
    const press = range(lt, 0.4, 0.6) - range(lt, 0.8, 1.0) + range(lt, 1.15, 1.3) - range(lt, 1.4, 1.55);
    circle(c, 540, 1300, 105, '#2a2410'); circle(c, 540, 1300, 92 - press * 6, '#c8a033');
    text(c, '🔔', 540, 1305, { size: 90, weight: 400, col: '#2a2410' });
    const hx = lerp(1300, 600, easeOut(range(lt, 0, 0.45))) - press * 40;
    hand(c, hx, 1330, Math.PI + 0.12, 1.4, 'point');
    shade(c, 0.12);
  } },
  { s: 14.56, e: 15.52, clock: 'FRI 19:44', cam: { z: [1.1, 1.2], f: [540, 1000] }, draw(c, lt) {
    // intercom grille: dead
    c.fillStyle = '#1a2130'; c.fillRect(-200, -200, W + 400, H + 400);
    fillRR(c, 290, 650, 500, 500, 250, '#0f141e');
    for (let i = 0; i < 9; i++) for (let k = 0; k < 9; k++) { const dx = (i - 4) * 46, dy = (k - 4) * 46; if (dx * dx + dy * dy < 210 * 210) circle(c, 540 + dx, 900 + dy, 13, '#05070b'); }
    circle(c, 540, 1240, 16, '#3a1212');
    text(c, 'CALL', 540, 1300, { size: 30, weight: 800, col: '#56607a' });
  } },
  { s: 15.52, e: 16.64, clock: 'FRI 19:44', cam: { z: [1.0, 1.08], f: [540, 900] }, draw(c, lt) {
    cabin(c, { light: 0.4 });
    phone(c, (sx, sy, sw, sh) => {
      vgrad(c, sx, sy, sw, sh, [[0, '#1b2846'], [1, '#0b1020']]);
      statusBar(c, sx, sy, sw, { bars: 0, batt: 0.03 });
      text(c, 'No Service', sx + sw / 2, sy + 430, { size: 54, weight: 800, col: '#fff' });
      for (let i = 0; i < 4; i++) fillRR(c, sx + sw / 2 - 70 + i * 38, sy + 330 - i * 26, 24, 30 + i * 26, 5, 'rgba(255,255,255,0.18)');
      line(c, sx + sw / 2 - 90, sy + 260, sx + sw / 2 + 90, sy + 370, 8, C.red);
    }, { y: 960 });
  } },
  { s: 16.64, e: 20.88, clock: 'FRI 19:44', label: 'SIGNAL BLOCKED', cam: { z: [0.9, 1.0], f: [540, 1050] }, draw(c, lt) {
    shaft(c, { cabY: 800, light: 0.8 });
    // signal waves from the left hit the concrete and die
    for (let i = 0; i < 6; i++) {
      const p = ((lt * 0.9 + i / 6) % 1);
      const r = 80 + p * 700;
      c.save(); c.beginPath(); c.rect(-300, -400, 250 + 300 + 10, H + 800); c.clip();
      c.beginPath(); c.arc(-260, 1060, r, -0.7, 0.7); c.lineWidth = 10; c.strokeStyle = `rgba(127,178,255,${0.8 * (1 - p)})`; c.stroke(); c.restore();
    }
    c.save(); c.fillStyle = C.light; c.beginPath(); c.moveTo(-40, 1180); c.lineTo(10, 940); c.lineTo(60, 1180); c.closePath(); c.globalAlpha = 0.9; c.fill(); c.restore();
    circle(c, 10, 930, 16, C.light);
    // blocked marks
    for (let i = 0; i < 3; i++) { const y = 900 + i * 160, a = 0.6 + 0.4 * Math.sin(lt * 6 + i); line(c, 215, y - 25, 265, y + 25, 9, `rgba(255,42,42,${a})`); line(c, 265, y - 25, 215, y + 25, 9, `rgba(255,42,42,${a})`); }
    text(c, 'METAL', 540, 1000, { size: 46, weight: 900, col: 'rgba(255,255,255,0.75)' });
    text(c, 'CONCRETE', 125, 1500, { size: 30, weight: 900, col: 'rgba(255,255,255,0.4)' });
  } },
  { s: 20.88, e: 22.96, clock: 'FRI 19:45', cam: { z: [1.0, 1.1], f: [540, 900] }, draw(c, lt) {
    cabin(c, { light: 0.35 });
    phone(c, (sx, sy, sw, sh) => {
      c.fillStyle = '#050608'; c.fillRect(sx, sy, sw, sh);
      statusBar(c, sx, sy, sw, { bars: 0, batt: 0.03 });
      const on = (lt % 0.8) < 0.5;
      rr(c, sx + 92, sy + 330, 220, 110, 20); c.lineWidth = 10; c.strokeStyle = on ? C.red : '#5a1414'; c.stroke();
      fillRR(c, sx + 316, sy + 362, 16, 46, 5, on ? C.red : '#5a1414');
      fillRR(c, sx + 108, sy + 346, 18, 78, 6, C.red);
      text(c, '3%', sx + sw / 2, sy + 560, { size: 110, weight: 900, col: C.red });
      text(c, 'Low Battery', sx + sw / 2, sy + 660, { size: 36, weight: 700, col: 'rgba(255,255,255,0.7)' });
    }, { y: 960, rot: 0.04 });
  } },
  // ===== 4. shouting, silence
  { s: 22.96, e: 24.64, clock: 'FRI 19:47', cam: { z: [1.15, 1.25], f: [540, 900], shake: () => 6 }, draw(c, lt) {
    cabin(c, { light: 0.6 });
    const sh = Math.sin(lt * 30) * 0.5 + 0.5;
    person(c, { x: 540, y: 1650, s: 1.35, face: 0, eyes: 'wide', armL: [2.6, 0.3], armR: [-2.6, -0.3], fistL: 1, fistR: 1, shake: lt });
    for (let i = 0; i < 4; i++) { const p = (lt * 1.6 + i / 4) % 1; c.beginPath(); c.arc(540, 980, 120 + p * 420, -2.4, -0.74); c.lineWidth = 12 * (1 - p); c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - p)})`; c.stroke(); }
  } },
  { s: 24.64, e: 26.56, clock: 'FRI 19:47', cam: { z: [1.25, 0.85], f: [540, 900] }, draw(c, lt) {
    shaft(c, { cabY: 640, light: 0.7 });
    for (let i = 0; i < 3; i++) { const p = clamp(lt * 0.9 + i * 0.12); c.beginPath(); c.arc(540, 900, 60 + p * 300, 0, Math.PI * 2); c.lineWidth = 6; c.strokeStyle = `rgba(255,255,255,${0.35 * (1 - p) * (1 - lt / 1.9)})`; c.stroke(); }
    shade(c, 0.25 + 0.25 * lt / 1.9);
  } },
  // ===== 5. prying the doors — DON'T CLIMB OUT
  { s: 26.56, e: 30.08, clock: 'FRI 19:52', cam: { z: [1.0, 1.15], f: [540, 950], shake: (lt) => 4 + 6 * range(lt, 1, 3) }, draw(c, lt) {
    const gap = 6 + 70 * easeInOut(range(lt, 0.8, 3.2)) + Math.sin(lt * 26) * 3 * range(lt, 0.8, 3);
    doors(c, gap, { light: 0.55, behind: () => { c.fillStyle = '#02030a'; c.fillRect(0, 0, W, H); c.fillStyle = C.concrete2; c.fillRect(0, 980, W, 70); } });
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
      const y = 760 + i * 70 + (sd > 0 ? 30 : 0);
      fillRR(c, 540 + sd * (gap / 2) - (sd > 0 ? 0 : 70) - sd * 34, y, 104, 46, 23, C.skin);
    }
    hand(c, 540 - gap / 2 - 120, 900, 0, 1.0, 'grip', C.skin);
    hand(c, 540 + gap / 2 + 120, 930, Math.PI, 1.0, 'grip', C.skin);
  } },
  { s: 30.08, e: 32.88, clock: 'FRI 19:52', label: "DON'T CLIMB OUT", cam: { z: [1.0, 1.08], f: [540, 960] }, draw(c, lt) {
    doors(c, 300, { light: 0.5, behind: () => {
      c.fillStyle = '#010205'; c.fillRect(0, 0, W, H);
      c.fillStyle = C.concrete; c.fillRect(0, 760, W, 300);
      c.fillStyle = C.concrete2; c.fillRect(0, 760, W, 40);
      for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#ffcc00' : '#111'; c.beginPath(); c.moveTo(i * 60, 1060); c.lineTo(i * 60 + 30, 1060); c.lineTo(i * 60 + 60, 1100); c.lineTo(i * 60 + 30, 1100); c.fill(); }
      vgrad(c, 0, 1100, W, 800, [[0, '#000'], [1, '#000']]);
    } });
    const p = backOut(range(lt, 0.15, 0.55));
    c.save(); c.translate(540, 950); c.scale(p, p);
    line(c, -200, -200, 200, 200, 46, C.red); line(c, 200, -200, -200, 200, 46, C.red); c.restore();
    glow(c, 540, 950, 500, 'rgba(255,40,40,0.35)', 0.5 + 0.5 * Math.sin(lt * 8));
  } },
  { s: 32.88, e: 35.52, clock: 'FRI 19:52', label: "DON'T CLIMB OUT", cam: { z: [0.85, 0.95], f: [540, 1000] }, draw(c, lt) {
    // side diagram: cabin stuck between floors, someone squeezing out over the gap
    shaft(c, { cabY: 820, light: 0.8, cables: 3 });
    // landing opening at floor y = 1120 (the slab sits mid-cabin)
    c.fillStyle = '#121624'; c.fillRect(830, 700, 400, 420);
    const k = easeInOut(range(lt, 0.3, 2.4));
    person(c, { x: lerp(720, 900, k), y: lerp(1300, 1120, k), s: 0.5, face: 1, lean: lerp(0.6, 0.1, k), armL: [-2.3, 0.2], armR: [-2.0, 0.1], legL: [-0.6, 0.9], legR: [0.2, 0.4] });
    // danger gap under the landing
    const a = 0.55 + 0.45 * Math.sin(lt * 9);
    fillRR(c, 790, 1166, 60, 560, 6, `rgba(255,30,30,${0.35 * a})`);
    c.save(); c.strokeStyle = `rgba(255,42,42,${a})`; c.lineWidth = 6; c.setLineDash([18, 12]); rr(c, 780, 1160, 80, 580, 8); c.stroke(); c.restore();
    text(c, 'GAP', 820, 1780, { size: 40, weight: 900, col: C.red, alpha: a });
  } },
  { s: 35.52, e: 38.64, clock: 'FRI 19:52', label: "DON'T CLIMB OUT", cam: { z: [1.0, 1.15], f: [700, 1150], shake: (lt) => (lt > 0.9 && lt < 1.6 ? 14 : 2) }, draw(c, lt) {
    shaft(c, { cabY: 820, light: 0.8, cables: 3 });
    c.fillStyle = '#121624'; c.fillRect(830, 700, 400, 420);
    const slip = easeIn(range(lt, 0.9, 1.7));
    person(c, { x: 900 - slip * 70, y: 1120 + slip * 760, s: 0.5, face: 1, lean: 0.1 + slip * 1.2, eyes: 'wide', armL: [-2.8, 0.2], armR: [-3.0, -0.1], legL: [-0.6, 0.9], legR: [0.2, 0.4] });
    const a = 0.55 + 0.45 * Math.sin(lt * 9);
    c.save(); c.strokeStyle = `rgba(255,42,42,${a})`; c.lineWidth = 6; c.setLineDash([18, 12]); rr(c, 780, 1160, 80, 580, 8); c.stroke(); c.restore();
    if (lt > 1.0) shade(c, 0.4 * Math.exp(-(lt - 1.0) * 2), '#ff1010');
    // stat card
    const p = easeOut(range(lt, 1.8, 2.3));
    if (p > 0) { c.save(); c.globalAlpha = p; fillRR(c, 380, 560, 640, 190, 24, 'rgba(8,10,18,0.9)'); text(c, 'MOST INJURIES =', 700, 620, { size: 40, weight: 900, col: C.white }); text(c, 'ESCAPE ATTEMPTS', 700, 690, { size: 40, weight: 900, col: C.red }); c.restore(); }
  } },
  // ===== 6. cables + safety brakes (diagram)
  ...(() => {
    const diagram = (c, lt, { cabY = 900, cables = 4, snap = -1, brake = -1, pan = 0 } = {}) => {
      c.fillStyle = '#071029'; c.fillRect(-300, -2000, W + 600, H + 4000);
      for (let i = -40; i < 80; i++) { line(c, -300, i * 60, W + 300, i * 60, 1, 'rgba(127,178,255,0.08)'); }
      for (let i = -10; i < 30; i++) { line(c, i * 60, -2000, i * 60, H + 2000, 1, 'rgba(127,178,255,0.08)'); }
      const st = 'rgba(160,200,255,0.9)';
      c.lineWidth = 5; c.strokeStyle = st;
      // shaft walls + rails
      line(c, 230, -2000, 230, H + 2000, 6, st); line(c, 850, -2000, 850, H + 2000, 6, st);
      line(c, 290, -2000, 290, H + 2000, 10, '#9fb8e0', 'butt'); line(c, 790, -2000, 790, H + 2000, 10, '#9fb8e0', 'butt');
      // sheave at the top
      c.beginPath(); c.arc(540, -900, 120, 0, Math.PI * 2); c.lineWidth = 8; c.strokeStyle = st; c.stroke(); circle(c, 540, -900, 20, st);
      // cables (snap: ends whip up)
      for (let i = 0; i < cables; i++) {
        const x = 480 + i * 40;
        if (snap >= 0) {
          const k = easeOut(clamp(snap * 2.2 - i * 0.1));
          line(c, x, -900, x, lerp(cabY - 300, -300, k), 6, C.light);
          line(c, x, cabY, x + Math.sin(i * 2 + snap * 9) * 40 * k, cabY - 180 + k * 60, 6, C.light);
          if (snap < 0.4) glow(c, x, cabY - 260, 90, 'rgba(255,240,200,0.9)', 1 - snap / 0.4);
        } else {
          line(c, x, -900, x, cabY, 6, C.light);
          glow(c, x, lerp(-900, cabY, (lt * 0.6 + i * 0.2) % 1), 50, 'rgba(127,178,255,0.8)', pan);
        }
      }
      // cabin
      c.lineWidth = 7; c.strokeStyle = C.white; rr(c, 310, cabY, 460, 520, 10); c.stroke();
      c.fillStyle = 'rgba(127,178,255,0.12)'; c.fill();
      person(c, { x: 540, y: cabY + 500, s: 0.62, face: 0, eyes: brake > 0 && brake < 0.6 ? 'wide' : 'open' });
      // safety brakes: wedges that clamp the rails
      for (const sd of [-1, 1]) for (const yy of [cabY + 30, cabY + 470]) {
        const cl = brake < 0 ? 0 : easeOut(clamp(brake * 4));
        const x = sd < 0 ? 290 + 16 + (1 - cl) * 30 : 790 - 16 - (1 - cl) * 30;
        c.fillStyle = brake < 0 ? '#5f7fb3' : C.orange;
        c.beginPath(); c.moveTo(x, yy - 30); c.lineTo(x + sd * -26, yy - 30); c.lineTo(x + sd * -26, yy + 30); c.lineTo(x, yy + 30); c.closePath(); c.fill();
        if (brake > 0 && brake < 0.5) { const r = rng(Math.floor(brake * 60) + (sd > 0 ? 7 : 0)); for (let q = 0; q < 10; q++) { const a = r() * Math.PI * 2, d = 20 + r() * 70; line(c, x, yy, x + Math.cos(a) * d, yy + Math.sin(a) * d, 4, C.amber); } glow(c, x, yy, 120, 'rgba(255,170,60,0.9)', 1 - brake * 2); }
      }
    };
    return [
      { s: 38.64, e: 40.56, clock: 'FRI 19:55', label: 'SAFETY BRAKES', cam: { z: [0.85, 0.9], f: [540, 1150] }, draw(c, lt) { diagram(c, lt, { cabY: 900 }); } },
      { s: 40.56, e: 42.96, clock: 'FRI 19:55', label: 'SAFETY BRAKES', cam: { z: [1.0, 1.0], f: [[540, 1000], [540, -500]] }, draw(c, lt) {
        diagram(c, lt, { cabY: 900, pan: 1 });
        const p = easeOut(range(lt, 1.1, 1.5));
        if (p > 0) { c.save(); c.globalAlpha = p; text(c, '4 STEEL CABLES', 540, -640, { size: 56, weight: 900, col: C.light }); c.restore(); }
      } },
      { s: 42.96, e: 44.08, clock: 'FRI 19:55', label: 'SAFETY BRAKES', cam: { z: [1.0, 1.05], f: [540, 1050], shake: (lt) => (lt > 0.4 ? 16 * Math.exp(-(lt - 0.4) * 3) : 0) }, draw(c, lt) {
        const snap = lt > 0.4 ? (lt - 0.4) : -1;
        diagram(c, lt, { cabY: 900 + (snap > 0 ? snap * snap * 260 : 0), snap });
      } },
      { s: 44.08, e: 46.72, clock: 'FRI 19:55', label: 'SAFETY BRAKES', cam: { z: [1.05, 1.15], f: [540, 1300], shake: (lt) => (lt > 0.4 && lt < 1.0 ? 18 : 0) }, draw(c, lt) {
        const fall = Math.min(lt, 0.4);
        diagram(c, lt, { cabY: 900 + 0.35 * 260 + fall * 300, snap: 1, brake: lt - 0.4 });
        const p = easeOut(range(lt, 0.9, 1.3));
        if (p > 0) { c.save(); c.globalAlpha = p; text(c, 'LOCKED', 540, 1980, { size: 70, weight: 900, col: C.orange }); c.restore(); }
      } },
    ];
  })(),
  // ===== 7. deep breath, sits down
  { s: 46.72, e: 48.16, clock: 'FRI 20:05', cam: { z: [1.6, 1.7], f: [540, 900] }, draw(c, lt) {
    cabin(c, { light: 0.6 });
    const br = Math.sin(clamp(lt / 1.4) * Math.PI);
    person(c, { x: 540, y: 1700, s: 1.4 + br * 0.03, face: 0, eyes: lt > 0.6 && lt < 1.2 ? 'closed' : 'open', look: [0, -0.4], headTilt: -br * 0.06 });
  } },
  { s: 48.16, e: 50.24, clock: 'FRI 20:05', lift: 230, cam: { z: [1.0, 1.1], f: [540, 1100] }, draw(c, lt) {
    cabin(c, { light: 0.55 });
    const k = easeInOut(range(lt, 0, 1.1));
    person(c, { x: lerp(560, 380, k), y: 1560, s: 1.1, face: 1, sit: k, eyes: lt > 1.25 ? 'closed' : 'open', armL: [lerp(0.1, 0.9, k), lerp(-0.2, 0.5, k)], armR: [lerp(-0.1, 0.75, k), lerp(0.2, 0.6, k)] });
  } },
  // ===== 8. building closed, supplies, phone off (FRI 23:30)
  { s: 50.24, e: 52.64, clock: 'FRI 23:30', cam: { z: [0.95, 1.05], f: [540, 1000] }, draw(c, lt) {
    vgrad(c, -200, -200, W + 400, H + 400, [[0, '#050a18'], [0.7, '#0d1830'], [1, '#05070d']]);
    const r = rng(3); for (let i = 0; i < 80; i++) circle(c, r() * W, r() * 700, r() * 2.2, `rgba(255,255,255,${0.3 + r() * 0.5})`);
    fillRR(c, 210, 200, 660, 1500, 10, '#0f1626');
    for (let y = 0; y < 15; y++) for (let x = 0; x < 6; x++) fillRR(c, 250 + x * 102, 240 + y * 88, 80, 60, 4, '#0a0f1b');
    // one window: the shaft column, faint
    fillRR(c, 352, 240, 80, 1300, 4, '#090d17');
    // entrance with chained doors
    fillRR(c, 380, 1500, 320, 200, 6, '#1a2438'); fillRR(c, 392, 1512, 146, 188, 4, '#0b1220'); fillRR(c, 542, 1512, 146, 188, 4, '#0b1220');
    for (let i = 0; i < 9; i++) circle(c, 450 + i * 22, 1600 + Math.sin(i * 0.9) * 8, 9, '#8d97a8');
    fillRR(c, 518, 1610, 44, 40, 8, C.amber); c.beginPath(); c.arc(540, 1612, 14, Math.PI, 0); c.lineWidth = 6; c.strokeStyle = C.amber; c.stroke();
    const p = backOut(range(lt, 0.9, 1.3));
    if (p > 0) { c.save(); c.translate(540, 1150); c.scale(p, p); fillRR(c, -230, -50, 460, 100, 12, '#f2efe6'); text(c, 'CLOSED UNTIL MONDAY', 0, 2, { size: 36, weight: 900, col: '#b01218' }); c.restore(); }
    c.fillStyle = '#05070d'; c.fillRect(-200, 1700, W + 400, 400);
    glow(c, 540, 1700, 500, 'rgba(255,190,107,0.12)');
  } },
  { s: 52.64, e: 55.52, clock: 'FRI 23:30', cam: { z: [1.0, 1.08], f: [540, 1000] }, draw(c, lt) {
    // top-down: items on the cabin floor in phone-light
    c.fillStyle = '#121620'; c.fillRect(-200, -200, W + 400, H + 400);
    for (let i = 0; i < 12; i++) line(c, -200, i * 180, W + 200, i * 180 + 60, 2, 'rgba(255,255,255,0.03)');
    // backpack
    fillRR(c, 120, 300, 420, 360, 80, '#20304a'); fillRR(c, 170, 300, 320, 120, 50, '#2a3d5c'); fillRR(c, 200, 380, 260, 16, 8, '#0e1626');
    const b = backOut(range(lt, 0.0, 0.4));
    c.save(); c.translate(380, 1050); c.scale(b, b); c.rotate(-0.3);
    fillRR(c, -90, -300, 180, 600, 50, 'rgba(190,220,255,0.18)'); fillRR(c, -50, -360, 100, 70, 14, '#3b7bd9');
    fillRR(c, -86, 0, 172, 296, 46, 'rgba(110,170,255,0.55)'); line(c, -80, 0, 80, 0, 4, 'rgba(255,255,255,0.6)');
    c.restore();
    const k = backOut(range(lt, 1.76, 2.15));
    c.save(); c.translate(760, 1150); c.scale(k, k); c.rotate(0.25);
    fillRR(c, -110, -260, 220, 520, 18, '#5a2a14'); fillRR(c, -110, -260, 220, 220, 18, '#b21e2e'); text(c, 'CHOCO', 0, -150, { size: 46, weight: 900, col: '#fff' });
    for (let i = 0; i < 3; i++) line(c, -90, 20 + i * 80, 90, 20 + i * 80, 4, '#3a1a0a');
    c.restore();
    text(c, '½', 380 + 150, 860, { size: 80, weight: 900, col: C.light, alpha: b > 0.5 ? 1 : 0 });
    text(c, '×1', 760 + 150, 880, { size: 70, weight: 900, col: C.amber, alpha: k > 0.5 ? 1 : 0 });
    glow(c, 540, 1000, 900, 'rgba(160,190,255,0.15)');
  } },
  { s: 55.52, e: 58.16, clock: 'FRI 23:30', cam: { z: [1.0, 1.1], f: [540, 900] }, draw(c, lt) {
    cabin(c, { light: 0.3 });
    const on = range(lt, 1.12, 1.35);
    phone(c, (sx, sy, sw, sh) => {
      c.fillStyle = '#0c0e14'; c.fillRect(sx, sy, sw, sh);
      statusBar(c, sx, sy, sw, { time: '23:30', bars: 0, batt: 0.03, plane: on > 0.5 });
      text(c, 'Settings', sx + 40, sy + 160, { size: 54, weight: 800, col: '#fff', align: 'left' });
      fillRR(c, sx + 26, sy + 230, sw - 52, 120, 24, '#1b1f2a');
      fillRR(c, sx + 48, sy + 260, 60, 60, 14, C.orange); text(c, '✈', sx + 78, sy + 292, { size: 36, weight: 700, col: '#fff' });
      text(c, 'Airplane Mode', sx + 128, sy + 292, { size: 34, weight: 700, col: '#fff', align: 'left' });
      const tx = sx + sw - 140;
      fillRR(c, tx, sy + 262, 96, 56, 28, on > 0.5 ? '#34c759' : '#3a3f4c'); circle(c, tx + 28 + 40 * smooth(on), sy + 290, 24, '#fff');
      for (let i = 0; i < 3; i++) fillRR(c, sx + 26, sy + 380 + i * 140, sw - 52, 120, 24, '#161a23');
    }, { y: 960 });
  } },
  { s: 58.16, e: 60.32, clock: 'FRI 23:30', cam: { z: [1.1, 1.2], f: [540, 900] }, draw(c, lt) {
    cabin(c, { light: lerp(0.3, 0.06, range(lt, 0, 0.5)) });
    const off = range(lt, 0, 0.35);
    phone(c, (sx, sy, sw, sh) => {
      c.fillStyle = '#000'; c.fillRect(sx, sy, sw, sh);
      if (off < 1) { c.save(); c.globalAlpha = 1 - off; c.fillStyle = '#0c0e14'; c.fillRect(sx, sy + sh / 2 - sh / 2 * (1 - off), sw, sh * (1 - off)); c.restore(); }
      c.save(); c.globalAlpha = 0.08; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + sw * 0.6, sy); c.lineTo(sx, sy + sh * 0.5); c.fill(); c.restore();
    }, { y: 960, glowA: 1 - off });
  } },
  { s: 60.32, e: 62.24, clock: 'FRI 23:31', label: 'SAVE WATER & ENERGY', cam: { z: [1.05, 1.1], f: [540, 1000] }, draw(c, lt) {
    cabin(c, { light: 0.32, tint: 'blue' });
    person(c, { x: 540, y: 1640, s: 1.25, face: 0, eyes: 'wide', armL: [2.6, 0.3], armR: [-2.6, -0.3], fistL: 1, fistR: 1, shake: lt, alpha: 0.6 });
    for (let i = 0; i < 3; i++) { const p = (lt * 1.6 + i / 3) % 1; c.beginPath(); c.arc(540, 1000, 110 + p * 360, -2.4, -0.74); c.lineWidth = 10 * (1 - p); c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - p)})`; c.stroke(); }
    // draining meters
    const lv = 1 - 0.6 * range(lt, 0, 1.9);
    for (const [x, col, icon] of [[220, C.light, '💧'], [860, C.amber, '⚡']]) {
      fillRR(c, x - 50, 420, 100, 300, 20, 'rgba(255,255,255,0.1)'); fillRR(c, x - 40, 430 + 280 * (1 - lv), 80, 280 * lv, 14, col);
      text(c, icon, x, 780, { size: 60, weight: 400 });
    }
  } },
  { s: 62.24, e: 64.0, clock: 'FRI 23:32', label: 'SAVE WATER & ENERGY', lift: 230, cam: { z: [1.1, 1.15], f: [540, 1100] }, draw(c, lt) {
    cabin(c, { light: 0.3, tint: 'blue' });
    person(c, { x: 380, y: 1560, s: 1.1, ...sitPose('closed') });
    const lv = 0.4;
    for (const [x, col, icon] of [[220, C.light, '💧'], [860, C.amber, '⚡']]) {
      fillRR(c, x - 50, 650, 100, 300, 20, 'rgba(255,255,255,0.1)'); fillRR(c, x - 40, 660 + 280 * (1 - lv), 80, 280 * lv, 14, col);
      text(c, icon, x, 1010, { size: 60, weight: 400 });
    }
  } },
  // ===== 9. knocking (SAT 03:12)
  { s: 64.0, e: 66.08, clock: 'SAT 03:12', cam: { z: [1.0, 1.06], f: [540, 960], shake: (lt) => 22 * knockAt(lt, [1.45, 1.85, 2.25].map(x => x - 0.0)) }, draw(c, lt) {
    c.fillStyle = '#273047'; c.fillRect(-200, -200, W + 400, H + 400);
    for (let i = 0; i < 40; i++) line(c, -200, i * 50, W + 200, i * 50, 1, 'rgba(255,255,255,0.03)');
    fillRR(c, 120, 300, 840, 1300, 20, '#2d374f');
    glow(c, 540, 600, 900, 'rgba(120,160,255,0.12)');
    const K = [1.45, 1.85, 2.25].map(x => x - 0.0);   // 65.45, 65.85, 66.25 (last spills into next shot)
    const k = knockAt(lt, K);
    hand(c, lerp(900, 650, k), 960, Math.PI, 1.45, 'fist');
    for (const kt of K) ring(c, 520, 960, lt - kt, 'rgba(255,255,255,0.6)', 220);
    shade(c, 0.35);
  } },
  { s: 66.08, e: 68.96, lift: 230, clock: (lt) => ['SAT 03:12', 'SAT 03:27', 'SAT 03:42', 'SAT 03:57'][Math.min(3, Math.floor(lt / 0.72))], cam: { z: [1.0, 1.08], f: [540, 1050] }, draw(c, lt) {
    cabin(c, { light: 0.28, tint: 'blue' });
    const ph = (lt % 0.72) / 0.72;
    const k = knockAt(ph * 0.72, [0.15, 0.3, 0.45].map(x => x * 0.72 / 0.72));
    person(c, { x: 330, y: 1560, s: 1.1, sit: 1, face: -1, eyes: 'open', armL: [-2.2 + k * 0.6, -0.4], fistL: 1, armR: [0.6, -1.3] });
    // 15-minute ring timer
    c.beginPath(); c.arc(700, 640, 130, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ph); c.lineWidth = 18; c.strokeStyle = C.amber; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.arc(700, 640, 130, 0, Math.PI * 2); c.lineWidth = 18; c.strokeStyle = 'rgba(255,255,255,0.08)'; c.stroke();
    text(c, '15', 700, 625, { size: 90, weight: 900, col: '#fff' }); text(c, 'MIN', 700, 695, { size: 34, weight: 800, col: 'rgba(255,255,255,0.7)' });
    for (let i = 0; i < 3; i++) circle(c, 640 + i * 60, 830, 16, ph > 0.15 + i * 0.15 && ph < 0.95 ? C.white : 'rgba(255,255,255,0.15)');
  } },
  { s: 68.96, e: 70.16, clock: 'SAT 03:57', cam: { z: [0.9, 1.0], f: [540, 1000] }, draw(c, lt) {
    shaft(c, { cabY: 760, light: 0.35, tint: 'blue' });
    shade(c, 0.45);
  } },
  // ===== 10. rule of 3, sweating, sip (SAT 14:00)
  { s: 70.16, e: 73.2, clock: 'SAT 14:00', label: 'RULE OF 3: ~3 DAYS WITHOUT WATER', lift: 230, cam: { z: [1.0, 1.06], f: [540, 1000] }, draw(c, lt) {
    cabin(c, { light: 0.4, tint: 'orange' });
    person(c, { x: 380, y: 1560, s: 1.1, ...sitPose('open', { sweat: lt }) });
    const p = backOut(range(lt, 0.1, 0.5));
    c.save(); c.translate(760, 760); c.scale(p, p);
    fillRR(c, -170, -170, 340, 340, 40, 'rgba(8,10,18,0.85)');
    c.save(); c.rotate(0.2); fillRR(c, -60, -110, 120, 200, 14, '#b21e2e'); fillRR(c, -60, 10, 120, 80, 10, '#5a2a14'); c.restore();
    text(c, 'WEEKS', 0, 130, { size: 46, weight: 900, col: '#7dff9a' });
    c.restore();
  } },
  { s: 73.2, e: 76.24, clock: 'SAT 14:00', label: 'RULE OF 3: ~3 DAYS WITHOUT WATER', lift: 230, cam: { z: [1.05, 1.12], f: [540, 1000] }, draw(c, lt) {
    cabin(c, { light: 0.38, tint: 'orange' });
    person(c, { x: 380, y: 1560, s: 1.1, ...sitPose('squint', { sweat: lt + 3 }) });
    const p = backOut(range(lt, 0.0, 0.4));
    c.save(); c.translate(760, 760); c.scale(p, p);
    fillRR(c, -170, -170, 340, 340, 40, 'rgba(8,10,18,0.85)');
    c.fillStyle = C.light; c.beginPath(); c.moveTo(0, -120); c.quadraticCurveTo(90, 10, 0, 70); c.quadraticCurveTo(-90, 10, 0, -120); c.fill();
    text(c, '3 DAYS', 0, 130, { size: 46, weight: 900, col: C.red });
    c.restore();
    // heat shimmer
    for (let i = 0; i < 5; i++) { const y = 1200 - ((lt * 120 + i * 140) % 700); c.beginPath(); c.moveTo(200, y); for (let x = 200; x < 880; x += 40) c.lineTo(x, y + Math.sin(x * 0.03 + lt * 4) * 8); c.lineWidth = 3; c.strokeStyle = 'rgba(255,170,90,0.12)'; c.stroke(); }
  } },
  { s: 76.24, e: 78.96, clock: 'SAT 14:00', lift: 230, cam: { z: [1.5, 1.6], f: [500, 980] }, draw(c, lt) {
    cabin(c, { light: 0.38, tint: 'orange' });
    const up = smooth(range(lt, 0.3, 1.0)) - smooth(range(lt, 1.8, 2.4));
    const hands = person(c, { x: 420, y: 1560, s: 1.1, sit: 1, face: 1, eyes: up > 0.6 ? 'closed' : 'open', sweat: lt + 6, headTilt: -0.25 * up, armL: [lerp(0.9, 2.5, up), lerp(0.5, 1.1, up)], armR: [0.75, 0.6] });
    const [bx, by] = hands.l;
    c.save(); c.translate(bx, by); c.rotate(lerp(0.2, 2.2, up));
    fillRR(c, -26, -120, 52, 170, 18, 'rgba(190,220,255,0.3)'); fillRR(c, -24, -30 + 20 * range(lt, 1.0, 1.8), 48, 76 - 20 * range(lt, 1.0, 1.8), 12, 'rgba(110,170,255,0.75)'); fillRR(c, -14, -146, 28, 30, 6, '#3b7bd9');
    c.restore();
  } },
  // ===== 11. knock again — someone answers — from above (SUN 02:47)
  { s: 78.96, e: 82.56, clock: 'SUN 02:47', lift: 230, cam: { z: [1.0, 1.08], f: [540, 1050], shake: (lt) => 10 * knockAt(lt, [1.44, 1.89, 2.34]) }, draw(c, lt) {
    cabin(c, { light: 0.22, tint: 'blue' });
    const k = knockAt(lt, [1.44, 1.89, 2.34]);  // 80.40, 80.85, 81.30
    person(c, { x: 330, y: 1560, s: 1.1, sit: 1, face: -1, eyes: 'open', armL: [-2.2 + k * 0.6, -0.4], fistL: 1, armR: [0.6, -1.3] });
    for (const kt of [1.44, 1.89, 2.34]) ring(c, 170, 1180, lt - kt, 'rgba(180,210,255,0.5)', 160);
  } },
  { s: 82.56, e: 85.76, clock: 'SUN 02:47', lift: 230, cam: { z: [1.05, 1.25], f: [540, 900], shake: (lt) => 16 * knockAt(lt, [2.39, 2.79, 3.19]) }, draw(c, lt) {
    const K = [2.39, 2.79, 3.19];  // 84.95, 85.35, 85.75 — from above
    const k = knockAt(lt, K);
    cabin(c, { light: 0.22 - 0.12 * k, tint: 'blue', dust: lt > 2.39 ? lt - 2.39 : 0 });
    const alert = range(lt, 1.6, 1.9);
    person(c, { x: 400, y: 1560, s: 1.1, sit: 1, face: 1, eyes: alert > 0.5 ? 'wide' : 'open', look: [0, -1 * alert], headTilt: -0.35 * smooth(range(lt, 2.4, 3.0)), armL: [0.9, 0.5], armR: [0.75, 0.6] });
    for (const kt of K) ring(c, 540, 300, lt - kt, 'rgba(255,255,255,0.45)', 300);
  } },
  { s: 85.76, e: 88.4, clock: 'SUN 02:47', cam: { z: [1.0, 1.0], f: [[540, 1100], [540, -300]] }, draw(c, lt) {
    // tilt up the dark shaft above the cabin
    shaft(c, { cabY: 1300, light: 0.25, tint: 'blue', cables: 4 });
    vgrad(c, -300, -1500, W + 600, 2400, [[0, 'rgba(0,0,0,1)'], [0.6, 'rgba(0,0,0,0.9)'], [1, 'rgba(0,0,0,0)']]);
    glow(c, 540, 1300, 300, 'rgba(120,160,255,0.25)');
  } },
  // ===== 12. relief
  { s: 88.4, e: 90.96, clock: 'SUN 02:48', cam: { z: [1.9, 2.05], f: [540, 1090] }, draw(c, lt) {
    cabin(c, { light: 0.35, tint: 'warm' });
    person(c, { x: 540, y: 1560, s: 1.25, sit: 1, face: 0, eyes: 'happy', headTilt: Math.sin(lt * 9) * 0.04 * (1 - range(lt, 0.8, 1.6)) });
    glow(c, 540, 700, 600, 'rgba(255,200,120,0.25)', 0.6 + 0.2 * Math.sin(lt * 3));
  } },
  { s: 90.96, e: 93.6, clock: 'SUN 02:48', lift: 230, cam: { z: [1.0, 1.08], f: [540, 1000] }, draw(c, lt) {
    cabin(c, { light: 0.4, tint: 'warm' });
    const k = easeInOut(range(lt, 0, 1.2));
    person(c, { x: 540, y: 1600, s: 1.2, face: 0, sit: 1 - k, eyes: 'open', look: [0, -1], armL: [lerp(0.1, 2.8, k), -0.1], armR: [-0.1, 0.1] });
    glow(c, 540, 300, 500, 'rgba(255,210,140,0.35)', k);
  } },
  // ===== 13. rescue (MON 07:55)
  { s: 93.6, e: 95.76, clock: 'MON 07:55', cam: { z: [1.0, 1.12], f: [540, 960] }, draw(c, lt) {
    const gap = 1300 * easeInOut(range(lt, 0.0, 1.2));
    doors(c, gap, { light: 0.4, behind: () => {
      vgrad(c, -200, -200, W + 400, H + 400, [[0, '#fff3d6'], [1, '#ffd38a']]);
      glow(c, 540, 900, 900, 'rgba(255,255,255,0.8)');
      // guard's hand reaching in
      hand(c, lerp(1300, 640, easeOut(range(lt, 0.8, 1.8))), 1000, Math.PI + 0.1, 1.3, 'open', '#a8724f', '#2a3040');
    } });
    if (gap > 0) glow(c, 540, 960, 1200, 'rgba(255,230,180,0.35)', clamp(gap / 600));
  } },
  // ===== 14. security room (MON 08:10)
  { s: 95.76, e: 98.56, clock: 'MON 08:10', cam: { z: [1.0, 1.05], f: [540, 1000] }, draw(c, lt) {
    c.fillStyle = '#0b111d'; c.fillRect(-200, -200, W + 400, H + 400);
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) { fillRR(c, 150 + q * 270, 300 + r * 200, 240, 170, 8, '#05080e'); fillRR(c, 160 + q * 270, 310 + r * 200, 220, 150, 6, '#1d3a52'); }
    glow(c, 540, 500, 700, 'rgba(110,190,255,0.25)');
    fillRR(c, -100, 1180, W + 200, 60, 8, '#1a2232');
    person(c, { x: 330, y: 1700, s: 1.05, face: 1, cap: 1, body: C.guard, bodyD: '#2a2e38', badge: 1, skin: '#a8724f', eyes: 'open', look: [1, 0] });
    person(c, { x: 790, y: 1700, s: 1.05, face: -1, eyes: 'open', look: [-1, 0], armR: [-0.8, -0.6] });
    const p = backOut(range(lt, 0.2, 0.5));
    c.save(); c.translate(820, 980); c.scale(p, p); fillRR(c, -80, -70, 160, 120, 30, '#f2efe6'); c.beginPath(); c.moveTo(-30, 40); c.lineTo(-10, 80); c.lineTo(10, 40); c.fill(); text(c, '?', 0, -8, { size: 90, weight: 900, col: '#111' }); c.restore();
  } },
  { s: 98.56, e: 100.24, clock: 'MON 08:10', cam: { z: [2.3, 2.45], f: [330, 1220] }, draw(c, lt) {
    c.fillStyle = '#0b111d'; c.fillRect(-200, -200, W + 400, H + 400);
    glow(c, 540, 500, 700, 'rgba(110,190,255,0.25)');
    person(c, { x: 330, y: 1700, s: 1.05, face: 0, cap: 1, body: C.guard, bodyD: '#2a2e38', badge: 1, skin: '#a8724f', eyes: lt > 0.5 ? 'frown' : 'open' });
  } },
  { s: 100.24, e: 102.56, clock: 'MON 08:10', label: 'NO ONE ON CAMERA', cam: { z: [1.0, 1.06], f: [540, 960] }, draw(c, lt) {
    c.fillStyle = '#05080e'; c.fillRect(-200, -200, W + 400, H + 400);
    const stamps = ['SAT 03:12', 'SAT 14:00', 'SUN 02:47', 'FRI 23:30', 'SAT 09:00', 'SUN 02:47', 'SAT 20:15', 'SUN 11:40', 'SUN 02:47'];
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      const x = 60 + q * 330, y = 520 + r * 330, w = 300, h = 300;
      fillRR(c, x, y, w, h, 6, '#0f1c2a');
      // empty corridor in perspective
      c.fillStyle = '#16293c'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w * 0.38, y + h * 0.45); c.lineTo(x + w * 0.62, y + h * 0.45); c.lineTo(x + w, y + h); c.closePath(); c.fill();
      c.fillStyle = '#0b1622'; c.fillRect(x + w * 0.38, y + h * 0.2, w * 0.24, h * 0.25);
      line(c, x + w * 0.2, y + h * 0.1, x + w * 0.8, y + h * 0.1, 3, 'rgba(180,220,255,0.3)');
      for (let k = 0; k < 6; k++) line(c, x, y + k * 50 + ((lt * 60) % 50), x + w, y + k * 50 + ((lt * 60) % 50), 2, 'rgba(255,255,255,0.04)');
      text(c, stamps[r * 3 + q], x + 12, y + h - 22, { size: 22, weight: 700, font: 'Mono', col: 'rgba(255,255,255,0.75)', align: 'left' });
      if ((lt * 2) % 1 < 0.6) circle(c, x + w - 24, y + 24, 8, C.red);
    }
  } },
  { s: 102.56, e: 104.4, clock: 'MON 08:10', label: 'NO ONE ON CAMERA', cam: { z: [1.0, 1.15], f: [540, 960] }, draw(c, lt) {
    c.fillStyle = '#05080e'; c.fillRect(-200, -200, W + 400, H + 400);
    fillRR(c, 90, 520, 900, 900, 10, '#0c1824');
    // shaft cam: looking down the empty shaft
    c.fillStyle = '#132232'; c.beginPath(); c.moveTo(90, 520); c.lineTo(400, 860); c.lineTo(680, 860); c.lineTo(990, 520); c.closePath(); c.fill();
    c.fillStyle = '#0f1c2b'; c.beginPath(); c.moveTo(90, 1420); c.lineTo(400, 1080); c.lineTo(680, 1080); c.lineTo(990, 1420); c.closePath(); c.fill();
    c.fillStyle = '#03060a'; c.fillRect(400, 860, 280, 220);
    for (let i = 0; i < 3; i++) line(c, 470 + i * 70, 520, 500 + i * 40, 860, 4, 'rgba(160,190,220,0.35)');
    for (let k = 0; k < 18; k++) line(c, 90, 520 + k * 50 + ((lt * 60) % 50), 990, 520 + k * 50 + ((lt * 60) % 50), 2, 'rgba(255,255,255,0.04)');
    text(c, 'CAM 07 · SHAFT', 120, 570, { size: 32, weight: 700, font: 'Mono', col: '#fff', align: 'left' });
    text(c, 'SUN 02:47:13', 120, 1380, { size: 32, weight: 700, font: 'Mono', col: '#fff', align: 'left' });
    if ((lt * 2) % 1 < 0.6) { circle(c, 900, 565, 12, C.red); text(c, 'REC', 850, 566, { size: 30, weight: 800, font: 'Mono', col: C.red, align: 'right' }); }
  } },
  { s: 104.4, e: 107.44, clock: 'MON 08:10', cam: { z: [1.0, 1.12], f: [540, 1000] }, draw(c, lt) {
    // shaft access door: keyed lock
    c.fillStyle = '#141a26'; c.fillRect(-200, -200, W + 400, H + 400);
    fillRR(c, 230, 380, 620, 1250, 12, '#2c3447'); fillRR(c, 260, 410, 560, 1190, 8, '#364057');
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#ffcc00' : '#111'; c.fillRect(260 + i * 94, 410, 94, 50); }
    fillRR(c, 360, 560, 360, 120, 12, '#f2efe6');
    text(c, 'ELEVATOR SHAFT', 540, 600, { size: 36, weight: 900, col: '#b01218' }); text(c, 'AUTHORIZED KEY ONLY', 540, 645, { size: 26, weight: 800, col: '#333' });
    circle(c, 720, 1040, 56, '#1d2230'); circle(c, 720, 1040, 40, '#c9a33a'); fillRR(c, 714, 1020, 12, 40, 4, '#1d2230'); circle(c, 720, 1022, 10, '#1d2230');
    const p = easeOut(range(lt, 1.1, 1.6));
    if (p > 0) { c.save(); c.globalAlpha = p; c.translate(540, 1240); fillRR(c, -170, -60, 340, 120, 30, 'rgba(8,10,18,0.9)'); c.beginPath(); c.arc(-90, 0, 30, 0, Math.PI * 2); c.lineWidth = 10; c.strokeStyle = C.amber; c.stroke(); line(c, -60, 0, 60, 0, 12, C.amber); line(c, 40, 0, 40, 26, 10, C.amber); line(c, 60, 0, 60, 20, 10, C.amber); c.restore();
      const x = easeOut(range(lt, 1.6, 2.0)); if (x > 0) { line(c, 390, 1180, 390 + 300 * x, 1300, 12, C.red); } }
    glow(c, 720, 1040, 200, 'rgba(255,190,107,0.2)');
    shade(c, 0.15);
  } },
  // ===== 15. empty elevator, doors close, black
  { s: 107.44, e: END, clock: 'MON 08:10', cam: { z: [1.0, 1.06], f: [540, 1000] }, draw(c, lt, t) {
    cabin(c, { light: 0.7 - 0.1 * flick(lt, 9), tint: 'warm' });
    const k = easeInOut(range(lt, 0.0, 1.25));
    const g = (W / 2 + 200) * k;
    vgrad(c, -200, -200, g, H + 400, [[0, '#4c5872'], [1, '#2a3346']]);
    vgrad(c, W + 200 - g, -200, g, H + 400, [[0, '#4c5872'], [1, '#2a3346']]);
  } },
  // ===== end card
  { s: END, e: DURATION + 1, clock: null, cam: { z: [1, 1], f: [540, 960] }, draw(c, lt) {
    c.fillStyle = '#000'; c.fillRect(-200, -200, W + 400, H + 400);
    const a = range(lt, 1.0, 1.6);
    if (a > 0) {
      const K = [1.1, 1.7, 2.3];       // knocks at END + these
      let sh = 0; for (const kt of K) { const d = lt - kt; if (d > 0 && d < 0.25) sh = Math.max(sh, 1 - d / 0.25); }
      c.save(); c.globalAlpha = a; c.translate(540 + (sh ? Math.sin(lt * 90) * 8 * sh : 0), 900);
      c.font = '900 210px Mont'; c.letterSpacing = '30px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f2f2f2'; c.fillText('STUCK', 15, 0);
      c.restore();
      text(c, 'Follow for more', 540, 1060, { size: 44, weight: 700, col: 'rgba(255,255,255,0.65)', alpha: range(lt, 1.6, 2.2), spacing: 2 });
    }
  } },
];

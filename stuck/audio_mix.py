#!/usr/bin/env python3
"""Sound design for STUCK, mixed under the narrator.  <kit>/.venv/bin/python audio_mix.py -> audio/mix.wav"""
import numpy as np, soundfile as sf
from scipy import signal
SR = 44100
END, DUR = 108.75, 111.8
N = int(DUR * SR)
rng = np.random.default_rng(11)
def T(n): return np.arange(n) / SR
def place(buf, x, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf): buf[i:j] += x[:j - i] * g
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), min(hi / (SR / 2), .99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))
def fade(x, a=.05, r=.1): n = len(x); t = T(n); return x * np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, (n / SR - t) / max(r, 1e-4))
def reverb(x, decay=1.2, mix=.35):
    n = int(decay * SR); ir = rng.standard_normal(n) * np.exp(-T(n) * 6 / decay); ir = lp(ir, 3000)
    w = signal.fftconvolve(x, ir)[:len(x) + n]; w /= np.abs(w).max() + 1e-9
    out = np.zeros(len(w)); out[:len(x)] += x * (1 - mix); return out + w * mix * np.abs(x).max()

def thud(f0=70, d=.4, g=1.0):
    n = int(d * SR); t = T(n); f = f0 * (1 + 1.4 * np.exp(-t * 30))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) + lp(noise(d), 900) * np.exp(-t * 45) * .6) * g
def knock(muffled=False):
    x = thud(95, .35) + bp(noise(.35), 300, 1800) * np.exp(-T(int(.35 * SR)) * 60) * .8
    if muffled: x = lp(x, 500, 4) * 1.6
    return x
def clang(f0=180, d=1.6):
    n = int(d * SR); t = T(n); x = np.zeros(n)
    for k, (r, a, dc) in enumerate([(1, 1, 3), (2.71, .7, 4), (4.3, .5, 6), (6.9, .3, 9), (1.47, .6, 3.5)]): x += a * np.sin(2 * np.pi * f0 * r * t + k) * np.exp(-t * dc)
    return x * .5 + thud(55, d, 1.2)[:n] + hp(noise(d), 2500) * np.exp(-t * 30) * .5
def rattle(d=1.0):
    n = int(d * SR); x = np.zeros(n)
    for i in range(40): place(x, bp(rng.standard_normal(int(.02 * SR)), 1500, 6000) * np.exp(-T(int(.02 * SR)) * 200), rng.random() * d * (1 - i / 60), .3 + rng.random() * .5)
    return x * np.exp(-T(n) * 2)
def hum(d, f=60):
    t = T(int(d * SR)); return fade((np.sin(2 * np.pi * f * t) * .6 + np.sin(2 * np.pi * f * 2 * t) * .3 + np.sin(2 * np.pi * f * 3.01 * t) * .15 + lp(noise(d), 300) * .4), .4, .2)
def click(f=2500): n = int(.03 * SR); return hp(rng.standard_normal(n), f) * np.exp(-T(n) * 250) + np.sin(2 * np.pi * 900 * T(n)) * np.exp(-T(n) * 200) * .5
def beep(f=880, d=.12): t = T(int(d * SR)); return np.sin(2 * np.pi * f * t) * fade(np.ones(len(t)), .005, .03) * .5
def buzz(d): t = T(int(d * SR)); x = np.sign(np.sin(2 * np.pi * 120 * t)) * .3 + bp(noise(d), 2000, 6000) * .2; return fade(x * (np.random.default_rng(3).random(len(t)) > .3), .01, .05)
def creak(d=3.0):
    t = T(int(d * SR)); f = 110 + 40 * np.sin(2 * np.pi * .7 * t) + 25 * np.sin(2 * np.pi * 2.3 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + .5 * np.sin(2 * np.pi * 11 * t)) ** 2
    return fade(bp(x, 200, 2500) + bp(noise(d), 300, 1200) * .3, .3, .5)
def whoosh(d=.6, g=1.0): t = T(int(d * SR)); return bp(noise(d), 200, 2500) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * g
def twang(d=1.2): t = T(int(d * SR)); return (np.sin(2 * np.pi * 220 * t * (1 + .3 * np.exp(-t * 8))) * np.exp(-t * 4) + hp(noise(d), 3000) * np.exp(-t * 30)) * .7
def screech(d=.6): t = T(int(d * SR)); f = 2600 - 900 * t / d; return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * .4 + bp(noise(d), 2000, 8000) * .6, .01, .1)
def slide(d=1.2): return fade(bp(noise(d), 150, 900) * 1.2 + rattle(d) * .2, .1, .2)
def drone(d):
    t = T(int(d * SR))
    x = np.sin(2 * np.pi * 41 * t) + .6 * np.sin(2 * np.pi * 61.7 * t + 1) + .3 * np.sin(2 * np.pi * 82.3 * t * 1.002) + lp(noise(d), 200) * .8
    return lp(x, 400) * (0.75 + .25 * np.sin(2 * np.pi * .07 * t)) * np.minimum(1, t / 2)

sfx = np.zeros(N); amb = np.zeros(N)
# 1. office: light switches row by row, elevator hum
for x in [0.7, 1.15, 1.6, 2.05]: place(sfx, click(1500), x, .5); place(sfx, thud(180, .1, .3), x)
place(amb, hum(10.48 - 2.4, 55), 2.4, .5)
place(sfx, beep(1320, .25), 3.9, .25); place(sfx, slide(1.3), 5.5, .35); place(sfx, thud(80, .3, .6), 6.75)
# 2. jolt
place(sfx, clang(160, 1.8), 10.48, 1.0); place(sfx, rattle(1.2), 10.5, .8); place(sfx, buzz(1.1), 10.55, .25)
# 3. button, beeps
for x in [13.06, 13.81]: place(sfx, click(2500), x, .7)
place(sfx, beep(660, .1), 15.6, .25); place(sfx, beep(440, .25), 20.95, .3); place(sfx, beep(440, .25), 21.75, .25)
# 5. prying the doors, warning, slip
place(sfx, creak(3.2), 26.9, .35); place(sfx, buzz(.35), 30.25, .35); place(sfx, whoosh(.7, 1.2), 36.3, .5); place(sfx, thud(60, .6, .8), 37.1)
# 6. cables snap, brakes clamp
place(sfx, twang(1.3), 43.36, .7); place(sfx, whoosh(.5), 43.45, .5); place(sfx, screech(.55), 44.48, .5); place(sfx, clang(120, 1.2), 44.98, .6)
# 8. phone toggles off
place(sfx, click(3000), 56.66, .5); place(sfx, thud(110, .3, .4), 58.2); place(sfx, beep(300, .2), 58.2, .2)
# 9. three dull knocks + time-lapse knocks
for x in [65.45, 65.85, 66.25]: place(sfx, knock(), x, 1.0)
for cyc in range(4):
    for k in [.108, .216, .324]:
        at = 66.08 + cyc * .72 + k
        if at > 66.5: place(sfx, knock(), at, .3)
# 11. knocks, then three muffled knocks from above
for x in [80.4, 80.85, 81.3]: place(sfx, knock(), x, 1.0)
above = np.zeros(int(1.6 * SR))
for i, x in enumerate([0, .4, .8]): place(above, knock(True), x)
place(sfx, reverb(above, 1.4, .45), 84.95, 1.1)
# 13. rescue: doors forced open, morning
place(sfx, slide(1.2), 93.65, .6); place(sfx, thud(70, .4, .7), 94.8)
# 14. security room hum, monitor static
place(amb, hum(107.44 - 95.76, 50) * .5 + fade(bp(noise(107.44 - 95.76), 4000, 9000) * .05, .3, .3), 95.76, .5)
place(sfx, fade(bp(noise(.4), 1000, 6000), .02, .2), 100.24, .2)
# 15. empty elevator doors close
place(sfx, slide(1.2), 107.5, .4); place(sfx, thud(70, .4, .8), END - .05)
# ending: silence on black, then three slow knocks
for x in [END + 1.1, END + 1.7, END + 2.3]: place(sfx, knock(), x, 1.1)

dr = np.zeros(N); place(dr, drone(END), 0, 1.0)

vo, sr = sf.read('audio/vo.wav'); vo = vo.mean(1) if vo.ndim > 1 else vo
assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = signal.lfilter([1 - .9995], [1, -.9995], np.abs(vo)); env /= env.max() + 1e-9
duck = 1 - .5 * np.clip(env * 4, 0, 1)
mix = vo + sfx * .3 * duck + amb * .06 * duck + dr * .05
mix[int(END * SR):] = sfx[int(END * SR):] * .45      # nothing but the knocks after the voice
mix /= max(1.0, np.abs(mix).max() / .95)
sf.write('audio/mix.wav', mix, SR)
b, a = signal.butter(2, [300 / 22050, 5000 / 22050], 'band')
r = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
o = signal.lfilter(b, a, mix - vo); v = signal.lfilter(b, a, vo)
print('voice over rest (speech band, dB) per 6 s:', ' '.join(f'{s}:{r(v[s*SR:(s+6)*SR]) - r(o[s*SR:(s+6)*SR]):+.0f}' for s in range(0, 108, 6)))

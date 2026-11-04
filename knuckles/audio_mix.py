#!/usr/bin/env python3
"""Sound design + light music bed for "Why Do Knuckles Crack", under the voiceover. -> audio/mix.wav"""
import numpy as np, soundfile as sf
from scipy import signal
SR = 44100; DUR = 28.6; N = int(DUR * SR)
rng = np.random.default_rng(5)
def T(n): return np.arange(n) / SR
def place(buf, x, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf): buf[i:j] += x[:j - i] * g
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), min(hi / (SR / 2), .99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))
def fade(x, a=.05, r=.1): n = len(x); t = T(n); return x * np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, (n / SR - t) / max(r, 1e-4))
def thud(f0=70, d=.4, g=1.0):
    n = int(d * SR); t = T(n); f = f0 * (1 + 1.4 * np.exp(-t * 30))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) + lp(noise(d), 900) * np.exp(-t * 45) * .6) * g
def crack(g=1.0):   # knuckle pop: a sharp click + a tiny body
    n = int(.12 * SR); t = T(n)
    x = hp(rng.standard_normal(n), 1800) * np.exp(-t * 180) * 1.2 + bp(rng.standard_normal(n), 400, 2500) * np.exp(-t * 90) * .6
    return (x + thud(180, .12, .5)[:n]) * g
def whoosh(d=.35, g=1.0): t = T(int(d * SR)); return bp(noise(d), 300, 3500) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * g
def grind(d=1.0):
    t = T(int(d * SR)); x = bp(noise(d), 500, 4000) * (0.5 + .5 * np.sign(np.sin(2 * np.pi * 26 * t))) ** 2
    return fade(x + bp(noise(d), 80, 400) * .5, .05, .15)
def buzzer(d=.45): t = T(int(d * SR)); x = np.sign(np.sin(2 * np.pi * 110 * t)) * .4 + np.sign(np.sin(2 * np.pi * 116 * t)) * .4; return fade(lp(x, 2000), .01, .05)
def riser(d=1.8, f0=150, oct=2.5):
    n = int(d * SR); t = T(n); f = f0 * 2 ** (t / d * oct)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .25 + bp(noise(d), 600, 6000) * .4 * (t / d)) * (t / d) ** 2
def body_amb(d):
    t = T(int(d * SR)); x = lp(noise(d), 250, 4) * 2.0
    for k in np.arange(0.2, d, 0.85): x[int(k * SR):int(k * SR) + int(.3 * SR)] += thud(48, .3, .8)[:min(int(.3 * SR), len(x) - int(k * SR))]
    return fade(x, .4, .4)
def creak(d=1.2):
    t = T(int(d * SR)); f = 140 + 60 * t / d + 20 * np.sin(2 * np.pi * 3 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + .5 * np.sin(2 * np.pi * 13 * t)) ** 2
    return fade(bp(x, 200, 2500), .1, .2)
def drop_tone(d=.6): t = T(int(d * SR)); f = 900 * np.exp(-t * 3.5) + 120; return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * .5, .01, .1)
def bloop(): d = .5; t = T(int(d * SR)); f = 120 + 500 * np.exp(-t * 18); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
def boom(d=1.2): t = T(int(d * SR)); f = 45 * (1 + 2 * np.exp(-t * 12)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3) + lp(noise(d), 300) * np.exp(-t * 5) * .5
def tick(): n = int(.03 * SR); t = T(n); return hp(rng.standard_normal(n), 3000) * np.exp(-t * 220) * .8 + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 160) * .4
def fizz(d): t = T(int(d * SR)); x = hp(noise(d), 4000) * (rng.random(len(t)) > .93); return fade(x, .2, .4)
def sting(): d = 1.3; t = T(int(d * SR)); x = sum(np.sin(2 * np.pi * f * t) for f in (73.4, 77.8, 110, 155.6)) * np.exp(-t * 2.2); return x * .4 + boom(d)[:len(t)] * .6
def flip(): n = int(.05 * SR); return bp(rng.standard_normal(n), 1500, 7000) * np.exp(-T(n) * 70) * .6
def chime(f=1320, d=.9): t = T(int(d * SR)); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 5) * np.minimum(1, t / .004) * .5

sfx = np.zeros(N)
for c in [2.95, 5.65, 7.6, 11.0, 13.4, 15.4, 16.8, 19.4, 21.9, 23.3, 25.4, 26.95]: place(sfx, whoosh(.3), c - .18, .45)
place(sfx, crack(), 1.72, 1.2); place(sfx, thud(90, .3, .5), 1.74)
place(sfx, grind(1.1), 4.15, .25); place(sfx, buzzer(), 5.0, .2)
place(sfx, riser(1.9, 160, 2.3), 5.7, .22)
place(sfx, body_amb(15.4 - 7.6), 7.6, .35)
place(sfx, creak(1.3), 11.1, .45); place(sfx, drop_tone(.7), 12.88, .45)
place(sfx, bloop(), 14.38, .9); place(sfx, crack(1.0), 14.4, 1.0); place(sfx, boom(1.2), 14.4, .7)
place(sfx, crack(), 15.95, 1.3); place(sfx, thud(100, .3, .6), 15.97)
place(sfx, creak(1.3), 17.2, .4)
for i in range(int(2.5 / .12)): place(sfx, tick(), 19.45 + i * .12, .35)
place(sfx, fizz(2.4), 19.5, .25)
place(sfx, sting(), 22.0, .55)
place(sfx, crack(.8), 24.38, 1.0)
for x in [25.54, 25.99, 26.45, 26.9]: place(sfx, crack(.7), x, .8)
for i in range(18): place(sfx, flip(), 25.45 + i * .078, .8)
place(sfx, chime(1320), 27.25, .55); place(sfx, chime(1760), 27.4, .45)

# light, playful bed: plucks in C major, 112 bpm, with a soft kick
bed = np.zeros(N); E = 60 / 112 / 2
def pluck(f, d=.35): t = T(int(d * SR)); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 9) * np.minimum(1, t / .003)
mel = [60, 64, 67, 64, 62, 65, 69, 65, 59, 62, 67, 62, 60, 64, 67, 72]
bass = [36, 36, 41, 41, 43, 43, 36, 36]
i = 0; t0 = 0.0
t0 = 0.0
while t0 < DUR - .3:
    place(bed, pluck(440 * 2 ** ((mel[i % 16] - 69) / 12)), t0, .35)
    if i % 2 == 0: place(bed, pluck(440 * 2 ** ((bass[(i // 4) % 8] - 69) / 12), .5) * 1.2, t0, .5)
    if i % 4 == 0: place(bed, thud(55, .2, .5), t0)
    t0 += E; i += 1
bed[int(21.9 * SR):int(23.3 * SR)] *= np.linspace(1, .2, int(23.3 * SR) - int(21.9 * SR))   # dip for "arthritis?"

vo, sr = sf.read('audio/vo.wav'); vo = vo.mean(1) if vo.ndim > 1 else vo
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = signal.lfilter([1 - .9995], [1, -.9995], np.abs(vo)); env /= env.max() + 1e-9
duck = 1 - .5 * np.clip(env * 4, 0, 1)
mix = vo + sfx * .3 * duck + bed * .1 * duck
mix /= max(1.0, np.abs(mix).max() / .95)
sf.write('audio/mix.wav', mix, SR)
b, a = signal.butter(2, [300 / 22050, 5000 / 22050], 'band'); r = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
o = signal.lfilter(b, a, mix - vo); v = signal.lfilter(b, a, vo)
print('voice over rest (speech band, dB) per 2 s:', ' '.join(f'{s}:{r(v[s*SR:(s+2)*SR]) - r(o[s*SR:(s+2)*SR]):+.0f}' for s in range(0, 28, 2)))

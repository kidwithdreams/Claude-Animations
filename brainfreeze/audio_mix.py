#!/usr/bin/env python3
"""Sound design + light music bed for "Brain Freeze", under the voiceover. -> audio/mix.wav"""
import numpy as np, soundfile as sf
from scipy import signal
SR = 44100; DUR = 27.85; N = int(DUR * SR)
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


def shimmer(d=1.0):   # icy sparkle
    t = T(int(d * SR)); x = np.zeros(len(t))
    for f in (2637, 3136, 3951, 4699, 5274): x += np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t * (3 + rng.random() * 3))
    return (x * .25 + hp(noise(d), 6000) * np.exp(-t * 4) * .3) * np.minimum(1, t / .005)
def icecrack(d=1.0):
    n = int(d * SR); x = np.zeros(n)
    for i in range(30): place(x, crack(.4 + rng.random() * .4), rng.random() * d * .9)
    return x * .6 + bp(noise(d), 800, 5000) * np.exp(-T(n) * 3) * .2
def heartbeat(): out = np.zeros(int(.8 * SR)); place(out, thud(52, .3, 1.0), 0); place(out, thud(48, .3, .7), .2); return out
def zap(d=.22):
    n = int(d * SR); t = T(n); sq = np.sign(np.sin(2 * np.pi * (120 + 60 * rng.random()) * t))
    return (sq * .35 + hp(rng.standard_normal(n), 3000) * .6) * (rng.random(n) > .55) * np.exp(-t * 14)
def warble(d=1.6): t = T(int(d * SR)); f = 600 + 250 * np.sin(2 * np.pi * 3.2 * t) + 120 * np.sin(2 * np.pi * 7.1 * t); return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * .35, .1, .2)
def warmpad(d=2.0): t = T(int(d * SR)); x = sum(np.sin(2 * np.pi * f * t) for f in (220, 277.2, 329.6, 440)) / 4; return fade(lp(x, 2500), .6, .5)
def squish(d=.35): t = T(int(d * SR)); f = 300 * np.exp(-t * 6) + 80; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .4 + bp(noise(d), 400, 2500) * .5) * np.exp(-t * 9) * np.minimum(1, t / .01)

sfx = np.zeros(N)
for c in [2.8, 5.84, 8.32, 11.0, 13.1, 15.6, 17.5, 19.2, 20.9, 22.7, 25.6]: place(sfx, whoosh(.3), c - .18, .4)
place(sfx, crack(.5), 0.98, .6); place(sfx, shimmer(1.2), 1.6, .6); place(sfx, whoosh(.5, 1.0), 1.55, .4)
place(sfx, icecrack(1.0), 3.95, .45); place(sfx, buzzer(), 5.1, .2)
place(sfx, tick(), 6.45, .5)
place(sfx, shimmer(1.0), 9.6, .55); place(sfx, whoosh(.4, .8), 9.5, .35)
place(sfx, creak(.8), 11.9, .35); place(sfx, drop_tone(.5), 12.1, .25)
place(sfx, boom(1.0), 14.22, .55)
for k in range(3): place(sfx, heartbeat(), 14.35 + k * .45, .6)
for i in range(11): place(sfx, zap(), 15.7 + i * .15 + rng.random() * .04, .25)
place(sfx, riser(1.1, 300, 2), 17.55, .25); place(sfx, thud(70, .35, .6), 18.7)
place(sfx, warble(1.6), 19.25, .2)
place(sfx, sting(), 21.85, .4); place(sfx, heartbeat(), 22.0, .4)
place(sfx, squish(), 23.66, .6); place(sfx, warmpad(2.4), 23.9, .18)
place(sfx, chime(1320), 25.9, .4); place(sfx, chime(1760), 26.05, .3)

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
bed[int(8.32 * SR):int(11.0 * SR)] *= 0.6   # thinner under the cold hit

vo, sr = sf.read('audio/vo.wav'); vo = vo.mean(1) if vo.ndim > 1 else vo
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = signal.lfilter([1 - .9995], [1, -.9995], np.abs(vo)); env /= env.max() + 1e-9
duck = 1 - .5 * np.clip(env * 4, 0, 1)
mix = vo + sfx * .3 * duck + bed * .1 * duck
mix /= max(1.0, np.abs(mix).max() / .95)
sf.write('audio/mix.wav', mix, SR)
b, a = signal.butter(2, [300 / 22050, 5000 / 22050], 'band'); r = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
o = signal.lfilter(b, a, mix - vo); v = signal.lfilter(b, a, vo)
print('voice over rest (speech band, dB) per 2 s:', ' '.join(f'{s}:{r(v[s*SR:(s+2)*SR]) - r(o[s*SR:(s+2)*SR]):+.0f}' for s in range(0, 27, 2)))

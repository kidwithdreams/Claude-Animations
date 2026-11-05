#!/usr/bin/env python3
"""Cartoon sound design + light pentatonic bed under the voiceover. -> audio/mix.wav"""
import numpy as np, soundfile as sf
from scipy import signal
SR = 44100; DUR = 44.5; N = int(DUR * SR); rng = np.random.default_rng(7)
def T(n): return np.arange(n) / SR
def place(b, x, at, g=1.0):
    i = int(at * SR); j = min(len(b), i + len(x))
    if 0 <= i < len(b): b[i:j] += x[:j - i] * g
def bp(x, lo, hi): b, a = signal.butter(2, [lo / 22050, min(hi / 22050, .99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f): b, a = signal.butter(2, f / 22050, 'low'); return signal.lfilter(b, a, x)
def hp(x, f): b, a = signal.butter(2, f / 22050, 'high'); return signal.lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))
def env(n, a=.005, r=.1): t = T(n); return np.minimum(1, t / a) * np.minimum(1, (n / SR - t) / r)
def snore(d=1.1):
    t = T(int(d * SR)); e = np.sin(np.pi * t / d) ** 2
    return lp((np.sign(np.sin(2 * np.pi * 38 * t)) * .5 + np.sin(2 * np.pi * 76 * t) * .3) * (rng.random(len(t)) > .3) + bp(noise(d), 200, 900) * .6, 900) * e
def boing(f=260, d=.45): t = T(int(d * SR)); fr = f * (1 + .35 * np.sin(2 * np.pi * 10 * t) * np.exp(-t * 4)) * (1 + .6 * t); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 5)
def pop(f=600): n = int(.1 * SR); t = T(n); fr = f * (1 + 8 * t); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 45)
def chime(f, d=.9): t = T(int(d * SR)); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2.01 * f * t)) * np.exp(-t * 5) * np.minimum(1, t / .004) * .5
def tada():
    out = np.zeros(int(1.4 * SR))
    for i, f in enumerate([523, 659, 784]): place(out, chime(f, .3), i * .08, .8)
    for f in (523, 659, 784, 1047): place(out, chime(f, 1.2), .3, .6)
    return out
def sparkle(): out = np.zeros(int(.8 * SR)); [place(out, chime(f, .5), i * .05, .5) for i, f in enumerate([2093, 2637, 3136, 4186])]; return out
def whoosh(d=.3): t = T(int(d * SR)); return bp(noise(d), 400, 5000) * np.sin(np.pi * t / d) ** 2
def thud(f0=80, d=.35): t = T(int(d * SR)); f = f0 * (1 + 1.4 * np.exp(-t * 30)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) + lp(noise(d), 900) * np.exp(-t * 45) * .6
def gong(d=2.6):
    t = T(int(d * SR)); x = sum(a * np.sin(2 * np.pi * f * t + i) * np.exp(-t * dc) for i, (f, a, dc) in enumerate([(110, 1, 1.2), (164, .6, 1.5), (233, .5, 2), (311, .35, 2.5), (415, .25, 3)]))
    return x * (1 + .2 * np.sin(2 * np.pi * 4 * t)) * .5 + thud(60, d)[:len(t)] * .5
def ring(d=.9): t = T(int(d * SR)); x = np.sin(2 * np.pi * 1300 * t) * np.sin(2 * np.pi * 22 * t) ** 2 + np.sin(2 * np.pi * 1700 * t) * .4; return x * ((t % .45) < .3) * .5
def slide(down=True, d=.6): t = T(int(d * SR)); f = (1600 - 1200 * t / d) if down else (400 + 1200 * t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .02, .1) * .5
def buzzer(d=.4): t = T(int(d * SR)); return lp(np.sign(np.sin(2 * np.pi * 110 * t)) + np.sign(np.sin(2 * np.pi * 117 * t)), 2000) * .3 * env(len(t), .01, .05)
def beep(d=.5): t = T(int(d * SR)); return np.sin(2 * np.pi * 1000 * t) * env(len(t), .005, .02) * .6
def horn(d=.7): t = T(int(d * SR)); f = 300 + 500 * np.minimum(1, t / .15); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 3000) * env(len(t), .01, .15) * .35
def bam(): x = thud(55, .8) * 1.2; x[:int(.5 * SR)] += lp(noise(.5), 1500) * np.exp(-T(int(.5 * SR)) * 9) * .8; return x
def drain(d=1.8): t = T(int(d * SR)); f = 800 * np.exp(-t * 1.2) + 100; return np.sin(2 * np.pi * np.cumsum(f) / SR) * .3 * env(len(t), .05, .2)
def stinger(): out = np.zeros(int(1.0 * SR)); place(out, thud(70, .6), 0); place(out, thud(62, .6), .28); return out

sfx = np.zeros(N)
for c in [2.85, 5.2, 7.85, 11.9, 16.1, 19.4, 22.3, 24.3, 28.6, 29.85, 31.1, 32.9, 35.5, 38.95]: place(sfx, whoosh(), c - .05, .45)
for k in range(3): place(sfx, snore(), 0.1 + k * 0.95, .55)
place(sfx, pop(700), 0.7, .5)
place(sfx, thud(140, .25), 2.86, .5); place(sfx, boing(300), 3.4, .5); place(sfx, tada(), 4.13, .5); place(sfx, sparkle(), 4.2, .45)
place(sfx, pop(500), 5.45, .5); place(sfx, chime(784, .6), 5.5, .35)
place(sfx, pop(650), 8.25, .45); place(sfx, thud(120, .3), 11.05, .7)
place(sfx, drain(1.8), 12.5, .5); place(sfx, buzzer(), 14.2, .4)
place(sfx, slide(True), 16.8, .5); place(sfx, pop(700), 17.1, .4); place(sfx, boing(400, .3), 17.7, .45); place(sfx, boing(450, .3), 17.85, .45)
place(sfx, pop(800), 19.5, .5); place(sfx, pop(600), 20.1, .45); place(sfx, pop(700), 20.6, .45)
place(sfx, gong(), 22.3, .7); place(sfx, slide(False, .5), 22.7, .3)
place(sfx, thud(120, .3), 25.0, .6); place(sfx, ring(1.0), 26.3, .5); place(sfx, boing(350, .35), 26.4, .5)
place(sfx, snore(.8), 28.65, .5); place(sfx, buzzer(.35), 28.88, .45)
place(sfx, snore(.5), 29.85, .7); place(sfx, beep(.45), 30.25, .45)
place(sfx, chime(1568, .8), 32.25, .45); place(sfx, sparkle(), 32.3, .4); place(sfx, thud(130, .3), 32.4, .5)
place(sfx, horn(), 34.6, .45); place(sfx, pop(700), 34.62, .4); place(sfx, sparkle(), 34.7, .35)
place(sfx, stinger(), 37.1, .55); place(sfx, bam(), 37.9, .7)
place(sfx, boing(240, .4), 41.55, .22); place(sfx, pop(800), 42.95, .3); place(sfx, tada(), 43.05, .14); place(sfx, horn(), 43.1, .1)

# light pentatonic bed (C D E G A), 112 bpm
bed = np.zeros(N); E = 60 / 112 / 2
def pluck(f, d=.35): t = T(int(d * SR)); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 9) * np.minimum(1, t / .003)
mel = [72, 74, 76, 79, 76, 74, 72, 69, 67, 69, 72, 74, 76, 74, 72, 74]; bass = [48, 48, 45, 45, 43, 43, 48, 48]
for i in range(int((DUR - .3) / E)):
    place(bed, pluck(440 * 2 ** ((mel[i % 16] - 69) / 12)), i * E, .3)
    if i % 2 == 0: place(bed, pluck(440 * 2 ** ((bass[(i // 4) % 8] - 69) / 12), .5) * 1.2, i * E, .45)
    if i % 4 == 0: place(bed, thud(55, .2), i * E, .4)

vo, sr = sf.read('audio/vo.wav'); vo = vo.mean(1) if vo.ndim > 1 else vo
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
e = signal.lfilter([1 - .9995], [1, -.9995], np.abs(vo)); e /= e.max() + 1e-9
duck = 1 - .5 * np.clip(e * 4, 0, 1)
mix = vo + sfx * .3 * duck + bed * .1 * duck
mix[-int(.25 * SR):] *= np.linspace(1, 0, int(.25 * SR))
mix /= max(1.0, np.abs(mix).max() / .95)
sf.write('audio/mix.wav', mix, SR)
b, a = signal.butter(2, [300 / 22050, 5000 / 22050], 'band'); r = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
o = signal.lfilter(b, a, mix - vo); v = signal.lfilter(b, a, vo)
print('voice over rest (speech band) per 4 s:', ' '.join(f'{s}:{r(v[s*SR:(s+4)*SR]) - r(o[s*SR:(s+4)*SR]):+.0f}' for s in range(0, 44, 4)))

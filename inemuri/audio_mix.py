#!/usr/bin/env python3
"""Sound for the 8 s toon test (no voiceover): snoring, clock ticks, door, footsteps, surprise, sparkle, light bed."""
import numpy as np, soundfile as sf
from scipy import signal
SR = 44100; DUR = 8.0; N = int(DUR * SR); rng = np.random.default_rng(3)
def T(n): return np.arange(n) / SR
def place(b, x, at, g=1.0):
    i = int(at * SR); j = min(len(b), i + len(x))
    if 0 <= i < len(b): b[i:j] += x[:j - i] * g
def bp(x, lo, hi): b, a = signal.butter(2, [lo / 22050, hi / 22050], 'band'); return signal.lfilter(b, a, x)
def lp(x, f): b, a = signal.butter(2, f / 22050, 'low'); return signal.lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))
def snore(d=1.1):
    t = T(int(d * SR)); env = np.sin(np.pi * t / d) ** 2
    buzz = np.sign(np.sin(2 * np.pi * 38 * t)) * .5 + np.sin(2 * np.pi * 76 * t) * .3
    return lp(buzz * (rng.random(len(t)) > .3) + bp(noise(d), 200, 900) * .6, 900) * env
def tick(): n = int(.03 * SR); t = T(n); return bp(rng.standard_normal(n), 2500, 8000) * np.exp(-t * 220) + np.sin(2 * np.pi * 3000 * t) * np.exp(-t * 160) * .3
def creak(d=.5): t = T(int(d * SR)); f = 300 + 200 * t / d; x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + .5 * np.sin(2 * np.pi * 17 * t)) ** 2; return bp(x, 300, 3000) * np.sin(np.pi * t / d)
def step(): n = int(.12 * SR); t = T(n); f = 90 * (1 + np.exp(-t * 40)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) + bp(rng.standard_normal(n), 800, 4000) * np.exp(-t * 80) * .3
def boing(d=.45): t = T(int(d * SR)); f = 260 * (1 + .35 * np.sin(2 * np.pi * 10 * t) * np.exp(-t * 4)) * (1 + .6 * t); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
def chime(f, d=.9): t = T(int(d * SR)); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2.01 * f * t)) * np.exp(-t * 5) * np.minimum(1, t / .004) * .5
def pluck(f, d=.35): t = T(int(d * SR)); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 9) * np.minimum(1, t / .003)
mix = np.zeros(N)
for k in range(3): place(mix, snore(), 0.15 + k * 1.15, .5)
for i in range(4): place(mix, tick(), 0.3 + i, .25)
place(mix, creak(), 3.15, .35)
for i in range(5): place(mix, step(), 3.45 + i * 0.25, .45)
place(mix, boing(), 4.55, .45)
for i, f in enumerate([1568, 1976, 2349, 3136]): place(mix, chime(f), 5.3 + i * .07, .35)
bed = np.zeros(N); E = 60 / 104 / 2; mel = [67, 64, 60, 64, 65, 62, 59, 62]
for i in range(int(DUR / E)): place(bed, pluck(440 * 2 ** ((mel[i % 8] - 69) / 12)), i * E, .18 if t < 3.15 else .25) if False else place(bed, pluck(440 * 2 ** ((mel[i % 8] - 69) / 12)), i * E, .2)
mix += bed
mix[-int(.15 * SR):] *= np.linspace(1, 0, int(.15 * SR))
mix /= np.abs(mix).max() / .8
sf.write('audio_mix.wav', mix, SR); print('ok', len(mix) / SR)

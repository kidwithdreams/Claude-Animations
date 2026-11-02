#!/usr/bin/env python3
"""Sound design + music bed for "Why Onions Make You Cry", mixed under the voiceover.
    <kit>/.venv/bin/python audio_mix.py      -> audio/sfx.wav, audio/mix.wav (voice + sfx + bed, ducked)
All times are seconds on the video timeline (the voiceover starts at 0)."""
import numpy as np, soundfile as sf
from scipy import signal

SR = 44100
DUR = 32.0
N = int(DUR * SR)
rng = np.random.default_rng(7)

def T(n): return np.arange(n) / SR
def place(buf, x, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf): buf[i:j] += x[:j - i] * g
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), min(hi / (SR / 2), .99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))

# ---------- building blocks ----------
def whoosh(d=.35, up=True, g=1.6):
    n = int(d * SR); x = noise(d); t = T(n)
    k = np.linspace(0, 1, n) if up else np.linspace(1, 0, n)
    return (bp(x, 250, 1200) * (1 - k) + bp(x, 1500, 7000) * k) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * g
def thud(f0=60, d=.5, g=1.0):
    n = int(d * SR); t = T(n); f = f0 * (1 + 1.6 * np.exp(-t * 28))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + lp(noise(d), 700) * np.exp(-t * 35) * .5) * g
def boom(d=1.6):
    n = int(d * SR); t = T(n); f = 45 * (1 + 2 * np.exp(-t * 12))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6) + lp(noise(d), 300) * np.exp(-t * 4) * .6
def crunch(d=.55):
    n = int(d * SR); out = np.zeros(n); t = T(n)
    for i in range(26):  # dense brittle cracks
        at = abs(rng.normal(0, .06)) + (i / 26) * .18
        m = int(.03 * SR); c = bp(rng.standard_normal(m), 1200 + rng.random() * 3000, 9000) * np.exp(-T(m) * 160)
        place(out, c * (0.4 + rng.random() * .6), at)
    out += bp(noise(d), 300, 2500) * np.exp(-t * 9) * .7          # wet body
    out += thud(110, d, .5)[:n]
    return out * .8
def squish(d=.4):
    n = int(d * SR); t = T(n); f = 380 * np.exp(-t * 6) + 90
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .4 + bp(noise(d), 400, 2500) * .6) * np.exp(-t * 8) * np.minimum(1, t / .01)
def pop(f=700, g=1.0):
    n = int(.09 * SR); t = T(n); fr = f * (1 + 6 * t)
    return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 55) + hp(rng.standard_normal(n), 2500) * np.exp(-t * 220) * .3) * g
def riser(d=2.0, f0=150, oct=2.5):
    n = int(d * SR); t = T(n); f = f0 * 2 ** (t / d * oct)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .25 + bp(noise(d), 600, 7000) * .5 * (t / d)) * (t / d) ** 2
def hiss(d=2.0, lo=2500, hi=9000):
    n = int(d * SR); t = T(n)
    return bp(noise(d), lo, hi) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .4) * (0.75 + .25 * np.sin(2 * np.pi * 3.1 * t))
def zap(d=.25):
    n = int(d * SR); t = T(n); sq = np.sign(np.sin(2 * np.pi * (120 + 60 * rng.random()) * t))
    return (sq * .35 + hp(rng.standard_normal(n), 3000) * .6) * (rng.random(n) > .55) * np.exp(-t * 14)
def siren(d=1.6):
    n = int(d * SR); t = T(n); f = np.where((t * 2.6) % 1 < .5, 880, 660)
    f = signal.lfilter([0.003], [1, -0.997], f)  # glide between tones
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .4
    return lp(x, 3500) * np.minimum(1, t / .05) * np.minimum(1, (d - t) / .1)
def gush(d=1.4):
    n = int(d * SR); t = T(n)
    x = lp(noise(d), 1800) * .8 + bp(noise(d), 2000, 6000) * .25
    for i in range(30): place(x, pop(500 + rng.random() * 900, .25), rng.random() * d)
    return x * np.minimum(1, t / .08) * np.minimum(1, (d - t) / .25)
def heartbeat():
    out = np.zeros(int(.8 * SR)); place(out, thud(50, .3, .9), 0); place(out, thud(46, .3, .6), .2); return out
def ring(f=2600, d=1.3):
    n = int(d * SR); t = T(n); x = np.zeros(n)
    for r, a, dc in [(1, 1, 3), (2.41, .5, 5), (3.9, .3, 7), (5.6, .2, 10)]: x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dc)
    return (x + hp(rng.standard_normal(n), 4000) * np.exp(-t * 40) * .5) * .4
def shing(d=.9):
    out = whoosh(.3, True, 1.0); out = np.concatenate([out, np.zeros(int(d * SR))]); place(out, ring(2800, d), .22); return out
def slice_clean(d=.5):
    n = int(d * SR); t = T(n)
    return bp(noise(d), 3000, 11000) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * .8 + ring(4200, d)[:n] * .15
def door(close=True):
    d = .6; n = int(d * SR); t = T(n)
    x = thud(70 if close else 110, d, .9)[:n] + bp(noise(d), 200, 1200) * np.exp(-t * 18) * .5
    if not close: x += bp(noise(d), 1500, 5000) * np.exp(-t * 6) * .2   # seal unsticking
    return x
def hum(d):
    n = int(d * SR); t = T(n)
    return (np.sin(2 * np.pi * 60 * t) * .5 + np.sin(2 * np.pi * 120 * t) * .3 + lp(noise(d), 400) * .3) * np.minimum(1, t / .1) * np.minimum(1, (d - t) / .1)
def drone(d, f=55):
    n = int(d * SR); t = T(n)
    x = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.5 * t + 1) + .3 * np.sin(2 * np.pi * f * 2.003 * t)
    return lp(x, 500) * (0.7 + .3 * np.sin(2 * np.pi * .4 * t)) * np.minimum(1, t / .5) * np.minimum(1, (d - t) / .3)

sfx = np.zeros(N)
cuts = [1.2, 3.2, 5.4, 8.2, 11.05, 15.05, 17.55, 19.3, 20.7, 22.3, 23.75, 24.85, 26.85, 28.2, 30.35]
for c in cuts: place(sfx, whoosh(.32), c - .2, .35)

# S1 knife raised: a little "shing"
place(sfx, shing(.8), 0.15, .5)
# S2 crunch
place(sfx, whoosh(.25, False), 1.5, .4); place(sfx, crunch(), 1.74, 1.1); place(sfx, squish(.5), 1.95, .5)
for i in range(6): place(sfx, pop(1500 + rng.random() * 1500, .15), 1.85 + i * .07)
# S3 dive into the cut surface
place(sfx, riser(2.0, 120, 2.8), 3.35, .35); place(sfx, hiss(2.0, 1500, 8000), 3.35, .12); place(sfx, boom(1.2), 5.38, .55)
# S4 cells bursting under the blade
place(sfx, lp(noise(2.8), 600) * np.minimum(1, T(int(2.8 * SR)) / .2), 5.4, .1)       # grinding blade
for i in range(60):
    at = 5.55 + (i / 60) * 2.5 + rng.normal(0, .04)
    place(sfx, pop(350 + rng.random() * 900, .14 + rng.random() * .14), at)
# S5 the chemical weapon: dark drone + heartbeat + sting
place(sfx, drone(2.85, 49), 8.2, .12); place(sfx, heartbeat(), 8.5, .45); place(sfx, heartbeat(), 9.3, .45)
place(sfx, riser(.6, 300, 1.5)[::-1] * .5, 9.65, .35); place(sfx, boom(1.0), 10.24, .5)
# S6 rupture, swirl, flash, gas
place(sfx, squish(.6), 11.72, .9); place(sfx, pop(260, .8), 11.75)
place(sfx, riser(1.9, 200, 2.2), 11.85, .5); place(sfx, whoosh(1.2, True, 1.2), 12.4, .3)
place(sfx, boom(1.6), 13.68, .9); place(sfx, hp(noise(.4), 2000) * np.exp(-T(int(.4 * SR)) * 9), 13.68, .7)
place(sfx, hiss(1.5, 2500, 9000), 13.85, .3)
# S7 gas drifting up
place(sfx, hiss(2.5, 1800, 7000), 15.05, .22); place(sfx, whoosh(1.6, True, .8), 15.6, .25)
# S8 fly into the eye
place(sfx, riser(1.7, 140, 3), 17.6, .5); place(sfx, squish(.4), 19.22, .5)
# S9 nerves: electric zaps
for i in range(10): place(sfx, zap(.22), 19.35 + i * .13 + rng.random() * .04, .55)
# S10 alarm
place(sfx, siren(1.55), 20.72, .45); place(sfx, thud(55, .4, .8), 20.75); place(sfx, thud(55, .4, .7), 21.5)
# S11 tear gland pumps, flood
for i in range(5): place(sfx, squish(.25), 22.32 + i * .17, .45)
place(sfx, gush(1.45), 22.45, .55)
# S12 sob drips
for i in range(8): place(sfx, pop(1100 + rng.random() * 600, .25), 23.8 + i * .12)
# S13 fridge
place(sfx, door(False), 24.88, .7); place(sfx, hum(1.9), 24.95, .18); place(sfx, thud(140, .25, .4), 25.5); place(sfx, door(True), 26.78, .9)
# S14 sharp knife ring
place(sfx, shing(1.1), 27.0, .7)
# S15 clean slice, no drama
place(sfx, slice_clean(.6), 28.75, .7); place(sfx, thud(150, .2, .25), 29.75)
# S16 a few neat pops along the cut
for i in range(10): place(sfx, pop(900 + rng.random() * 400, .25), 30.65 + i * .11)

# ---------- music bed: low pulse in D minor, 120 bpm, dropping out at the end ----------
bed = np.zeros(N)
E = 60 / 120 / 2
roots = [38, 38, 41, 36]  # D, D, F, C (MIDI)
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def pluck_bass(f, d):
    n = int(d * SR); t = T(n); x = np.sign(np.sin(2 * np.pi * f * t)) * .4 + np.sin(2 * np.pi * f * t)
    k = np.exp(-t * 8)
    return (lp(x, 1100) * k + lp(x, 300) * (1 - k)) * np.exp(-t * 5) * np.minimum(1, t / .004)
t0 = 0.0; i = 0
while t0 < 31.6:
    bar = int(t0 / (E * 8)) % 4
    place(bed, pluck_bass(midi(roots[bar]), E * 1.6), t0, .5 if i % 2 == 0 else .3)
    if i % 4 == 2: place(bed, hp(rng.standard_normal(int(.03 * SR)), 6000) * np.exp(-T(int(.03 * SR)) * 120), t0, .25)
    t0 += E; i += 1
bed += np.pad(drone(31.6, 73.4), (0, N - int(31.6 * SR))) * .12

# ---------- mix ----------
vo, sr = sf.read('audio/vo.wav')
if vo.ndim > 1: vo = vo.mean(1)
assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); env = signal.lfilter([1 - .9995], [1, -.9995], env); env /= env.max() + 1e-9
duck = 1 - .6 * np.clip(env * 4, 0, 1)
mix = vo * 1.0 + sfx * .26 * (1 - .4 * np.clip(env * 4, 0, 1)) + bed * .14 * duck
# hard cut ending: no fade
mix /= max(1.0, np.abs(mix).max() / .95)
sf.write('audio/sfx.wav', sfx / (np.abs(sfx).max() + 1e-9) * .9, SR)
sf.write('audio/mix.wav', mix, SR)
print('wrote audio/mix.wav', len(mix) / SR, 's')

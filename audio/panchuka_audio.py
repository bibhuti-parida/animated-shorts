# Sound for the Panchuka short: original score (raga Bhupali on D: tanpura-style drone, bansuri phrases, tabla-ish
# drums for Chhadakhai) + synthesized SFX timed to the picture (story.ts), mixed under the ElevenLabs voice.
# Voice unchanged; music ducked under speech; master -14 LUFS, peaks <= -1.2 dBFS. 48 kHz stereo 24-bit.
# usage: python audio/panchuka_audio.py shorts/panchuka/voice/voice.wav shorts/panchuka/audio
import os
import sys
import numpy as np
from dsp import SR, ns, tt, dbg, rng, lp, hp, bp, pan, st, place, fades, make_ir, convolve_st, integrated, read_wav, write_wav, modal, colored, smooth_noise
from instruments import m2f, pluck, pad, glock, whistle, timpani, cymbal, brush
import sfx_gen as G

DUR = 1206 / 30.0
N = ns(DUR)
voice_path, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
r = rng(11)

# ---------------------------------------------------------------- voice + speech mask
v, _sr = read_wav(voice_path); assert _sr == SR, _sr
v = st(v[0] if v.shape[0] == 1 else v)
voice = np.zeros((2, N)); place(voice, v, 0.0)
env = np.abs(voice[0]); env = lp(env, 6)
speech = (env > np.percentile(env[env > 0], 30) * 0.5).astype(float)
duck = lp(np.convolve(speech, np.ones(ns(0.25)) / ns(0.25), mode="same"), 3)
duck = np.clip(duck, 0, 1)

# ---------------------------------------------------------------- music
D2, A2, D3, A3, D4 = 38, 45, 50, 57, 62
music = np.zeros((2, N))
# tanpura: Pa Sa Sa Sa (low), every 0.75 s, through the whole film (softer in the forest, stops for Chhadakhai drums? no: keeps)
tan = [A2, D3, D3, D2]
k, tm = 0, 0.0
while tm < DUR - 1.0:
    m = tan[k % 4]
    place(music, pan(pluck(m2f(m), vel=0.33, r=r, dur=3.0, bright=0.85, pos=0.11), -0.25 + 0.5 * (k % 2)), tm)
    tm += 0.75; k += 1
# drone pad swells under each section
for t0, t1, notes, vel in [(0, 9.0, [D3, A3], 0.11), (9.0, 26.0, [D3, A3, D4], 0.09), (26.0, 31.0, [D3, A3], 0.12), (31.0, 37.5, [D3, A3, D4], 0.08), (37.5, DUR, [D3, A3, D4], 0.12)]:
    place(music, pad([m2f(n) for n in notes], t1 - t0, vel=vel, r=r, att=0.8, rel=1.2, warm=700), t0)

def flute(notes, gain=1.0, p=0.1):
    s, y = whistle([(t, d, m, vv) for t, d, m, vv in notes], r, vib_rate=5.2, vib_depth=12, breath=0.11, bright=0.05, gate=0.97, scoop=-40)
    place(music, pan(y * gain, p), s)
# Bhupali: D E F# A B (62 64 66 69 71 74 76 78)
flute([(0.25, 1.3, 74, 0.8), (1.65, 0.55, 71, 0.7), (2.25, 0.55, 69, 0.7), (2.85, 1.6, 66, 0.75), (5.0, 0.7, 69, 0.7), (5.75, 0.7, 71, 0.7), (6.5, 1.6, 69, 0.75)], 0.5)
flute([(9.3, 0.9, 66, 0.7), (10.25, 0.45, 69, 0.7), (10.75, 0.45, 71, 0.7), (11.25, 1.4, 74, 0.8), (13.0, 0.6, 76, 0.7), (13.7, 0.6, 74, 0.7), (14.4, 1.8, 71, 0.75),
       (16.6, 0.7, 69, 0.7), (17.35, 0.7, 66, 0.7), (18.1, 1.6, 64, 0.7), (20.0, 0.6, 66, 0.7), (20.65, 0.6, 69, 0.7), (21.3, 0.6, 71, 0.7), (22.0, 1.8, 74, 0.8), (24.0, 1.6, 69, 0.7)], 0.42, -0.1)
for i, (t0, m) in enumerate([(26.2, 86), (26.9, 83), (27.6, 81), (28.6, 78), (29.4, 81), (30.2, 86)]):  # boats: twinkles
    place(music, pan(glock(m2f(m), vel=0.45, r=r, dur=2.2), 0.4 * (-1) ** i), t0)
flute([(26.3, 1.8, 69, 0.6), (28.3, 1.9, 66, 0.6)], 0.35)
# Chhadakhai: tabla-ish dha / na at 120 bpm + quick bansuri
beat = 0.5
def dha(vel):
    t = tt(0.5)
    low = np.exp(-t / 0.12) * np.sin(2 * np.pi * 95 * (1 + 0.6 * np.exp(-t / 0.03)) * t)
    return fades((low * 1.2 + pluck(330, vel=0.6, r=r, dur=0.5, bright=0.9, pos=0.08)[:len(t)]) * vel, 0.0005, 0.05)
def na(vel):
    return pluck(m2f(81), vel=vel, r=r, dur=0.35, bright=1.0, pos=0.05) + hp(r.standard_normal(ns(0.35)), 4000) * np.exp(-tt(0.35) / 0.01) * 0.2 * vel
pat = ["dha", "na", "na", "dha", "dha", "na", "dha", "na"]
tb = 31.05
while tb < 37.4:
    for j, kind in enumerate(pat):
        tj = tb + j * beat / 2
        if tj >= 37.4: break
        place(music, pan(dha(0.55) if kind == "dha" else na(0.45), -0.15 if kind == "dha" else 0.2), tj)
    tb += 4 * beat
flute([(31.4, 0.25, 74, 0.8), (31.65, 0.25, 76, 0.8), (31.9, 0.5, 78, 0.85), (32.5, 0.25, 76, 0.8), (32.75, 0.25, 74, 0.8), (33.0, 0.5, 71, 0.8),
       (33.6, 0.25, 69, 0.8), (33.85, 0.25, 71, 0.8), (34.1, 0.5, 74, 0.85), (34.7, 0.25, 71, 0.8), (34.95, 0.25, 69, 0.8), (35.2, 0.5, 66, 0.8),
       (35.8, 0.25, 69, 0.8), (36.05, 0.25, 71, 0.8), (36.3, 0.9, 74, 0.85)], 0.45, 0.1)
flute([(37.6, 0.7, 71, 0.7), (38.35, 0.6, 69, 0.7), (39.0, 1.0, 74, 0.75)], 0.4)
place(music, st(timpani(m2f(D2 + 12), vel=0.5, r=r, dur=2.0)), 39.0)
music = convolve_st(music, make_ir(1.6, 3, hf=0.6)) * 0.35 + music

# ---------------------------------------------------------------- SFX
sfx = np.zeros((2, N))
def bell(vel=0.6, f=520.0):
    return modal(4.0, [(f, 1.0, 1.8), (f * 2.42, 0.5, 1.0), (f * 3.48, 0.3, 0.6), (f * 4.95, 0.2, 0.35), (f * 6.8, 0.1, 0.2)], r) * vel
def splash_small(vel=0.6):
    t = tt(0.9); nz = r.standard_normal(len(t))
    y = bp(nz, 500, 6000, 1) * np.exp(-t / 0.05) * 0.9 + G.bubbles(0.9, r, 120 * np.exp(-t / 0.2) + 5, 600, 3500, (0.004, 0.015)) * 0.6
    return fades(y * vel, 0.0, 0.2)
def flap(vel=0.5):
    return G.whoosh(0.35, r, peak=0.12, f_lo=200, f_hi=900, tail=0.1, air=0.05) * vel
def pop(f=900, vel=0.5):
    t = tt(0.25)
    return fades(np.exp(-t / 0.05) * np.sin(2 * np.pi * f * (1 + 1.2 * np.exp(-t / 0.02)) * t) * vel, 0.0005, 0.05)
def boing(f0, f1, vel=0.5, dur=0.45):
    t = tt(dur); f = f0 * (f1 / f0) ** (t / dur)
    return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25) * vel, 0.002, 0.08)
def birds(dur):
    y = np.zeros(ns(dur)); tm = 0.3
    while tm < dur - 0.5:
        for c in range(int(r.integers(2, 5))):
            t = tt(0.09); f = r.uniform(2800, 4200) * (1 + 0.4 * t / 0.09)
            seg = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.09) ** 2 * 0.25
            a = ns(tm + c * 0.12); y[a:a + len(seg)] += seg[: max(0, min(len(seg), len(y) - a))]
        tm += r.uniform(0.9, 2.2)
    return y

place(sfx, pan(bell(0.55), -0.3), 0.05)                     # temple bell, Kartika evening
place(sfx, pan(bell(0.25, 780), 0.3), 1.9)
place(sfx, G.whoosh(0.5, r, peak=0.3, tail=0.15) * 0.25, 2.05)
place(sfx, G.water_bed(3.4, r, close=0.6) * 0.35, 5.7)      # river at the reeds
for ts in (6.05, 6.95, 23.8, 24.65):
    place(sfx, pan(splash_small(0.55), 0.25), ts)
place(sfx, pan(boing(420, 980, 0.35), 0.1), 8.32)           # "?"
place(sfx, G.whoosh(0.7, r, peak=0.45, f_lo=500, f_hi=4000, tail=0.2) * 0.5, 8.6)  # flash
place(sfx, pan(birds(17.0), 0.2) * 0.35, 8.95)              # forest
place(sfx, G.water_bed(17.0, r, close=0.3) * 0.18, 8.95)
for ts in (11.45, 11.7):
    place(sfx, pan(flap(0.6), -0.2), ts)                     # wing points the way
for i, m in enumerate([86, 90, 93, 98]):
    place(sfx, pan(glock(m2f(m), vel=0.4, r=r, dur=1.5), -0.2 + 0.15 * i), 14.05 + i * 0.07)  # boon sparkle
for i in range(5):
    place(sfx, pan(brush(0.25, r, dur=0.2), -0.4), 15.05 + i * 0.26)  # wife's footsteps
place(sfx, pan(boing(520, 300, 0.3, 0.35), -0.1), 18.7)     # hesitation
for i in range(3):
    place(sfx, pan(pop(1100 + 150 * i, 0.35), -0.2 + 0.2 * i), 21.6 + i * 0.45)  # hearts
for i in range(2):
    place(sfx, pan(G.whoosh(0.25, r, peak=0.08, f_lo=700, f_hi=2500, tail=0.08) * 0.4, (-1) ** i * 0.4), 24.92 + i * 0.22)  # "no!"
place(sfx, G.whoosh(0.6, r, peak=0.35, tail=0.2) * 0.2, 25.85)
place(sfx, G.water_bed(5.3, r, close=0.8) * 0.3, 25.9)      # boats on the river at dawn
place(sfx, pan(bell(0.3, 620), 0.4), 26.4)
# Chhadakhai: stinger + market bustle
place(sfx, st(cymbal(vel=0.45, r=r, dur=2.0)), 31.85)
crowd = np.zeros((2, ns(6.4)))
for i in range(7):
    b = G.babble(6.4, r, base=r.uniform(110, 230), scale=r.uniform(0.8, 1.2))
    place(crowd, pan(b, r.uniform(-0.8, 0.8)), 0.0)
ramp_in = np.clip((np.arange(crowd.shape[1]) / SR - 0.0) / 1.5, 0, 1)
crowd *= ramp_in[None, :] * np.clip((6.4 - np.arange(crowd.shape[1]) / SR) / 0.5, 0, 1)[None, :]
place(sfx, crowd / (np.max(np.abs(crowd)) + 1e-9) * 0.18, 31.1)
for i in range(4):
    place(sfx, pan(G.clink(r) * 0.25, r.uniform(-0.6, 0.6)), 34.9 + i * 0.4)  # plates
place(sfx, pan(pop(700, 0.4), 0.6), 37.7)                    # the egret peeks in
place(sfx, pan(boing(380, 760, 0.3, 0.35), 0.6), 38.65)

# ---------------------------------------------------------------- mix
def lufs(x):
    v_ = integrated(x)
    return v_ if np.isfinite(v_) else -70.0
Lv = lufs(voice)
music = music * dbg((Lv - 12.0) - lufs(music))           # bed ~12 LU under the voice
music = music * dbg(-4.0 * duck)[None, :]                 # dip under speech
sfx = sfx * dbg((Lv - 14.0) - lufs(sfx))
mix = voice + music + sfx
g = dbg(-14.0 - lufs(mix)); mix *= g
# simple look-ahead peak limiter to -1.2 dBFS
ceil = dbg(-1.2)
pk = np.max(np.abs(mix), axis=0)
need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
la = ns(0.005)
gmin = np.minimum.accumulate(np.pad(need, (0, la), constant_values=1.0)[::-1])[::-1][:N]  # not causal: conservative
from scipy import ndimage
gm = ndimage.minimum_filter1d(need, size=2 * la + 1)
gs = np.minimum(gm, lp(gm, 40))
mix *= gs[None, :]
mix = np.clip(mix, -ceil, ceil)
mix[:, -ns(0.4):] *= np.linspace(1, 0, ns(0.4))[None, :]
write_wav(os.path.join(outdir, "mix.wav"), mix)
write_wav(os.path.join(outdir, "stem_voice.wav"), voice * g)
write_wav(os.path.join(outdir, "stem_music.wav"), music * g)
write_wav(os.path.join(outdir, "stem_sfx.wav"), sfx * g)
print("mix LUFS", round(lufs(mix), 2), "peak dBFS", round(20 * np.log10(np.max(np.abs(mix)) + 1e-12), 2), "dur", mix.shape[1] / SR)

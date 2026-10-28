# Bölmələrə görə ritmi dəyişən fon musiqisi (120 BPM, 16-lıq addım sekvenseri)
import numpy as np, wave
SR = 44100; T = 97; STEP = 0.125           # 120 BPM-də 16-lıq not
N = SR * T; L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(3)

def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    j = min(N, i + len(sig)); s = sig[:j - i] * gain
    L[i:j] += s * (1 - max(pan, 0)); R[i:j] += s * (1 + min(pan, 0))

def env(n, a=.005, d=.2):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def kick(hard=1.0):
    n = int(.45 * SR); t = np.arange(n) / SR; f = 48 + 130 * hard * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
def clap():
    n = int(.25 * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    e = np.exp(-t * 22) + .7 * np.exp(-np.maximum(0, t - .015) * 22) * (t > .015)
    return np.convolve(x, [1, -.9], 'same') * e * .5
def snare():
    n = int(.22 * SR); t = np.arange(n) / SR
    return (rng.standard_normal(n) * .6 + np.sin(2 * np.pi * 190 * t)) * np.exp(-t * 18) * .5
def rim():
    n = int(.05 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 90) * .5
def hat(open_=False):
    n = int((.3 if open_ else .05) * SR); t = np.arange(n) / SR
    return np.diff(np.r_[0, rng.standard_normal(n)]) * np.exp(-t * (9 if open_ else 70)) * .22
def shaker():
    n = int(.07 * SR); t = np.arange(n) / SR; return rng.standard_normal(n) * np.sin(np.pi * t / .07) * .08
def tone(f, dur, kind='saw', d=.3, a=.005):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == 'saw': s = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 8))
    elif kind == 'sq': s = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 8, 2))
    elif kind == 'bell': s = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4)
    elif kind == 'pluck': s = np.sin(2 * np.pi * f * t + 2 * np.exp(-t * 20) * np.sin(2 * np.pi * f * 2 * t))
    else: s = np.sin(2 * np.pi * f * t)
    return s * env(n, a, d)
def pad(m_list, dur, gain=.05, start=0):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in m_list:
        f = mid(m); s += sum(np.sin(2 * np.pi * f * k * t * (1 + .002 * k)) / k ** 1.5 for k in range(1, 5))
    s *= np.minimum(1, t / .4) * np.minimum(1, (dur - t) / .4); add(s, start, gain=gain)
mid = lambda m: 440 * 2 ** ((m - 69) / 12)

PROG_A = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]   # C G Am F
PROG_B = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]   # Am F C G
PROG_F = [[53, 57, 60], [55, 59, 62], [57, 60, 64], [57, 60, 64]]   # F G Am Am

def section(t):
    for a, b, name in [(0, 3, 'intro'), (3, 14.5, 'A'), (14.5, 35, 'B'), (35, 42, 'C'), (42, 46, 'D'),
                       (46, 80, 'E'), (80, 89, 'F'), (89, 96, 'G'), (96, 97, 'end')]:
        if a <= t < b: return name, t - a
    return 'end', 0

LEADS = ['sq', 'pluck', 'saw', 'bell', 'pluck', 'sq']   # hər şöbədə fərqli tembr
for i in range(int(T / STEP)):
    t = i * STEP; st = i % 16; bar = i // 16; sec, lt = section(t)
    prog = PROG_B if sec in ('B', 'C') else PROG_F if sec == 'F' else PROG_A
    ch = prog[bar % 4]; root = ch[0] - 24
    if st == 0 and sec not in ('end',):
        pad(ch if sec != 'C' else [ch[0], ch[2], ch[0] + 12], 2.0, gain={'intro': .07, 'C': .08, 'F': .04}.get(sec, .045), start=t)
    if sec == 'intro':
        if st % 4 == 0: add(tone(mid(ch[st // 4 % 3] + 24), .8, 'bell', d=.5), t, pan=.3 * (st % 8 - 2) / 4, gain=.08)
    elif sec == 'A':        # yüngül pop ritmi
        if st in (0, 8): add(kick(.8), t, gain=.7)
        if st in (4, 12): add(clap(), t, gain=.45)
        if st % 2 == 0: add(hat(), t, pan=.3, gain=.5)
        add(tone(mid([ch[0], ch[1], ch[2], ch[1]][st % 4] + 12), STEP, 'sq', d=.08), t, pan=(.4 if st % 2 else -.4), gain=.05)
        if st in (0, 6, 8, 14): add(tone(mid(root), .3, 'saw', d=.18), t, gain=.16)
    elif sec == 'B':        # sinkopalı ritm, şeyker
        if st in (0, 6, 10): add(kick(.9), t, gain=.8)
        if st in (4, 12): add(snare(), t, gain=.5)
        if st in (3, 11, 15): add(rim(), t, pan=-.3, gain=.35)
        add(shaker(), t, pan=.4, gain=.9 if st % 2 else .5)
        if st in (0, 3, 6, 10, 13): add(tone(mid(root), .25, 'saw', d=.15), t, gain=.2)
        if st in (0, 3, 6, 8, 11, 14): add(tone(mid([ch[2], ch[1], ch[0], ch[2], ch[1], ch[0] + 12][[0, 3, 6, 8, 11, 14].index(st)] + 12), .3, 'pluck', d=.15), t, pan=.2, gain=.07)
    elif sec == 'C':        # sakit hissə: ürək döyüntüsü
        if st == 0: add(kick(.5), t, gain=.45)
        if st == 3: add(kick(.5), t, gain=.3)
        if st % 4 == 0: add(tone(mid(ch[st // 4 % 3] + 12), .5, 'sine', d=.35), t, gain=.07)
    elif sec == 'D':        # yüksələn hissə
        k = lt / 4
        if st % 4 == 0: add(kick(.7 + .3 * k), t, gain=.5 + .4 * k)
        if (k < .5 and st % 2 == 0) or k >= .5: add(snare(), t, gain=.12 + .45 * k)
    elif sec == 'E':        # əsas "drop": dörd zərbəli rəqs ritmi
        if st % 4 == 0: add(kick(1.1), t, gain=.95)
        if st in (4, 12): add(clap(), t, gain=.65)
        if st % 4 == 2: add(hat(True), t, pan=.3, gain=.55)
        else: add(hat(), t, pan=-.2, gain=.35)
        if st % 2 == 0: add(tone(mid(root + (12 if st % 4 == 2 else 0)), .22, 'saw', d=.12), t, gain=.2)
        lead = LEADS[min(5, max(0, int((t - 50) // 5)))] if t >= 50 else 'saw'
        mel = [ch[2] + 12, None, ch[1] + 12, None, ch[2] + 12, ch[0] + 24, None, ch[2] + 12, ch[1] + 12, None, ch[0] + 12, None, ch[1] + 12, None, ch[2] + 12, None]
        if bar % 2 == 1 and mel[st]: add(tone(mid(mel[st]), .25, lead, d=.16, a=.008), t, pan=.15, gain=.06)
    elif sec == 'F':        # yarım temp hip-hop
        if st in (0, 7, 10): add(kick(1.0), t, gain=.85)
        if st == 8: add(snare(), t, gain=.7)
        if st in (2, 6, 10, 14): add(hat(), t, gain=.45)
        if st in (0, 10): add(tone(mid(root), .6, 'saw', d=.3), t, gain=.2)
        if st in (0, 3): [add(tone(mid(m + 12), .2, 'saw', d=.1), t, gain=.03) for m in ch]
    elif sec == 'G':        # final: hər zərbədə əl çalma
        if st % 4 == 0: add(kick(1.1), t, gain=.95); add(clap(), t, gain=.45)
        if st % 2 == 1: add(hat(), t, gain=.45)
        if st % 2 == 0: add(tone(mid(root + (12 if st % 4 == 2 else 0)), .22, 'saw', d=.12), t, gain=.22)
        add(tone(mid([ch[0], ch[1], ch[2], ch[0] + 12][st % 4] + 12), STEP, 'sq', d=.08), t, pan=(.4 if st % 2 else -.4), gain=.06)

# riser + keçid zərbələri
n = int(4 * SR); tt = np.arange(n) / SR; add(rng.standard_normal(n) * (tt / 4) ** 2 * .25, 42)
for at, g in ((3, .9), (14.5, .5), (35, .6), (46, 1.3), (80, .8), (89, 1.2), (96, 1.3)):
    add(kick(1.2), at, gain=g); n = int(1.6 * SR); tt = np.arange(n) / SR; add(rng.standard_normal(n) * np.exp(-tt * 2.5) * .12 * g, at)
add(tone(mid(48), 1.0, 'bell', d=1.2), 96, gain=.15); [add(tone(mid(m), 1.0, 'saw', d=.6), 96, gain=.04) for m in (60, 64, 67, 72)]

mix = np.stack([L, R], 1)
fade = np.ones(N); fi = int(.4 * SR); fade[:fi] = np.linspace(0, 1, fi); fo = int(1.0 * SR); fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade[:, None]; mix = np.tanh(mix * 1.4); mix /= np.abs(mix).max() * 1.12
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok')

#!/usr/bin/env python3
"""
Gera as duas faixas de DEMONSTRAÇÃO usadas pelo reprodutor (public/audio/).

São peças curtas, sintetizadas aqui mesmo (síntese aditiva com timbre de
piano e reverberação simples), apenas para que o reprodutor possa ser
experimentado sem depender de arquivos externos. Substitua-as pelas músicas
de vocês em src/data/tracks.ts.

Uso: python3 scripts/generate-demo-audio.py   (requer numpy e ffmpeg)
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def piano(freq, dur, vel=0.6, rng=None):
    t = np.arange(int(SR * dur)) / SR
    tone = np.zeros_like(t)
    B = 0.00035
    for n in range(1, 9):
        f = n * freq * np.sqrt(1 + B * n * n)
        if f > SR / 2.2:
            break
        amp = 1 / n ** 1.35
        decay = np.exp(-t * (0.55 + 0.42 * n) * (freq / 440) ** 0.35)
        tone += amp * decay * np.sin(2 * np.pi * f * t + (rng.random() * 0.3 if rng is not None else 0))
    attack = np.minimum(1, t / 0.006)
    hammer = (rng.standard_normal(len(t)) if rng is not None else 0) * np.exp(-t * 90) * 0.015
    return (tone * attack + hammer) * vel


def reverb(signal, seconds=2.4, wet=0.28, seed=3):
    rng = np.random.default_rng(seed)
    n = int(SR * seconds)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 3.2)
    ir[: int(SR * 0.012)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(signal) + n)))
    out = np.fft.irfft(np.fft.rfft(signal, size) * np.fft.rfft(ir, size), size)[: len(signal) + n]
    dry = np.concatenate([signal, np.zeros(n)])
    return dry * (1 - wet) + out * wet * 0.9


def render(chords, melody, bpm, bars_repeat, seed, rain=False):
    rng = np.random.default_rng(seed)
    beat = 60 / bpm
    bar = beat * 4
    total = bar * len(chords) * bars_repeat + 4
    left = np.zeros(int(SR * total))
    right = np.zeros_like(left)

    def place(freq, start, dur, vel, pan):
        s = int(start * SR)
        note = piano(freq, dur, vel, rng)
        e = min(len(left), s + len(note))
        left[s:e] += note[: e - s] * (1 - pan) ** 0.5
        right[s:e] += note[: e - s] * pan ** 0.5

    t0 = 0.6
    for rep in range(bars_repeat):
        for ci, chord in enumerate(chords):
            start = t0 + (rep * len(chords) + ci) * bar
            place(midi(chord[0] - 12), start, bar * 1.6, 0.42, 0.42)
            pattern = [1, 2, 3, 2, 1, 2, 3, len(chord) - 1]
            for k, idx in enumerate(pattern):
                n = chord[min(idx, len(chord) - 1)]
                jitter = rng.normal(0, 0.008)
                v = 0.22 + 0.06 * rng.random() - (0.04 if k % 2 else 0)
                place(midi(n), start + k * beat / 2 + jitter, beat * 3, v, 0.35 + (n % 12) / 24)
            if rep > 0 or ci % 2 == 0:
                mel = melody[(rep * len(chords) + ci) % len(melody)]
                for j, (n, off, d) in enumerate(mel):
                    place(midi(n), start + off * beat + rng.normal(0, 0.01), d * beat + 1.5, 0.34, 0.6)

    mix = np.stack([left, right])
    if rain:
        noise = rng.standard_normal(mix.shape[1])
        spec = np.fft.rfft(noise)
        freqs = np.fft.rfftfreq(len(noise), 1 / SR)
        shape = np.where((freqs > 500) & (freqs < 6000), 1.0, 0.15) / np.sqrt(np.maximum(freqs, 20) / 500)
        bed = np.fft.irfft(spec * shape, len(noise))
        bed /= np.max(np.abs(bed)) + 1e-9
        mix += 0.035 * np.stack([bed, np.roll(bed, 1234)])

    mix = np.stack([reverb(mix[0], seed=seed), reverb(mix[1], seed=seed + 1)])
    fade_in = np.minimum(1, np.arange(mix.shape[1]) / (SR * 0.8))
    fade_out = np.minimum(1, (mix.shape[1] - np.arange(mix.shape[1])) / (SR * 5))
    mix *= fade_in * fade_out
    mix /= np.max(np.abs(mix)) + 1e-9
    return (mix * 0.7).T


def save_mp3(stereo, name):
    os.makedirs(OUT, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        path = tmp.name
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    target = os.path.join(OUT, name)
    subprocess.run(
        ['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-codec:a', 'libmp3lame', '-b:a', '96k',
         '-metadata', 'title=' + name, '-metadata', 'comment=Faixa de demonstracao gerada', target],
        check=True,
    )
    os.remove(path)
    print('gerado', target)


if __name__ == '__main__':
    # Estudo para uma noite de chuva — lá menor, lento.
    chuva_chords = [
        [57, 60, 64, 67, 71],  # Am9
        [53, 57, 60, 64, 69],  # Fmaj7
        [48, 55, 60, 64, 67],  # C
        [55, 59, 62, 64, 67],  # G6
    ]
    chuva_mel = [
        [(76, 0, 2), (74, 2.5, 1.5)],
        [(72, 0, 3)],
        [(71, 0, 1), (72, 1, 1), (67, 2, 2)],
        [(69, 0, 4)],
    ]
    save_mp3(render(chuva_chords, chuva_mel, bpm=58, bars_repeat=5, seed=11, rain=True), 'demo-estudo-chuva.mp3')

    # Peça para uma manhã lenta — ré maior, um pouco mais clara.
    manha_chords = [
        [50, 54, 57, 61, 66],  # Dmaj7
        [55, 59, 62, 66, 69],  # Gmaj7
        [47, 54, 57, 62, 66],  # Bm7
        [45, 52, 57, 59, 64],  # Asus
    ]
    manha_mel = [
        [(78, 0, 1.5), (76, 1.5, 0.5), (74, 2, 2)],
        [(74, 0, 1), (78, 1, 3)],
        [(73, 0, 2), (71, 2, 2)],
        [(69, 0, 1), (71, 1, 1), (73, 2, 2)],
    ]
    save_mp3(render(manha_chords, manha_mel, bpm=66, bars_repeat=5, seed=23), 'demo-manha-lenta.mp3')

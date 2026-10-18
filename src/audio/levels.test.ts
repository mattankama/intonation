import { describe, expect, it } from 'vitest';
import { TIMBRE_PRESET_IDS, presetHarmonics, timbreRms, wavePeak } from '../core';
import {
  ATTACK_SECONDS,
  HANDOVER_SECONDS,
  MAX_VOICES,
  SAFETY_NET_THRESHOLD_DB,
  VOICE_PEAK_MAX,
  phaseAlignedStart,
  retimedStart,
  voiceAmplitudes,
  volumeGain,
} from './levels';

const BRIGHTNESS_STEPS = Array.from({ length: 21 }, (_, i) => -1 + i / 10);
const everyTimbre = TIMBRE_PRESET_IDS.flatMap((id) =>
  BRIGHTNESS_STEPS.map((b) => ({ id, b, harmonics: presetHarmonics(id, b) })),
);

describe('Voice levels: presets loudness-matched by RMS, with headroom', () => {
  it('every preset at every brightness sounds at the same RMS', () => {
    const sine = timbreRms(voiceAmplitudes(presetHarmonics('sine')));
    for (const { id, b, harmonics } of everyTimbre) {
      expect(timbreRms(voiceAmplitudes(harmonics)), `${id} b=${b}`).toBeCloseTo(sine, 6);
    }
  });

  it('a voice is as loud alone as among others: its amplitudes depend on the Timbre only', () => {
    const organ = presetHarmonics('organ');
    expect(voiceAmplitudes(organ)).toEqual(voiceAmplitudes([...organ]));
  });

  it('keeps the shape of the Timbre (only scales it)', () => {
    const organ = presetHarmonics('organ');
    const voice = voiceAmplitudes(organ);
    voice.forEach((a, i) => expect(a / voice[0]!).toBeCloseTo(organ[i]! / organ[0]!, 9));
  });

  it('a spiky Timbre (a Custom Timbre with every harmonic full) is turned down to the voice peak cap', () => {
    const allHarmonics = Array.from({ length: 16 }, () => 1);
    expect(wavePeak(voiceAmplitudes(allHarmonics))).toBeLessThanOrEqual(VOICE_PEAK_MAX + 1e-9);
  });

  it('a silent Timbre stays silent', () => {
    expect(voiceAmplitudes([0, 0])).toEqual([0, 0]);
  });
});

/**
 * Decision #6: headroom from a worst-case peak bound, so the safety-net compressor never
 * engages. The engine lets at most MAX_VOICES voices sound or ring out at once; a voice
 * handed over to a new note fades at least as fast as the new one rises, so the pair
 * never sums above one voice. So the output peaks at most MAX_VOICES voice peaks.
 */
describe('Headroom: the worst reachable sound stays under the safety net', () => {
  const threshold = 10 ** (SAFETY_NET_THRESHOLD_DB / 20);
  const loudestVoice = Math.max(
    ...everyTimbre.map(({ harmonics }) => wavePeak(voiceAmplitudes(harmonics))),
    wavePeak(voiceAmplitudes(Array.from({ length: 16 }, () => 1))),
  );

  it('the compressor threshold is −1 dBFS: 0.891', () => {
    expect(threshold).toBeCloseTo(0.891, 3);
  });

  it('room for the biggest chord (a 6-note lattice chord) and two more notes before any is handed over', () => {
    expect(MAX_VOICES).toBeGreaterThanOrEqual(8);
  });

  it('every voice at once, all peaking together, at full volume, stays under the threshold', () => {
    expect(MAX_VOICES * loudestVoice * volumeGain(100)).toBeLessThanOrEqual(threshold);
  });

  it('the headroom is not wasted: that worst case comes within 1 dB of the threshold', () => {
    expect(MAX_VOICES * loudestVoice * volumeGain(100)).toBeGreaterThan(threshold * 10 ** (-1 / 20));
  });

  it('a handed-over voice fades at least as fast as the new note rises, so the two never sum above one', () => {
    expect(HANDOVER_SECONDS).toBeLessThanOrEqual(ATTACK_SECONDS);
    for (let t = 0; t <= 0.2; t += 0.0005) {
      const fading = Math.exp(-t / HANDOVER_SECONDS); // from full level, the worst case
      const rising = 1 - Math.exp(-t / ATTACK_SECONDS);
      expect(fading + rising).toBeLessThanOrEqual(1 + 1e-12);
    }
  });
});

describe('Master volume', () => {
  it('runs from silent to full gain on a squared taper', () => {
    expect(volumeGain(0)).toBe(0);
    expect(volumeGain(100)).toBe(1);
    expect(volumeGain(50)).toBeCloseTo(0.25, 9);
  });
});

describe('Phase-aligned start for a Timbre crossfade', () => {
  it('starts the new oscillator a whole number of periods after the note began', () => {
    const t = phaseAlignedStart(1.0, 440, 2.3);
    expect(t).toBeGreaterThanOrEqual(2.3);
    const periods = (t - 1.0) * 440;
    expect(Math.abs(periods - Math.round(periods))).toBeLessThan(1e-6);
  });

  it('starts within one period of the requested time', () => {
    expect(phaseAlignedStart(0.5, 100, 3)).toBeLessThan(3 + 1 / 100 + 1e-12);
  });
});

describe('A note whose frequency changes while it sounds', () => {
  it('keeps later crossfades in phase: started at 0 s at 440 Hz, moved to 443 Hz at 1.25 s', () => {
    const start = retimedStart(0, 440, 443, 1.25);
    const t = phaseAlignedStart(start, 443, 2);
    expect(t).toBeGreaterThanOrEqual(2);
    // The sounding oscillator's own cycles: 440 a second until 1.25 s, then 443 a second.
    const cycles = 440 * 1.25 + 443 * (t - 1.25);
    expect(Math.abs(cycles - Math.round(cycles))).toBeLessThan(1e-6);
  });

  it('is unchanged when the frequency is', () => {
    expect(retimedStart(0.5, 440, 440, 3)).toBeCloseTo(0.5, 12);
  });
});

import { describe, expect, it } from 'vitest';
import { TIMBRE_PRESET_IDS, presetHarmonics, timbreRms, wavePeak } from '../core';
import { phaseAlignedStart, voiceAmplitudes, volumeGain } from './levels';

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

  it('a 3-note chord at full volume peaks at most 0.6 for every preset and brightness', () => {
    for (const { id, b, harmonics } of everyTimbre) {
      expect(3 * wavePeak(voiceAmplitudes(harmonics)), `${id} b=${b}`).toBeLessThanOrEqual(0.6);
    }
  });

  it('the headroom is not wasted: the loudest case comes close to 0.6', () => {
    const worst = Math.max(...everyTimbre.map(({ harmonics }) => 3 * wavePeak(voiceAmplitudes(harmonics))));
    expect(worst).toBeGreaterThan(0.5);
  });

  it('keeps the shape of the Timbre (only scales it)', () => {
    const organ = presetHarmonics('organ');
    const voice = voiceAmplitudes(organ);
    voice.forEach((a, i) => expect(a / voice[0]!).toBeCloseTo(organ[i]! / organ[0]!, 9));
  });

  it('a spiky Timbre is turned down so one voice never peaks above 0.2', () => {
    const allHarmonics = Array.from({ length: 16 }, () => 1);
    expect(wavePeak(voiceAmplitudes(allHarmonics))).toBeLessThanOrEqual(0.2 + 1e-9);
  });

  it('a silent Timbre stays silent', () => {
    expect(voiceAmplitudes([0, 0])).toEqual([0, 0]);
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

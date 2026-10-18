import { describe, expect, it } from 'vitest';
import {
  TIMBRE_PRESET_IDS,
  presetHarmonics,
  timbreRms,
  wavePeak,
  withBrightness,
} from './index';

const expectClose = (actual: readonly number[], expected: readonly number[], digits = 3) => {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((a, i) => expect(a, `harmonic ${i + 1}`).toBeCloseTo(expected[i]!, digits));
};

describe('Timbre preset recipes (decision: Timbre preset recipes, issue #14)', () => {
  it('lists the five presets in order', () => {
    expect(TIMBRE_PRESET_IDS).toEqual(['sine', 'organ', 'string', 'brass', 'voice']);
  });

  it('give 16 harmonics with the strongest at 1', () => {
    for (const id of TIMBRE_PRESET_IDS) {
      const h = presetHarmonics(id);
      expect(h, id).toHaveLength(16);
      expect(Math.max(...h), id).toBe(1);
    }
  });

  it('sine is the fundamental alone', () => {
    expect(presetHarmonics('sine')).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('organ-like is the drawbar mix', () => {
    expect(presetHarmonics('organ')).toEqual([
      1, 0.8, 0.6, 0.5, 0, 0.4, 0, 0.3, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it('string-like follows 1/n × (1 + 1.2·e^(−(n−4.5)²/4)), scaled to a peak of 1', () => {
    expectClose(
      presetHarmonics('string'),
      [
        1, 0.593, 0.531, 0.504, 0.403, 0.266, 0.169, 0.125, 0.106, 0.095, 0.086, 0.079, 0.073,
        0.068, 0.063, 0.059,
      ],
    );
  });

  it('brass-like peaks at harmonic 2', () => {
    expect(presetHarmonics('brass')).toEqual([
      0.8, 1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.09, 0.05, 0.03, 0.02, 0.01, 0, 0, 0, 0,
    ]);
  });

  it('voice-like is the "Ah" with formant peaks near harmonics 3, 5 and 10', () => {
    expect(presetHarmonics('voice')).toEqual([
      0.384, 0.737, 1, 0.73, 0.647, 0.25, 0.072, 0.096, 0.19, 0.249, 0.184, 0.083, 0.034, 0.023,
      0.02, 0.019,
    ]);
  });
});

describe('Brightness: aₙ × n^b', () => {
  const organ = presetHarmonics('organ');

  it('b = 0 leaves the recipe as drawn', () => {
    expect(withBrightness(organ, 0)).toEqual(organ);
  });

  it('b = +1 multiplies each harmonic by its number', () => {
    expectClose(withBrightness(organ, 1), [1, 1.6, 1.8, 2, 0, 2.4, 0, 2.4, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('b = −1 divides each harmonic by its number', () => {
    expectClose(
      withBrightness(organ, -1),
      [1, 0.4, 0.2, 0.125, 0, 0.0667, 0, 0.0375, 0, 0, 0, 0, 0, 0, 0, 0],
    );
  });

  it('b = 0.5 multiplies by the square root of the harmonic number', () => {
    expectClose(withBrightness([1, 1, 1, 1], 0.5), [1, 1.4142, 1.7321, 2]);
  });

  it('presets apply brightness, except Sine', () => {
    expectClose(presetHarmonics('organ', 1), withBrightness(organ, 1));
    expect(presetHarmonics('sine', 1)).toEqual(presetHarmonics('sine'));
    expect(presetHarmonics('sine', -1)).toEqual(presetHarmonics('sine'));
  });
});

describe('Level of a Timbre’s waveform (all harmonics in sine phase)', () => {
  it('RMS of a unit sine is 1/√2', () => {
    expect(timbreRms([1])).toBeCloseTo(0.70711, 5);
  });

  it('RMS adds harmonics in power: organ-like is √(2.5/2)', () => {
    expect(timbreRms(presetHarmonics('organ'))).toBeCloseTo(1.11803, 5);
  });

  it('peak of a unit sine is 1', () => {
    expect(wavePeak([1])).toBeCloseTo(1, 4);
  });

  it('peak of sin θ + sin 2θ is 1.7602', () => {
    expect(wavePeak([1, 1])).toBeCloseTo(1.7602, 3);
  });

  it('peak of a silent Timbre is 0', () => {
    expect(wavePeak([0, 0])).toBe(0);
    expect(timbreRms([0, 0])).toBe(0);
  });
});

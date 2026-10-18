import { describe, expect, it } from 'vitest';
import { chordRoughness, partialRoughness, roughnessLandscape, roughnessScale, stackedChord } from './index';

// research/roughness-model.md §4: C4 = 261.63 Hz, 6 harmonics at 1/k.
const C4 = 261.6256;
const ONE_OVER_K = [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6];
const at = (f: number, cents: number) => f * 2 ** (cents / 1200);

/** Roughness between two notes only: the dyad minus each note's own (intra-note) roughness. */
const crossRoughness = (f1: number, f2: number, h: readonly number[]) =>
  chordRoughness([f1, f2], h) - chordRoughness([f1], h) - chordRoughness([f2], h);

describe('roughness (decision #4: Sethares / Plomp–Levelt, every pair of partials, min weighting)', () => {
  it('stretches the curve to the register: s = 0.24 / (0.0207·f₁ + 18.96)', () => {
    expect(roughnessScale(C4)).toBeCloseTo(0.0098459, 6);
    // Two equal partials are roughest about 0.2206 / s apart, ≈ 22 Hz at C4 (research table: 250 Hz → ≈ 22 Hz).
    const at = (gap: number) => partialRoughness(C4, C4 + gap, 1, 1);
    expect(at(22.4)).toBeGreaterThan(at(15));
    expect(at(22.4)).toBeGreaterThan(at(30));
  });

  it('matches Sethares’ dissmeasure.m example: 7 equal harmonics on 500 Hz (×5 scale)', () => {
    const seven = [1, 1, 1, 1, 1, 1, 1];
    expect(5 * chordRoughness([500, 500 * 1.06], seven)).toBeCloseTo(5.017, 2);
    expect(5 * chordRoughness([500, 500 * 1.25], seven)).toBeCloseTo(2.134, 2);
    expect(5 * chordRoughness([500, 500 * 1.5], seven)).toBeCloseTo(0.835, 2);
    expect(5 * chordRoughness([500, 500 * 2], seven)).toBeCloseTo(0.16, 2);
  });

  it('a unison and a pure fifth are far smoother than a 12-EDO semitone (C4, 1/k harmonics)', () => {
    const unison = crossRoughness(C4, C4, ONE_OVER_K);
    const fifth = crossRoughness(C4, (C4 * 3) / 2, ONE_OVER_K);
    const semitone = crossRoughness(C4, at(C4, 100), ONE_OVER_K);
    expect(unison).toBeCloseTo(0.0059, 3);
    expect(fifth).toBeCloseTo(0.0477, 3);
    expect(semitone).toBeCloseTo(0.4187, 3);
    expect(unison).toBeLessThan(fifth);
    expect(fifth).toBeLessThan(semitone);
  });

  it('three-note chords, relative to the C–C♯–D cluster, match the research’s triad table', () => {
    const triad = (...ratios: number[]) => chordRoughness(ratios.map((r) => C4 * r), ONE_OVER_K);
    const edo = (...cents: number[]) => chordRoughness(cents.map((c) => at(C4, c)), ONE_OVER_K);
    const cluster = edo(0, 100, 200);
    const relative = {
      unison: triad(1, 1, 1) / cluster,
      fifths: triad(1, 3 / 2, 9 / 4) / cluster,
      major: triad(1, 5 / 4, 3 / 2) / cluster,
      minor: triad(1, 6 / 5, 3 / 2) / cluster,
      sus4: triad(1, 4 / 3, 3 / 2) / cluster,
      edoMajor: edo(0, 400, 700) / cluster,
      edoMinor: edo(0, 300, 700) / cluster,
      edoAugmented: edo(0, 400, 800) / cluster,
      edoDiminished: edo(0, 300, 600) / cluster,
    };
    expect(relative.unison).toBeCloseTo(0.023, 2);
    expect(relative.fifths).toBeCloseTo(0.142, 2);
    expect(relative.major).toBeCloseTo(0.337, 2);
    expect(relative.minor).toBeCloseTo(0.348, 2);
    expect(relative.sus4).toBeCloseTo(0.371, 2);
    expect(relative.edoMajor).toBeCloseTo(0.377, 2);
    expect(relative.edoMinor).toBeCloseTo(0.391, 2);
    expect(relative.edoAugmented).toBeCloseTo(0.416, 2);
    expect(relative.edoDiminished).toBeCloseTo(0.514, 2);
    // Pure chords are smoother than their 12-EDO versions; 4:5:6 < 10:12:15 < 12-EDO major.
    expect(relative.major).toBeLessThan(relative.minor);
    expect(relative.minor).toBeLessThan(relative.edoMajor);
  });

  it('a harmonic with no strength adds no roughness, and a single sine tone has none', () => {
    expect(chordRoughness([C4, at(C4, 100)], [1, 0, 0])).toBeCloseTo(chordRoughness([C4, at(C4, 100)], [1]), 12);
    expect(chordRoughness([C4], [1])).toBe(0);
  });
});

describe('the roughness landscape (decision #15)', () => {
  it('stacks the lower and upper intervals on the bottom note', () => {
    const [bottom, middle, top] = stackedChord(C4, 386.3137, 315.6413);
    expect(bottom).toBeCloseTo(261.6256, 4);
    expect(middle).toBeCloseTo(327.032, 3); // 5/4 above C4
    expect(top).toBeCloseTo(392.4384, 3); // 3/2 above C4
  });

  it('covers 0–1200¢ on both axes, with the roughest grid point at exactly 1', () => {
    const land = roughnessLandscape(C4, ONE_OVER_K, 13);
    expect(land.cents).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]);
    expect(land.heights).toHaveLength(13 * 13);
    expect(Math.max(...land.heights)).toBe(1);
    expect(Math.min(...land.heights)).toBeGreaterThanOrEqual(0);
  });

  it('heights are relative roughness: the 12-EDO major chord is 0.377 of the C–C♯–D cluster', () => {
    const land = roughnessLandscape(C4, ONE_OVER_K, 13);
    const height = (lower: number, upper: number) => land.heights[(lower / 100) * 13 + upper / 100]!;
    expect(height(400, 300) / height(100, 100)).toBeCloseTo(0.377, 2);
    expect(height(0, 0)).toBeLessThan(0.1);
    expect(land.relative(stackedChord(C4, 400, 300))).toBeCloseTo(height(400, 300), 6);
  });

  it('is scaled per Timbre: a sine landscape and an organ landscape both peak at 1 but differ in shape', () => {
    const sine = roughnessLandscape(C4, [1], 13);
    const organ = roughnessLandscape(C4, [1, 0.8, 0.6, 0.5, 0, 0.4, 0, 0.3], 13);
    expect(Math.max(...sine.heights)).toBe(1);
    expect(Math.max(...organ.heights)).toBe(1);
    // Two stacked tritones: sine fundamentals this far apart barely clash, but the harmonics do.
    const tritones = (land: typeof sine) => land.heights[6 * 13 + 6]!;
    expect(tritones(sine)).toBeLessThan(0.1);
    expect(tritones(organ)).toBeGreaterThan(3 * tritones(sine));
  });

  it('a lower bottom note makes the same chord rougher', () => {
    const low = roughnessLandscape(C4 / 2, ONE_OVER_K, 13);
    const high = roughnessLandscape(C4 * 2, ONE_OVER_K, 13);
    const major = (land: typeof low) => land.max * land.heights[4 * 13 + 3]!;
    expect(major(low)).toBeGreaterThan(major(high));
  });
});

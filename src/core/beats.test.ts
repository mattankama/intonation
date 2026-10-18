import { describe, expect, it } from 'vitest';
import { chordBeats, presetHarmonics, tuneChord } from './index';

// A4 = 440: C4, and 12-EDO E4 and G4 (research/audible-beats.md §4).
const C4 = 261.6256;
const E4 = 329.6276;
const G4 = 391.9954;
const PURE_E4 = (C4 * 5) / 4;
const STRING = presetHarmonics('string');

describe('beats between the notes of a chord (decision #5)', () => {
  it('12-EDO C4–E4: C’s 5th harmonic against E’s 4th beats at 10.4 Hz', () => {
    const [pair] = chordBeats([C4, E4], STRING);
    expect(pair!.lower).toBe(0);
    expect(pair!.upper).toBe(1);
    expect(pair!.beats).toHaveLength(1);
    expect(pair!.beats[0]!.harmonics).toEqual([5, 4]);
    expect(pair!.beats[0]!.rate).toBeCloseTo(10.38, 2);
  });

  it('the 12-EDO C4 major chord’s third beats at ≈ 10.4 Hz; its pure chord’s does not', () => {
    const tuned = tuneChord(
      { system: '12-edo', tonic: 0 },
      { root: 0, type: 'major', inversion: 0, pure: '5-limit' },
      440,
    );
    const played = chordBeats(tuned.notes.map((n) => n.frequency), STRING);
    expect(played[0]!.beats[0]!.rate).toBeCloseTo(10.4, 1);
    const pure = chordBeats(tuned.notes.map((n) => n.pureFrequency), STRING);
    expect(pure[0]!.beats).toEqual([]);
  });

  it('a pure third C4–E4 (5/4) has no beat: C h5 and E h4 coincide', () => {
    expect(chordBeats([C4, PURE_E4], STRING)[0]!.beats).toEqual([]);
  });

  it('12-EDO C major: C–G 0.89 Hz (then 1.77 Hz), E–G 17.8 Hz, strongest first', () => {
    const pairs = chordBeats([C4, E4, G4], STRING);
    expect(pairs.map((p) => [p.lower, p.upper])).toEqual([
      [0, 1],
      [0, 2],
      [1, 2],
    ]);
    const cg = pairs[1]!.beats;
    expect(cg.map((b) => b.harmonics)).toEqual([
      [3, 2],
      [6, 4],
    ]);
    expect(cg[0]!.rate).toBeCloseTo(0.89, 2);
    expect(cg[1]!.rate).toBeCloseTo(1.77, 2);
    expect(pairs[2]!.beats[0]!.harmonics).toEqual([6, 5]);
    expect(pairs[2]!.beats[0]!.rate).toBeCloseTo(17.8, 1);
  });

  it('weights each beat by the weaker partial: min(aᵢ, aⱼ)', () => {
    const cg = chordBeats([C4, G4], STRING)[0]!.beats;
    // String-like: a₃ = 0.531, a₂ = 0.593; a₆ = 0.266, a₄ = 0.504.
    expect(cg[0]!.weight).toBeCloseTo(0.531, 3);
    expect(cg[1]!.weight).toBeCloseTo(0.266, 3);
  });

  it('a sine has no partials close enough to beat in a 12-EDO third', () => {
    expect(chordBeats([C4, E4], presetHarmonics('sine'))[0]!.beats).toEqual([]);
  });

  it('ignores differences over 20 Hz: the minor third’s C h7–E♭ h6 at 35 Hz is not a beat', () => {
    const E_FLAT4 = 311.127;
    const beats = chordBeats([C4, E_FLAT4], STRING)[0]!.beats;
    expect(beats.map((b) => b.harmonics)).toEqual([[6, 5]]);
    expect(beats[0]!.rate).toBeCloseTo(14.1, 1);
  });

  it('hides beats weaker than −20 dB of the strongest partial', () => {
    const faint = [1, 0.5, 0.5, 0.5, 0.09, 0, 0, 0];
    expect(chordBeats([C4, E4], faint)[0]!.beats).toEqual([]);
    const audible = [1, 0.5, 0.5, 0.5, 0.11, 0, 0, 0];
    expect(chordBeats([C4, E4], audible)[0]!.beats).toHaveLength(1);
  });

  it('looks only at harmonics 1–8: C h10 – E h8 (20.8 Hz… and beyond) never counts', () => {
    const flat = Array.from({ length: 16 }, () => 1);
    for (const beat of chordBeats([C4, E4], flat)[0]!.beats) {
      expect(Math.max(...beat.harmonics)).toBeLessThanOrEqual(8);
    }
  });

  it('keeps the top two beats per note pair', () => {
    const flat = Array.from({ length: 16 }, () => 1);
    // C2–E2 in 12-EDO: many pairs fall within 20 Hz in the bass.
    const pairs = chordBeats([C4 / 4, E4 / 4], flat);
    expect(pairs[0]!.beats).toHaveLength(2);
  });
});

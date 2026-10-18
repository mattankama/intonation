import { describe, expect, it } from 'vitest';
import {
  centsAboveTonic,
  chainOfFifths,
  edoLandmarks,
  edoSystem,
  keyConstruction,
  keySpelling,
  noteName,
  resolvePitch,
} from './index';

/** A key of an N-EDO keyboard: its step within the octave, and the octave (step 0 ≈ C). */
const step = (s: number, octave: number) => ({ pitchClass: s, octave });

describe('N-EDO step frequencies', () => {
  it('A4 is a step that sounds at the Reference pitch, whatever N', () => {
    // A4 is step 23 of 31 (the step nearest A when step 0 is the step nearest C).
    expect(resolvePitch({ system: edoSystem(31), tonic: 0 }, step(23, 4), 440).frequency).toBeCloseTo(
      440,
      9,
    );
  });

  it('every step multiplies the frequency by the Nth root of 2, counted from A4', () => {
    const edo31 = { system: edoSystem(31), tonic: 0 };
    // Step 0 is 23 steps below A4: 440 · 2^(−23/31).
    expect(resolvePitch(edo31, step(0, 4), 440).frequency).toBeCloseTo(263.0921, 4);
    expect(resolvePitch(edo31, step(10, 4), 440).frequency).toBeCloseTo(329.0139, 4);
    expect(resolvePitch(edo31, step(0, 5), 440).frequency).toBeCloseTo(526.1842, 4);
    expect(resolvePitch(edo31, step(24, 4), 415).frequency).toBeCloseTo(424.3837, 4);
    expect(resolvePitch(edo31, step(10, 4), 440).centsFromA4).toBeCloseTo(-503.226, 3);
  });

  it('72-EDO contains 12-EDO, so its step 0 is middle C', () => {
    expect(
      resolvePitch({ system: edoSystem(72), tonic: 0 }, step(0, 4), 440).frequency,
    ).toBeCloseTo(261.6256, 4);
  });

  it('the Tonic makes no difference to an EDO', () => {
    const onC = resolvePitch({ system: edoSystem(19), tonic: 0 }, step(5, 4), 440);
    const onFSharp = resolvePitch({ system: edoSystem(19), tonic: 6 }, step(5, 4), 440);
    expect(onFSharp).toEqual(onC);
  });
});

describe('N-EDO landmarks: the steps nearest the 12 familiar notes', () => {
  it('31-EDO puts C D E F G A B on steps 0 5 10 13 18 23 28', () => {
    const steps = edoLandmarks(31);
    expect([0, 2, 4, 5, 7, 9, 11].map((pc) => steps[pc])).toEqual([0, 5, 10, 13, 18, 23, 28]);
    expect([1, 3, 6, 8, 10].map((pc) => steps[pc])).toEqual([2, 8, 15, 20, 26]);
  });

  it('72-EDO contains all of 12-EDO, every sixth step', () => {
    expect(edoLandmarks(72)).toEqual([0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66]);
  });

  it('in 5-EDO several familiar notes share a step, and B is nearest the next octave’s step 0', () => {
    // A4 is step 4 (960¢ above step 0); B sits 200¢ above A, nearest step 5 = the next octave.
    expect(edoLandmarks(5)).toEqual([0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5]);
  });
});

describe('N-EDO notes are named by step, with cents', () => {
  const edo31 = { system: edoSystem(31), tonic: 0 };

  it('names a key "step 10 of 31", and a note with its octave', () => {
    expect(keySpelling(edo31, 10)).toBe('step 10 of 31');
    expect(noteName(edo31, step(10, 4))).toBe('step 10 of 31, octave 4');
    expect(noteName(edo31, step(0, 5))).toBe('step 0 of 31, octave 5');
  });

  it('measures each step in cents above step 0 (published EDO interval sizes)', () => {
    expect(centsAboveTonic(edo31, 10)).toBeCloseTo(387.097, 3);
    expect(centsAboveTonic({ system: edoSystem(19), tonic: 0 }, 11)).toBeCloseTo(694.737, 3);
    expect(centsAboveTonic({ system: edoSystem(53), tonic: 0 }, 31)).toBeCloseTo(701.887, 3);
  });

  it('letter names stay in 12-EDO', () => {
    expect(noteName({ system: edoSystem(12), tonic: 0 }, step(1, 4))).toBe('C♯4');
  });

  it('an EDO has no chain of fifths and no key construction', () => {
    expect(chainOfFifths(edo31)).toBeNull();
    expect(keyConstruction(edo31, 10)).toBeNull();
  });
});

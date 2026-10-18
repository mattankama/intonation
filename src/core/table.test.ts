import { describe, expect, it } from 'vitest';
import { tuningTable } from './index';

const C = 0;
const D = 2;

describe('tuningTable: every note of a tuning system, from its Tonic', () => {
  it('Pythagorean in C: 12 keys with exact ratios and their distance from 12-EDO', () => {
    const rows = tuningTable({ system: 'pythagorean', tonic: C });
    expect(rows).toHaveLength(12);
    const fSharp = rows[6]!;
    expect(fSharp.spelling).toBe('F♯');
    expect(fSharp.note).toEqual({ pitchClass: 6, octave: 4 });
    expect(fSharp.cents).toBeCloseTo(611.73, 3);
    expect(fSharp.ratio).toEqual({ num: 729, den: 512 });
    expect(fSharp.centsFromEdo12).toBeCloseTo(11.73, 3);
    expect(rows[4]!.ratio).toEqual({ num: 81, den: 64 });
  });

  it('¼-comma meantone in C: pure E, and no ratio where a fraction of a comma is left', () => {
    const rows = tuningTable({ system: 'meantone', tonic: C });
    expect(rows[0]).toMatchObject({ spelling: 'C', cents: 0, ratio: { num: 1, den: 1 } });
    expect(rows[4]!.ratio).toEqual({ num: 5, den: 4 });
    expect(rows[4]!.cents).toBeCloseTo(386.314, 3);
    expect(rows[4]!.centsFromEdo12).toBeCloseTo(-13.686, 3);
    expect(rows[2]!.ratio).toBeNull();
    expect(rows[2]!.centsFromEdo12).toBeCloseTo(-6.843, 3);
  });

  it('5-limit just intonation in C: A is 5/3, 15.641¢ below 12-EDO', () => {
    const a = tuningTable({ system: 'just', tonic: C })[9]!;
    expect(a.ratio).toEqual({ num: 5, den: 3 });
    expect(a.cents).toBeCloseTo(884.359, 3);
    expect(a.centsFromEdo12).toBeCloseTo(-15.641, 3);
  });

  it('follows the Tonic: meantone in D starts on D4 and ends on C♯5', () => {
    const rows = tuningTable({ system: 'meantone', tonic: D });
    expect(rows[0]).toMatchObject({ spelling: 'D', note: { pitchClass: 2, octave: 4 }, cents: 0 });
    expect(rows[11]).toMatchObject({ spelling: 'C♯', note: { pitchClass: 1, octave: 5 } });
    expect(rows[4]!.ratio).toEqual({ num: 5, den: 4 });
  });

  it('12-EDO: every key is on 12-EDO and only the Tonic has a ratio', () => {
    const rows = tuningTable({ system: '12-edo', tonic: C });
    expect(rows).toHaveLength(12);
    expect(rows.map((r) => r.centsFromEdo12)).toEqual(Array(12).fill(0));
    expect(rows.filter((r) => r.ratio !== null)).toHaveLength(1);
    expect(rows[7]!.cents).toBeCloseTo(700, 9);
  });

  it('31-EDO in C: 31 steps, step 10 is 387.097¢, 12.903¢ below the 12-EDO E', () => {
    const rows = tuningTable({ system: '31-edo', tonic: C });
    expect(rows).toHaveLength(31);
    expect(rows[10]).toMatchObject({ spelling: 'step 10 of 31', ratio: null });
    expect(rows[10]!.cents).toBeCloseTo(387.097, 3);
    expect(rows[10]!.centsFromEdo12).toBeCloseTo(-12.903, 3);
    expect(rows[0]!.ratio).toEqual({ num: 1, den: 1 });
  });

  it('31-EDO in D: starts on the step nearest D (step 5) and wraps into the next octave', () => {
    const rows = tuningTable({ system: '31-edo', tonic: D });
    expect(rows[0]).toMatchObject({ note: { pitchClass: 5, octave: 4 }, cents: 0 });
    expect(rows[26]!.note).toEqual({ pitchClass: 0, octave: 5 });
  });
});

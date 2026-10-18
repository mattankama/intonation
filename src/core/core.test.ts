import { describe, expect, it } from 'vitest';
import { cents, edo12Frequency, edo12NoteName, ratio, semitonesFromA4 } from './index';

const C4 = { pitchClass: 0, octave: 4 };
const A4 = { pitchClass: 9, octave: 4 };
const A3 = { pitchClass: 9, octave: 3 };
const C5 = { pitchClass: 0, octave: 5 };
const B5 = { pitchClass: 11, octave: 5 };

describe('cents of a ratio', () => {
  it('a pure fifth 3/2 is 701.955 cents', () => {
    expect(cents(ratio(3, 2))).toBeCloseTo(701.955, 3);
  });
});

describe('12-EDO frequencies at the default Reference pitch (440 Hz)', () => {
  it('A4 sounds at the Reference pitch itself', () => {
    expect(edo12Frequency(A4, 440)).toBe(440);
  });

  it('middle C (C4) is 261.63 Hz', () => {
    expect(edo12Frequency(C4, 440)).toBeCloseTo(261.6256, 4);
  });

  it('C5 is 523.25 Hz and B5 is 987.77 Hz', () => {
    expect(edo12Frequency(C5, 440)).toBeCloseTo(523.2511, 4);
    expect(edo12Frequency(B5, 440)).toBeCloseTo(987.7666, 4);
  });

  it('counts notes in semitones from A4', () => {
    expect(semitonesFromA4(A4)).toBe(0);
    expect(semitonesFromA4(C5)).toBe(3);
    expect(semitonesFromA4(C4)).toBe(-9);
  });
});

describe('12-EDO note names', () => {
  it('use familiar spellings with the octave number', () => {
    expect(edo12NoteName(C4)).toBe('C4');
    expect(edo12NoteName({ pitchClass: 1, octave: 4 })).toBe('C♯4');
    expect(edo12NoteName({ pitchClass: 3, octave: 5 })).toBe('E♭5');
    expect(edo12NoteName({ pitchClass: 8, octave: 4 })).toBe('A♭4');
    expect(edo12NoteName({ pitchClass: 10, octave: 3 })).toBe('B♭3');
  });
});

describe('Reference pitch scaling', () => {
  it('A4 follows the Reference pitch, and octaves follow A4', () => {
    expect(edo12Frequency(A4, 415)).toBe(415);
    expect(edo12Frequency(A3, 442)).toBe(221);
  });

  it('Baroque pitch (A4 = 415 Hz) puts middle C at 246.76 Hz', () => {
    expect(edo12Frequency(C4, 415)).toBeCloseTo(246.76, 2);
  });

  it('A4 = 432 Hz puts middle C at 256.87 Hz', () => {
    expect(edo12Frequency(C4, 432)).toBeCloseTo(256.87, 2);
  });
});

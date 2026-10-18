import { describe, expect, it } from 'vitest';
import { ratio } from '../core';
import { formatCents, formatHz, formatPitchRatio, formatRatio, formatSignedCents } from './numbers';

describe('exact pitch ratios from prime exponents (comma pumps)', () => {
  const f = (two: number, three: number, five = 0, seven = 0) => ({ two, three, five, seven });

  it('writes an ordinary ratio out in full', () => {
    expect(formatPitchRatio(f(-2, 0, 1))).toBe('5/4');
    expect(formatPitchRatio(f(-19, 12))).toBe('531441/524288'); // the Pythagorean comma
    expect(formatPitchRatio(f(0, 0))).toBe('1/1');
  });

  it('writes a ratio too long to read as prime powers, still exact', () => {
    // A hundred Pythagorean commas, octave-reduced: 3^1200 / 2^1901 has hundreds of digits.
    expect(formatPitchRatio(f(-1901, 1200))).toBe('3¹²⁰⁰/2¹⁹⁰¹');
    expect(formatPitchRatio(f(5, -40, 1, -1))).toBe('2⁵·5/3⁴⁰·7');
  });
});

describe('site-wide number display', () => {
  it('cents: 3 decimals in The math', () => {
    expect(formatCents(701.95500086, 'math')).toBe('701.955¢');
  });

  it('cents: 1 decimal in Controls tables and labels', () => {
    expect(formatCents(701.95500086, 'controls')).toBe('702.0¢');
    expect(formatCents(386.3137, 'controls')).toBe('386.3¢');
  });

  it('negative cents use a true minus sign', () => {
    expect(formatCents(-13.6863, 'controls')).toBe('−13.7¢');
  });

  it('signed cents: a plus for wide, a true minus for narrow, no sign when it rounds to zero', () => {
    expect(formatSignedCents(0.78329, 'math')).toBe('+0.783¢');
    expect(formatSignedCents(-5.18103, 'controls')).toBe('−5.2¢');
    expect(formatSignedCents(0.0004, 'math')).toBe('0.000¢');
    expect(formatSignedCents(-0.02, 'controls')).toBe('0.0¢');
  });

  it('Hz: 2 decimals everywhere', () => {
    expect(formatHz(440)).toBe('440.00 Hz');
    expect(formatHz(261.6255653)).toBe('261.63 Hz');
  });

  it('ratios: exact fractions', () => {
    expect(formatRatio(ratio(3, 2))).toBe('3/2');
    expect(formatRatio(ratio(162, 160))).toBe('81/80');
  });
});

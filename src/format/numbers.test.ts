import { describe, expect, it } from 'vitest';
import { ratio } from '../core';
import { formatCents, formatHz, formatRatio } from './numbers';

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

  it('Hz: 2 decimals everywhere', () => {
    expect(formatHz(440)).toBe('440.00 Hz');
    expect(formatHz(261.6255653)).toBe('261.63 Hz');
  });

  it('ratios: exact fractions', () => {
    expect(formatRatio(ratio(3, 2))).toBe('3/2');
    expect(formatRatio(ratio(162, 160))).toBe('81/80');
  });
});

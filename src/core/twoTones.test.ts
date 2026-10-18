import { describe, expect, it } from 'vitest';
import { beatRate, centsBetween } from './index';

describe('beatRate: two pure tones beat as often per second as their frequencies differ', () => {
  it('A4 at 440 Hz against 443 Hz beats 3 times a second', () => {
    expect(beatRate(440, 443)).toBeCloseTo(3, 12);
  });

  it('does not care which tone is higher', () => {
    expect(beatRate(443, 440)).toBeCloseTo(3, 12);
  });

  it('a unison does not beat', () => {
    expect(beatRate(440, 440)).toBe(0);
  });
});

describe('centsBetween: the interval from one frequency up to another', () => {
  it('an octave is 1200¢ and a pure fifth 701.955¢', () => {
    expect(centsBetween(440, 880)).toBeCloseTo(1200, 9);
    expect(centsBetween(440, 660)).toBeCloseTo(701.955, 3);
  });

  it('3 Hz above A4 at 440 Hz is about 11.764¢, and the same gap above A3 is nearly twice as wide', () => {
    expect(centsBetween(440, 443)).toBeCloseTo(11.764, 3);
    expect(centsBetween(220, 223)).toBeCloseTo(23.448, 3);
  });

  it('is negative going down', () => {
    expect(centsBetween(880, 440)).toBeCloseTo(-1200, 9);
  });
});

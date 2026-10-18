import { describe, expect, it } from 'vitest';
import { nearestPureInterval } from './index';

describe('nearestPureInterval: the 5-limit pure interval an interval aims at', () => {
  it.each([
    [0, 1, 1],
    [100, 16, 15],
    [200, 9, 8],
    [300, 6, 5],
    [400, 5, 4],
    [407.82, 5, 4], // Pythagorean major third
    [500, 4, 3],
    [611.73, 45, 32], // Pythagorean tritone
    [700, 3, 2],
    [737.637, 3, 2], // meantone wolf fifth
    [800, 8, 5],
    [900, 5, 3],
    [1000, 9, 5],
    [1100, 15, 8],
    [1190, 2, 1],
  ])('%s¢ aims at %s/%s', (size, num, den) => {
    expect(nearestPureInterval(size)).toEqual({ num, den });
  });

  it('beyond the octave it is the same interval plus octaves', () => {
    expect(nearestPureInterval(1586.314)).toEqual({ num: 5, den: 2 });
    expect(nearestPureInterval(1900)).toEqual({ num: 3, den: 1 });
    expect(nearestPureInterval(2400)).toEqual({ num: 4, den: 1 });
  });
});

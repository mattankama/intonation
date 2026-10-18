import { describe, expect, it } from 'vitest';
import { type Pick, SPIRAL_RISE, intervalOf, pickNote, spiralOctaves, spiralPoint } from './spiral';

describe('spiralPoint: one turn per octave', () => {
  it('starts at the front of the spiral and turns a quarter to the right every 300¢', () => {
    const [x0, y0, z0] = spiralPoint(0, 3);
    expect([x0, z0].map((v) => Number(v.toFixed(9)))).toEqual([0, 3]);
    const [x, y, z] = spiralPoint(300, 3);
    expect(x).toBeCloseTo(3, 9);
    expect(z).toBeCloseTo(0, 9);
    expect(y).toBeGreaterThan(y0);
  });

  it('an octave higher is the same angle, one rise higher', () => {
    const [x0, y0, z0] = spiralPoint(386.314, 3.3);
    const [x1, y1, z1] = spiralPoint(386.314 + 1200, 3.3);
    expect(x1).toBeCloseTo(x0, 9);
    expect(z1).toBeCloseTo(z0, 9);
    expect(y1 - y0).toBeCloseTo(SPIRAL_RISE, 9);
  });

  it('shows two octaves on desktop and one on phones', () => {
    expect(spiralOctaves(false)).toBe(2);
    expect(spiralOctaves(true)).toBe(1);
  });
});

const pick = (system: Pick['system'], cents: number, spelling = 'X'): Pick => ({
  system,
  note: { pitchClass: 0, octave: 4 },
  spelling,
  cents,
});

describe('pickNote: one note, then a second for the interval', () => {
  const c = pick('12-edo', 0, 'C');
  const e = pick('12-edo', 400, 'E');
  const g = pick('12-edo', 700, 'G');

  it('the first click picks a note, the second makes an interval', () => {
    expect(pickNote([], c)).toEqual([c]);
    expect(pickNote([c], e)).toEqual([c, e]);
  });

  it('a third click starts again from that note', () => {
    expect(pickNote([c, e], g)).toEqual([g]);
  });

  it('clicking the same note again keeps it on its own', () => {
    expect(pickNote([c], { ...c })).toEqual([c]);
  });
});

describe('intervalOf: two picked notes against their pure interval', () => {
  it('a 12-EDO major third is 13.686¢ wider than pure 5/4', () => {
    const interval = intervalOf(pick('12-edo', 400), pick('12-edo', 0));
    expect(interval.size).toBeCloseTo(400, 9);
    expect(interval.pure).toEqual({ num: 5, den: 4 });
    expect(interval.target).toBeCloseTo(386.314, 3);
    expect(interval.offPure).toBeCloseTo(13.686, 3);
    expect(interval.low.cents).toBe(0);
  });

  it('a meantone major third is pure, and the target sits on its upper note', () => {
    const interval = intervalOf(pick('meantone', 0), pick('meantone', 386.3137));
    expect(interval.offPure).toBeCloseTo(0, 3);
    expect(interval.target).toBeCloseTo(386.314, 3);
  });

  it('measures from the lower note, across octaves: E4 up to G5 aims at 12/5', () => {
    const interval = intervalOf(pick('just', 1901.955), pick('just', 386.314));
    expect(interval.pure).toEqual({ num: 12, den: 5 });
    expect(interval.target).toBeCloseTo(386.314 + 1515.641, 3);
  });
});

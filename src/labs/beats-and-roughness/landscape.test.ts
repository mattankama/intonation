import { describe, expect, it } from 'vitest';
import {
  LANDSCAPE_HEIGHT,
  bottomFrequency,
  chordAt,
  landscapePins,
  landscapePoints,
  readBottom,
  readShowEdo12,
  scenePoint,
  writeBottom,
  writeShowEdo12,
} from './landscape';

const params = (query: string) => new URLSearchParams(query);

describe('the roughness landscape’s bottom note (decision #15: C3 / C4 / C5, default C4)', () => {
  it('is C4 unless the URL picks C3 or C5', () => {
    expect(readBottom(params(''))).toBe('C4');
    expect(readBottom(params('bottom=C3'))).toBe('C3');
    expect(readBottom(params('bottom=C5'))).toBe('C5');
    for (const bad of ['bottom=', 'bottom=C6', 'bottom=c3', 'bottom=A4']) expect(readBottom(params(bad))).toBe('C4');
  });

  it('is written to the URL unless it is C4, keeping other parameters', () => {
    expect(writeBottom(params('gap=4'), 'C3').toString()).toBe('gap=4&bottom=C3');
    expect(writeBottom(params('gap=4&bottom=C3'), 'C4').toString()).toBe('gap=4');
  });

  it('is a 12-EDO C computed from the Reference pitch', () => {
    expect(bottomFrequency('C4', 440)).toBeCloseTo(261.6256, 4);
    expect(bottomFrequency('C3', 440)).toBeCloseTo(130.8128, 4);
    expect(bottomFrequency('C5', 440)).toBeCloseTo(523.2511, 4);
    expect(bottomFrequency('C4', 415)).toBeCloseTo(246.7605, 3);
  });
});

describe('“Show 12-EDO versions”, in the URL (?edo12=1)', () => {
  it('is off by default and round-trips', () => {
    expect(readShowEdo12(params(''))).toBe(false);
    expect(readShowEdo12(params('edo12=1'))).toBe(true);
    expect(readShowEdo12(params('edo12=yes'))).toBe(false);
    expect(writeShowEdo12(params('bottom=C3'), true).toString()).toBe('bottom=C3&edo12=1');
    expect(writeShowEdo12(params('bottom=C3&edo12=1'), false).toString()).toBe('bottom=C3');
  });
});

describe('the pinned chords: the 9 chord types in root position at pure tuning', () => {
  const pins = landscapePins();
  const pin = (type: string) => pins.find((p) => p.type === type)!;

  it('pins all nine types, triads as they are', () => {
    expect(pins.map((p) => p.type)).toEqual([
      'major',
      'minor',
      'diminished',
      'augmented',
      'dominant-7th',
      'major-7th',
      'minor-7th',
      'sus2',
      'sus4',
    ]);
    expect(pin('major')).toMatchObject({ proportion: [4, 5, 6], withoutFifth: false });
    expect(pin('major').pure.lower).toBeCloseTo(386.314, 3);
    expect(pin('major').pure.upper).toBeCloseTo(315.641, 3);
    expect(pin('minor').proportion).toEqual([10, 12, 15]);
    expect(pin('diminished').proportion).toEqual([25, 30, 36]);
    expect(pin('augmented').proportion).toEqual([16, 20, 25]);
    expect(pin('sus2').pure.lower).toBeCloseTo(203.91, 3);
    expect(pin('sus2').pure.upper).toBeCloseTo(498.045, 3);
    expect(pin('sus4').proportion).toEqual([6, 8, 9]);
  });

  it('pins the 7th chords as three notes, leaving out the fifth', () => {
    expect(pin('dominant-7th')).toMatchObject({ proportion: [20, 25, 36], withoutFifth: true });
    expect(pin('dominant-7th').pure.upper).toBeCloseTo(631.283, 3);
    expect(pin('major-7th').proportion).toEqual([8, 10, 15]);
    expect(pin('major-7th').pure.upper).toBeCloseTo(701.955, 3);
    expect(pin('minor-7th').proportion).toEqual([5, 6, 9]);
  });

  it('gives each its 12-EDO version', () => {
    expect(pin('major').edo12.lower).toBeCloseTo(400, 6);
    expect(pin('major').edo12.upper).toBeCloseTo(300, 6);
    expect(pin('dominant-7th').edo12.upper).toBeCloseTo(600, 6);
    expect(pin('sus4').edo12.lower).toBeCloseTo(500, 6);
  });
});

describe('placing chords in the scene', () => {
  it('maps lower → x and upper → depth (towards the viewer) over a 6-unit square, roughness → height', () => {
    expect(scenePoint(0, 0, 0)).toEqual([-3, 0, -3]);
    expect(scenePoint(1200, 1200, 1)).toEqual([3, LANDSCAPE_HEIGHT, 3]);
    expect(scenePoint(600, 300, 0.5)).toEqual([0, LANDSCAPE_HEIGHT / 2, -1.5]);
  });

  it('reads a clicked point back as the chord there, in whole cents within 0–1200', () => {
    expect(chordAt(0, -1.5)).toEqual({ lower: 600, upper: 300 });
    expect(chordAt(-0.0123, -1.5)).toEqual({ lower: 598, upper: 300 });
    expect(chordAt(-9, -9)).toEqual({ lower: 0, upper: 0 });
  });
});

describe('grid size (decision #17)', () => {
  it('is ~200×200 on desktop and ~60×60 on phones, with whole-cent steps', () => {
    expect(landscapePoints(false)).toBe(201);
    expect(landscapePoints(true)).toBe(61);
  });
});

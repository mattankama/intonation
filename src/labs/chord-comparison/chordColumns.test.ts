import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../state/settings';
import { readChordState } from './chordState';
import { chordColumns } from './useChordComparison';

const columnsFor = (query: string, settings = DEFAULT_SETTINGS) =>
  chordColumns(readChordState(new URLSearchParams(query)), settings);

/**
 * Decision #7: the pure chord is built on the root frequency the tuning system produces.
 * The pure chord you hear must be the one the numbers measure against.
 */
describe('the pure chord column is built on the first compared system’s root', () => {
  it('12-EDO first: C major on C4 = 261.63 Hz, so its pure E is 327.03 Hz', () => {
    const { pure } = columnsFor('');
    expect(pure.anchor.system).toBe('12-edo');
    expect(pure.frequencies[0]).toBeCloseTo(261.63, 2);
    expect(pure.frequencies[1]).toBeCloseTo(327.03, 2);
  });

  it('meantone first: on meantone’s C4 (263.18 Hz, A4 = 440), not 12-EDO’s', () => {
    const { pure } = columnsFor('compare=meantone.12-edo');
    expect(pure.anchor.system).toBe('meantone');
    expect(pure.frequencies[0]).toBeCloseTo(263.18, 2);
    expect(pure.frequencies[1]).toBeCloseTo(328.98, 2);
  });

  it('is exactly the target the first column’s cents off pure are measured from', () => {
    const { pure, systems } = columnsFor('compare=werckmeister-iii.just&root=E-flat&chord=minor-7th&inv=2');
    expect(pure.frequencies).toEqual(systems[0]!.tuned.notes.map((n) => n.pureFrequency));
  });

  it('every column carries its own pure chord, on its own root', () => {
    const { systems } = columnsFor('compare=12-edo.meantone');
    const [edo, meantone] = systems;
    expect(edo!.pureFrequencies[0]).toBeCloseTo(261.63, 2);
    expect(meantone!.pureFrequencies[0]).toBeCloseTo(263.18, 2);
  });
});

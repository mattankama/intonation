import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../state/settings';
import { comparedSystems, readChordState, writeChordState } from './chordState';

const read = (query: string) => readChordState(new URLSearchParams(query));

describe('Chord comparison state in the URL', () => {
  it('defaults to C major in root position against its 5-limit pure chord', () => {
    expect(read('').chord).toEqual({ root: 0, type: 'major', inversion: 0, pure: '5-limit' });
    expect(read('').systems).toBeNull();
  });

  it('restores a Root, type, inversion and alternative pure chord', () => {
    expect(read('root=A-flat&chord=dominant-7th&inv=3&pure=alternative').chord).toEqual({
      root: 8,
      type: 'dominant-7th',
      inversion: 3,
      pure: 'alternative',
    });
    expect(read('root=F-sharp').chord.root).toBe(6);
    expect(read('root=D-flat').chord.root).toBe(1);
  });

  it('falls back to the default for invalid values', () => {
    expect(read('root=H&chord=power&inv=-1&pure=septimal').chord).toEqual(read('').chord);
    // A triad has no third inversion; only the dominant 7th and diminished have an alternative.
    expect(read('chord=minor&inv=3').chord.inversion).toBe(0);
    expect(read('chord=major&pure=alternative').chord.pure).toBe('5-limit');
  });

  it('restores up to four tuning systems, dropping unknown and repeated ones', () => {
    expect(read('compare=meantone.31-edo').systems).toEqual(['meantone', '31-edo']);
    expect(read('compare=meantone.bogus.meantone.4-edo.just').systems).toEqual(['meantone', 'just']);
    expect(read('compare=12-edo.pythagorean.just.meantone.vallotti').systems).toHaveLength(4);
    expect(read('compare=bogus').systems).toBeNull();
  });

  it('writes non-default values, leaves defaults out, and keeps the shared settings', () => {
    const params = writeChordState(new URLSearchParams('tuning=meantone'), {
      chord: { root: 6, type: 'minor-7th', inversion: 1, pure: '5-limit' },
      systems: ['vallotti', '19-edo'],
    });
    expect(params.toString()).toBe('tuning=meantone&root=F-sharp&chord=minor-7th&inv=1&compare=vallotti.19-edo');
    expect(writeChordState(params, read('')).toString()).toBe('tuning=meantone');
  });

  it('round-trips', () => {
    const state = read('root=B-flat&chord=diminished&inv=2&pure=alternative&compare=just.53-edo');
    expect(read(writeChordState(new URLSearchParams(), state).toString())).toEqual(state);
  });
});

describe('the tuning systems compared', () => {
  it('start from the shared tuning system, then 12-EDO, meantone and 5-limit just intonation', () => {
    expect(comparedSystems(null, DEFAULT_SETTINGS)).toEqual(['12-edo', 'meantone', 'just']);
    expect(comparedSystems(null, { ...DEFAULT_SETTINGS, tuningSystem: 'vallotti' })).toEqual([
      'vallotti',
      '12-edo',
      'meantone',
      'just',
    ]);
    expect(comparedSystems(null, { ...DEFAULT_SETTINGS, tuningSystem: 'meantone' })).toEqual([
      'meantone',
      '12-edo',
      'just',
    ]);
  });

  it('are the chosen ones once chosen', () => {
    expect(comparedSystems(['31-edo'], DEFAULT_SETTINGS)).toEqual(['31-edo']);
  });
});

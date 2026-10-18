import { describe, expect, it } from 'vitest';
import { DEFAULT_SYSTEMS, readSystems, writeSystems } from './systems';

const read = (query: string) => readSystems(new URLSearchParams(query));

describe('the compared tuning systems in the URL (?systems=)', () => {
  it('defaults to 12-EDO, meantone, Pythagorean and 5-limit just intonation', () => {
    expect(read('')).toEqual(['12-edo', 'meantone', 'pythagorean', 'just']);
    expect(DEFAULT_SYSTEMS).toEqual(read(''));
  });

  it('reads up to four systems in order, N-EDOs included', () => {
    expect(read('systems=31-edo,vallotti')).toEqual(['31-edo', 'vallotti']);
  });

  it('drops invalid and repeated systems, and anything past the fourth', () => {
    expect(read('systems=bogus,just,just,99-edo,12-edo,meantone,vallotti,pythagorean')).toEqual([
      'just',
      '12-edo',
      'meantone',
      'vallotti',
    ]);
  });

  it('falls back to the default when nothing valid is left', () => {
    expect(read('systems=bogus')).toEqual(DEFAULT_SYSTEMS);
    expect(read('systems=')).toEqual(DEFAULT_SYSTEMS);
  });

  it('writes the systems, leaves the default out, and keeps other parameters', () => {
    const params = new URLSearchParams('tuning=meantone');
    expect(writeSystems(params, ['53-edo', 'just']).toString()).toBe(
      'tuning=meantone&systems=53-edo%2Cjust',
    );
    expect(writeSystems(new URLSearchParams('systems=just'), DEFAULT_SYSTEMS).toString()).toBe('');
  });

  it('round-trips', () => {
    const systems = ['kirnberger-iii', '19-edo', 'werckmeister-iii'] as const;
    expect(readSystems(writeSystems(new URLSearchParams(), systems))).toEqual(systems);
  });
});

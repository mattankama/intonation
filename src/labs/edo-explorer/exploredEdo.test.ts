import { describe, expect, it } from 'vitest';
import { defaultEdo, readExploredEdo, writeExploredEdo } from './exploredEdo';

const read = (query: string, shared: Parameters<typeof readExploredEdo>[1]) =>
  readExploredEdo(new URLSearchParams(query), shared);
const write = (query: string, n: number, shared: Parameters<typeof writeExploredEdo>[2]) =>
  writeExploredEdo(new URLSearchParams(query), n, shared).toString();

describe('the EDO explorer’s own N (?n=), apart from the shared tuning system', () => {
  it('defaults to the shared system’s N when it is an EDO, else 12', () => {
    expect(defaultEdo('31-edo')).toBe(31);
    expect(defaultEdo('12-edo')).toBe(12);
    expect(defaultEdo('meantone')).toBe(12);
    expect(read('', 'meantone')).toBe(12);
    expect(read('tuning=19-edo', '19-edo')).toBe(19);
  });

  it('reads any N from 5 to 72, whatever the shared system', () => {
    expect(read('n=5', '12-edo')).toBe(5);
    expect(read('n=53', 'meantone')).toBe(53);
    expect(read('n=72', '31-edo')).toBe(72);
  });

  it('falls back to the default for an N that is missing, out of range or not whole', () => {
    for (const bad of ['4', '73', '0', '-12', '31.5', 'x', '', '1e1']) {
      expect(read(`n=${bad}`, '31-edo'), bad).toBe(31);
      expect(read(`n=${bad}`, 'just'), bad).toBe(12);
    }
  });

  it('writes N unless it is the default, keeping the shared settings', () => {
    expect(write('tuning=meantone', 22, 'meantone')).toBe('tuning=meantone&n=22');
    expect(write('tuning=meantone&n=22', 12, 'meantone')).toBe('tuning=meantone');
    expect(write('tuning=31-edo&n=22', 31, '31-edo')).toBe('tuning=31-edo');
  });
});

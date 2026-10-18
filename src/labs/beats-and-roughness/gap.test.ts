import { describe, expect, it } from 'vitest';
import { readGap, writeGap } from './gap';

const params = (query: string) => new URLSearchParams(query);

describe('the gap between the two tones, in the URL (?gap=…, Hz)', () => {
  it('is 3 Hz when the URL has none', () => {
    expect(readGap(params(''))).toBe(3);
  });

  it('reads any value from 0 to 30 Hz in steps of 0.1 Hz', () => {
    expect(readGap(params('gap=0'))).toBe(0);
    expect(readGap(params('gap=4.5'))).toBe(4.5);
    expect(readGap(params('gap=30'))).toBe(30);
    expect(readGap(params('gap=2.34'))).toBe(2.3);
  });

  it('falls back to 3 Hz for anything else', () => {
    for (const bad of ['gap=', 'gap=fast', 'gap=-1', 'gap=30.5', 'gap=Infinity']) {
      expect(readGap(params(bad))).toBe(3);
    }
  });

  it('is written to the URL unless it is the default, keeping other parameters', () => {
    expect(writeGap(params('tuning=31-edo'), 4.5).toString()).toBe('tuning=31-edo&gap=4.5');
    expect(writeGap(params('tuning=31-edo&gap=4.5'), 3).toString()).toBe('tuning=31-edo');
    expect(writeGap(params(''), 0).toString()).toBe('gap=0');
  });

  it('round-trips', () => {
    expect(readGap(writeGap(params(''), 12.7))).toBe(12.7);
  });
});

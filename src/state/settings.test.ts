import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, readSettings, writeSettings } from './settings';

const read = (query: string) => readSettings(new URLSearchParams(query));

describe('Reference pitch in the URL', () => {
  it('defaults to 440 Hz when absent', () => {
    expect(read('').referencePitch).toBe(440);
    expect(DEFAULT_SETTINGS.referencePitch).toBe(440);
  });

  it('restores each preset', () => {
    for (const hz of [415, 432, 440, 442]) expect(read(`ref=${hz}`).referencePitch).toBe(hz);
  });

  it('restores a custom value', () => {
    expect(read('ref=437.5').referencePitch).toBe(437.5);
  });

  it('falls back to 440 Hz for invalid values', () => {
    for (const bad of ['abc', '', '0', '-440', '99999', 'Infinity', 'NaN', '440hz', '1e3']) {
      expect(read(`ref=${bad}`).referencePitch).toBe(440);
    }
  });

  it('writes non-default values and leaves the default out', () => {
    expect(
      writeSettings(new URLSearchParams(), { ...DEFAULT_SETTINGS, referencePitch: 415 }).toString(),
    ).toBe('ref=415');
    expect(writeSettings(new URLSearchParams('ref=415'), DEFAULT_SETTINGS).toString()).toBe('');
  });

  it('keeps unrelated parameters (a Lab’s own state) when writing', () => {
    const params = writeSettings(new URLSearchParams('n=31'), {
      ...DEFAULT_SETTINGS,
      referencePitch: 442,
    });
    expect(params.get('n')).toBe('31');
    expect(params.get('ref')).toBe('442');
  });

  it('round-trips through the URL', () => {
    const settings = { ...DEFAULT_SETTINGS, referencePitch: 438.25 };
    expect(readSettings(writeSettings(new URLSearchParams(), settings))).toEqual(settings);
  });
});

describe('tuning system in the URL', () => {
  it('defaults to 12-EDO', () => {
    expect(read('').tuningSystem).toBe('12-edo');
  });

  it('restores each 12-note tuning system', () => {
    for (const id of [
      '12-edo',
      'pythagorean',
      'just',
      'meantone',
      'werckmeister-iii',
      'vallotti',
      'kirnberger-iii',
    ]) {
      expect(read(`tuning=${id}`).tuningSystem).toBe(id);
    }
  });

  it('falls back to 12-EDO for unknown values', () => {
    for (const bad of ['', 'Meantone', 'werckmeister', 'equal', '19-edo']) {
      expect(read(`tuning=${bad}`).tuningSystem).toBe('12-edo');
    }
  });
});

describe('Tonic in the URL', () => {
  it('defaults to C', () => {
    expect(read('').tonic).toBe(0);
  });

  it('restores a Tonic by its name, with "-flat" and "-sharp" for ♭ and ♯', () => {
    expect(read('tonic=D').tonic).toBe(2);
    expect(read('tonic=D-flat').tonic).toBe(1);
    expect(read('tonic=F-sharp').tonic).toBe(6);
    expect(read('tonic=B-flat').tonic).toBe(10);
  });

  it('falls back to C for anything else', () => {
    for (const bad of ['', 'H', 'C#', 'd', 'C-sharp', '3']) expect(read(`tonic=${bad}`).tonic).toBe(0);
  });

  it('writes the tuning system and Tonic, leaving defaults out', () => {
    const settings = { ...DEFAULT_SETTINGS, tuningSystem: 'meantone', tonic: 3 } as const;
    expect(writeSettings(new URLSearchParams(), settings).toString()).toBe(
      'tuning=meantone&tonic=E-flat',
    );
    expect(readSettings(writeSettings(new URLSearchParams(), settings))).toEqual(settings);
  });
});

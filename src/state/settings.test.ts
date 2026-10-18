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
    expect(writeSettings(new URLSearchParams(), { ...DEFAULT_SETTINGS, referencePitch: 415 }).toString()).toBe(
      'ref=415',
    );
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

describe('Timbre in the URL', () => {
  it('defaults to Sine when absent', () => {
    expect(read('').timbre).toBe('sine');
  });

  it('restores each preset', () => {
    for (const id of ['sine', 'organ', 'string', 'brass', 'voice']) {
      expect(read(`timbre=${id}`).timbre).toBe(id);
    }
  });

  it('falls back to Sine for unknown values', () => {
    for (const bad of ['', 'piano', 'Organ', 'custom']) expect(read(`timbre=${bad}`).timbre).toBe('sine');
  });

  it('writes a non-default preset and leaves Sine out', () => {
    expect(writeSettings(new URLSearchParams(), { ...DEFAULT_SETTINGS, timbre: 'brass' }).toString()).toBe(
      'timbre=brass',
    );
    expect(writeSettings(new URLSearchParams('timbre=brass'), DEFAULT_SETTINGS).toString()).toBe('');
  });
});

describe('Brightness in the URL', () => {
  it('defaults to 0 (the recipe as drawn)', () => {
    expect(read('').brightness).toBe(0);
  });

  it('restores values from −1 to +1 in steps of 0.1', () => {
    expect(read('bright=0.3').brightness).toBe(0.3);
    expect(read('bright=-1').brightness).toBe(-1);
    expect(read('bright=1').brightness).toBe(1);
    expect(read('bright=-0.7').brightness).toBe(-0.7);
  });

  it('rounds to the nearest step', () => {
    expect(read('bright=0.34').brightness).toBe(0.3);
  });

  it('falls back to 0 outside the range or when invalid', () => {
    for (const bad of ['1.5', '-2', 'abc', '', 'NaN', '1e-1', '+0.5']) {
      expect(read(`bright=${bad}`).brightness).toBe(0);
    }
  });

  it('round-trips through the URL', () => {
    const settings = { ...DEFAULT_SETTINGS, timbre: 'string' as const, brightness: -0.4 };
    const params = writeSettings(new URLSearchParams(), settings);
    expect(params.toString()).toBe('timbre=string&bright=-0.4');
    expect(readSettings(params)).toEqual(settings);
  });
});

describe('Volume in the URL', () => {
  it('defaults to 80 %', () => {
    expect(read('').volume).toBe(80);
  });

  it('restores whole percentages from 0 to 100', () => {
    expect(read('vol=0').volume).toBe(0);
    expect(read('vol=35').volume).toBe(35);
    expect(read('vol=100').volume).toBe(100);
  });

  it('falls back to 80 % when invalid', () => {
    for (const bad of ['101', '-5', '50.5', 'loud', '']) expect(read(`vol=${bad}`).volume).toBe(80);
  });

  it('round-trips through the URL', () => {
    const settings = { ...DEFAULT_SETTINGS, volume: 45 };
    expect(writeSettings(new URLSearchParams(), settings).toString()).toBe('vol=45');
    expect(readSettings(writeSettings(new URLSearchParams(), settings))).toEqual(settings);
  });
});

describe('Custom Timbre in the URL (decision: Custom Timbre, issue #10)', () => {
  // Organ-like as levels 100 80 60 50 0 40 0 30 0…, two hex digits each; harmonic 2 muted.
  const ORGAN_LEVELS = '64503c320028001e0000000000000000';
  const organCustom = {
    from: 'organ' as const,
    levels: [100, 80, 60, 50, 0, 40, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0],
    muted: [false, true, ...Array<boolean>(14).fill(false)],
  };

  it('restores levels in 1 % steps, mutes kept separately, and the preset it came from', () => {
    expect(read(`timbre=custom.organ.${ORGAN_LEVELS}.0002`).timbre).toEqual(organCustom);
  });

  it('reads the mute bits as harmonics 1–16, lowest bit first', () => {
    const { timbre } = read('timbre=custom.sine.64000000000000000000000000000000.8001');
    expect(timbre).toMatchObject({ muted: [true, ...Array<boolean>(14).fill(false), true] });
  });

  it('writes the Custom Timbre in about 35 characters plus its preset', () => {
    const settings = { ...DEFAULT_SETTINGS, timbre: organCustom };
    expect(writeSettings(new URLSearchParams(), settings).toString()).toBe(
      `timbre=custom.organ.${ORGAN_LEVELS}.0002`,
    );
  });

  it('round-trips through the URL', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      brightness: 0.5,
      timbre: {
        from: 'voice' as const,
        levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99, 100, 37],
        muted: [true, false, true, ...Array<boolean>(11).fill(false), true, true],
      },
    };
    expect(readSettings(writeSettings(new URLSearchParams(), settings))).toEqual(settings);
  });

  it('falls back to Sine when the Custom Timbre is malformed', () => {
    for (const bad of [
      'custom',
      `custom.piano.${ORGAN_LEVELS}.0000`,
      `custom.organ.${ORGAN_LEVELS}`,
      `custom.organ.${ORGAN_LEVELS.slice(2)}.0000`,
      `custom.organ.65${ORGAN_LEVELS.slice(2)}.0000`, // 101 %
      `custom.organ.${ORGAN_LEVELS}.00000`,
      `custom.organ.${ORGAN_LEVELS.toUpperCase()}.0000`,
      `custom.organ.${ORGAN_LEVELS}.zzzz`,
    ]) {
      expect(read(`timbre=${bad}`).timbre, bad).toBe('sine');
    }
  });
});

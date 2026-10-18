import { describe, expect, it } from 'vitest';
import {
  customHarmonics,
  customTimbreFrom,
  editHarmonic,
  timbreHarmonics,
  waveValue,
} from './index';

const NONE_MUTED = Array<boolean>(16).fill(false);

describe('Custom Timbre (decision: Custom Timbre, issue #10)', () => {
  it('starts from a preset as whole percentages of its strongest harmonic', () => {
    const custom = customTimbreFrom('organ', 0);
    expect(custom.from).toBe('organ');
    expect(custom.levels).toEqual([100, 80, 60, 50, 0, 40, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(custom.muted).toEqual(NONE_MUTED);
  });

  it('rounds the recipe to 1 % steps', () => {
    // Brass-like: 0.8, 1, 0.7, 0.5, 0.35, 0.22, … (issue #14); peak at harmonic 2.
    expect(customTimbreFrom('brass', 0).levels).toEqual([
      80, 100, 70, 50, 35, 22, 14, 9, 5, 3, 2, 1, 0, 0, 0, 0,
    ]);
  });

  it('takes the preset as heard, brightness included, rescaled so the strongest is 100 %', () => {
    // Organ at b = +1: aₙ·n = 1, 1.6, 1.8, 2, 0, 2.4, 0, 2.4 → ÷ 2.4.
    expect(customTimbreFrom('organ', 1).levels).toEqual([
      42, 67, 75, 83, 0, 100, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it('plays each level as an amplitude, with muted harmonics silent', () => {
    const muted = [...NONE_MUTED];
    muted[1] = true;
    const h = customHarmonics({
      from: 'organ',
      levels: [100, 80, 60, 50, 0, 40, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0],
      muted,
    });
    expect(h).toEqual([1, 0, 0.6, 0.5, 0, 0.4, 0, 0.3, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('resolves the shared Timbre setting to harmonics', () => {
    expect(timbreHarmonics('brass', 0)).toEqual([
      0.8, 1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.09, 0.05, 0.03, 0.02, 0.01, 0, 0, 0, 0,
    ]);
    // Brightness is not applied to a Custom Timbre: the sliders already define it.
    const custom = {
      from: 'sine' as const,
      levels: [50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      muted: NONE_MUTED,
    };
    expect(timbreHarmonics(custom, 1)).toEqual([0.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('Editing a harmonic', () => {
  it('turns a preset into a Custom Timbre made from it', () => {
    expect(editHarmonic('organ', 0, 3, { level: 20 })).toEqual({
      from: 'organ',
      levels: [100, 80, 20, 50, 0, 40, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0],
      muted: NONE_MUTED,
    });
  });

  it('changes the existing Custom Timbre, keeping the preset it came from', () => {
    const custom = editHarmonic('sine', 0, 2, { level: 50 });
    const muted = editHarmonic(custom, 0, 2, { muted: true });
    expect(muted).toEqual({
      from: 'sine',
      levels: [100, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      muted: [false, true, ...Array<boolean>(14).fill(false)],
    });
    expect(editHarmonic(muted, 0, 2, { muted: false }).levels[1]).toBe(50);
  });
});

describe('The waveform Σ aₙ·sin(nθ)', () => {
  it('is a plain sine for the fundamental alone', () => {
    expect(waveValue([1], Math.PI / 2)).toBeCloseTo(1, 12);
    expect(waveValue([1], Math.PI / 6)).toBeCloseTo(0.5, 12);
  });

  it('adds the harmonics in sine phase', () => {
    // sin(π/2) + 0.5·sin(π) + 0.25·sin(3π/2) = 1 + 0 − 0.25
    expect(waveValue([1, 0.5, 0.25], Math.PI / 2)).toBeCloseTo(0.75, 12);
  });
});

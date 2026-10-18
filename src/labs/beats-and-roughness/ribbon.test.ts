import { describe, expect, it } from 'vitest';
import { presetHarmonics } from '../../core';
import { advancePhase, beatPeaks, ribbonCurves, ribbonSeconds } from './ribbon';

const sine = presetHarmonics('sine');

/** The largest |value| among samples within `radius` seconds of time t. */
function loudestNear(curves: ReturnType<typeof ribbonCurves>, values: readonly number[], t: number, radius = 0.03) {
  let loudest = 0;
  curves.times.forEach((time, i) => {
    if (Math.abs(time - t) <= radius) loudest = Math.max(loudest, Math.abs(values[i]!));
  });
  return loudest;
}

describe('the interference ribbon', () => {
  it('shows the last second on desktop and a shorter half second on phones', () => {
    expect(ribbonSeconds(false)).toBe(1);
    expect(ribbonSeconds(true)).toBe(0.5);
    const curves = ribbonCurves(sine, 3, 0, 1);
    expect(curves.times[0]).toBeCloseTo(-1, 12);
    expect(curves.times.at(-1)).toBeCloseTo(0, 12);
  });

  it('a 2 Hz gap swells to full at 0, ½ and 1 s ago and dies away at ¼ and ¾ s ago', () => {
    const curves = ribbonCurves(sine, 2, 0, 1);
    for (const t of [0, -0.5, -1]) expect(loudestNear(curves, curves.sum, t)).toBeGreaterThan(0.95);
    for (const t of [-0.25, -0.75]) expect(loudestNear(curves, curves.sum, t)).toBeLessThan(0.2);
  });

  it('a quarter second of sound at 2 Hz moves the swells a quarter second to the left', () => {
    const phase = advancePhase(0, 2, 0.25);
    expect(phase).toBeCloseTo(0.5, 12);
    const curves = ribbonCurves(sine, 2, phase, 1);
    for (const t of [-0.25, -0.75]) expect(loudestNear(curves, curves.sum, t)).toBeGreaterThan(0.95);
    for (const t of [0, -0.5, -1]) expect(loudestNear(curves, curves.sum, t)).toBeLessThan(0.2);
  });

  it('the phase counts whole cycles away', () => {
    expect(advancePhase(0.75, 3, 0.5)).toBeCloseTo(0.25, 12);
    expect(advancePhase(0.4, 0, 10)).toBeCloseTo(0.4, 12);
  });

  it('marks every swell in the window: 3 for a 3 Hz gap with one more at the left edge', () => {
    const marks = beatPeaks(3, 0, 1);
    expect(marks).toHaveLength(4);
    [-1, -2 / 3, -1 / 3, 0].forEach((t, i) => expect(marks[i]).toBeCloseTo(t, 12));
    const shifted = beatPeaks(2, 0.5, 1);
    expect(shifted).toHaveLength(2);
    [-0.75, -0.25].forEach((t, i) => expect(shifted[i]).toBeCloseTo(t, 12));
  });

  it('marks no swells when the tones are in unison', () => {
    expect(beatPeaks(0, 0, 1)).toEqual([]);
  });

  it('at a swell the tones are in step whatever the Timbre', () => {
    const organ = presetHarmonics('organ', 0);
    const curves = ribbonCurves(organ, 2, 0, 1);
    curves.times.forEach((t, i) => {
      if (Math.abs(t + 0.5) < 0.002) expect(curves.tone2[i]).toBeCloseTo(curves.tone1[i]!, 1);
    });
  });

  it('each tone keeps its full height while the sum swells and fades', () => {
    const curves = ribbonCurves(sine, 2, 0, 1);
    for (const t of [-0.25, -0.5]) {
      expect(loudestNear(curves, curves.tone1, t)).toBeGreaterThan(0.95);
      expect(loudestNear(curves, curves.tone2, t)).toBeGreaterThan(0.95);
    }
  });
});

/**
 * The interference ribbon's pure geometry (issue #28): the two tones and their sum over
 * the last few moments, with time running from −seconds (left) to 0, now (right).
 *
 * Real tones vibrate hundreds of times a second, far too fast to draw, so the ribbon draws
 * each wave SLOWED DOWN: tone 1 at a display carrier of a few dozen cycles a second, and
 * tone 2 exactly `gap` Hz above it. Their difference, and so the beats, keep their real
 * timing: a 3 Hz gap swells three times across the one-second window.
 *
 * `phase` is how far tone 2 has slipped ahead of tone 1 by now, in cycles. Both tones
 * start in step, so the phase starts at 0 and grows by `gap` every second while they sound
 * (advancePhase); the sum swells wherever gap·t + phase is a whole number.
 */
import { type Harmonics, wavePeak, waveValue } from '../../core';

/** Seconds of time across the ribbon: the last second, or a shorter half second on phones. */
export const ribbonSeconds = (phone: boolean) => (phone ? 0.5 : 1);

/** Tone 1's drawn cycles per second; raised for fast gaps so every beat holds ~6 cycles. */
const displayCarrier = (gap: number) => Math.max(40, 6 * gap);

/** Samples drawn per cycle of the display carrier. */
const SAMPLES_PER_CYCLE = 32;

/** How many samples ribbonCurves draws for a gap and window (to size buffers ahead). */
export const ribbonSampleCount = (gap: number, seconds: number) =>
  Math.ceil(seconds * displayCarrier(gap) * SAMPLES_PER_CYCLE) + 1;

export interface RibbonCurves {
  /** Sample times in seconds, from −seconds to 0. */
  readonly times: readonly number[];
  /** Tone 1, scaled so its peak is 1. */
  readonly tone1: readonly number[];
  /** Tone 2, scaled so its peak is 1. */
  readonly tone2: readonly number[];
  /** Their sum, scaled so it peaks at 1 where the tones are in step. */
  readonly sum: readonly number[];
}

/** The phase after `dt` more seconds of sound: tone 2 gains `gap` cycles a second. Kept in [0, 1). */
export function advancePhase(phase: number, gap: number, dt: number): number {
  const next = (phase + gap * dt) % 1;
  return next < 0 ? next + 1 : next;
}

/** Slack so a swell exactly on the window's edge is kept despite rounding. */
const EDGE = 1e-9;

/** The times in the window (−seconds … 0, oldest first) where the tones are in step and the sum swells. */
export function beatPeaks(gap: number, phase: number, seconds: number): number[] {
  if (gap <= 0) return [];
  // In step where gap·t + phase = n, i.e. t = (n − phase) / gap.
  const first = Math.ceil(phase - gap * seconds - EDGE);
  const times: number[] = [];
  for (let n = first; (n - phase) / gap <= EDGE; n++) times.push((n - phase) / gap);
  return times;
}

const peaks = new WeakMap<Harmonics, number>();
const peakOf = (harmonics: Harmonics) => {
  let peak = peaks.get(harmonics);
  if (peak === undefined) {
    peak = wavePeak(harmonics);
    peaks.set(harmonics, peak);
  }
  return peak;
};

/** Both tones and their sum, sampled across the window. */
export function ribbonCurves(harmonics: Harmonics, gap: number, phase: number, seconds: number): RibbonCurves {
  const carrier = displayCarrier(gap);
  const count = ribbonSampleCount(gap, seconds);
  const peak = peakOf(harmonics);
  const scale = peak > 0 ? 1 / peak : 0;
  const times: number[] = [];
  const tone1: number[] = [];
  const tone2: number[] = [];
  const sum: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = -seconds + (seconds * i) / (count - 1);
    const a = scale * waveValue(harmonics, 2 * Math.PI * carrier * t);
    const b = scale * waveValue(harmonics, 2 * Math.PI * ((carrier + gap) * t + phase));
    times.push(t);
    tone1.push(a);
    tone2.push(b);
    sum.push((a + b) / 2);
  }
  return { times, tone1, tone2, sum };
}

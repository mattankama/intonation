/**
 * Two tones sounding together (Beats & roughness Lab, issue #28): how fast they beat and
 * how far apart they are. Frequencies here are measured values (Hz), not exact ratios.
 */
import { CENTS_PER_OCTAVE } from './cents';

/** Beats per second between two pure tones: the difference of their frequencies. */
export function beatRate(f1: number, f2: number): number {
  return Math.abs(f2 - f1);
}

/** The interval from f1 up to f2 in cents (negative when f2 is lower): 1200 · log₂(f2/f1). */
export function centsBetween(f1: number, f2: number): number {
  return CENTS_PER_OCTAVE * Math.log2(f2 / f1);
}

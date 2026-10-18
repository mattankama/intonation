import { type Ratio, ratioValue } from './ratio';

/** Cents in an octave. */
export const CENTS_PER_OCTAVE = 1200;

/** The size in cents of an interval given as an exact ratio: 1200 · log₂(r). */
export function cents(r: Ratio): number {
  return CENTS_PER_OCTAVE * Math.log2(ratioValue(r));
}

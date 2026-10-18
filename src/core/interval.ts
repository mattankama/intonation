/**
 * Pure intervals (decision #7: 5-limit), for measuring how far any interval is off pure.
 */
import { cents } from './cents';
import { type Ratio, multiplyRatios, ratio, ratioPower } from './ratio';

/** One 5-limit pure interval per 12-EDO size within the octave, then the octave itself. */
const PURE_INTERVALS: readonly Ratio[] = [
  ratio(1, 1),
  ratio(16, 15),
  ratio(9, 8),
  ratio(6, 5),
  ratio(5, 4),
  ratio(4, 3),
  ratio(45, 32),
  ratio(3, 2),
  ratio(8, 5),
  ratio(5, 3),
  ratio(9, 5),
  ratio(15, 8),
  ratio(2, 1),
];

/**
 * The 5-limit pure interval nearest an interval of `size` cents (≥ 0), e.g. 5/4 for a
 * 12-EDO major third (400¢). Beyond the octave it is the same choice raised by octaves.
 */
export function nearestPureInterval(size: number): Ratio {
  const octaves = Math.floor(size / 1200);
  const within = size - 1200 * octaves;
  let best = PURE_INTERVALS[0]!;
  for (const candidate of PURE_INTERVALS) {
    if (Math.abs(cents(candidate) - within) < Math.abs(cents(best) - within)) best = candidate;
  }
  return multiplyRatios(best, ratioPower(ratio(2, 1), octaves));
}

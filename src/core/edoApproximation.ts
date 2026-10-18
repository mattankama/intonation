/**
 * EDO approximation: how close an N-EDO's nearest step comes to each pure interval.
 *
 * This is the note-by-note question about single intervals (decision #8: the EDO
 * explorer keeps marking the nearest step); chords use the EDO mapping instead.
 */
import { CENTS_PER_OCTAVE, cents } from './cents';
import { nearestSteps } from './chord';
import { type Ratio, ratio } from './ratio';
import { EDO_MAX, EDO_MIN } from './tuning';

/** The pure intervals the EDO explorer marks: 3/2, 5/4, 6/5, 7/4 and 11/8. */
export const EDO_TARGETS: readonly Ratio[] = [
  ratio(3, 2),
  ratio(5, 4),
  ratio(6, 5),
  ratio(7, 4),
  ratio(11, 8),
];

/** One pure interval and the N-EDO step nearest it. */
export interface StepApproximation {
  readonly target: Ratio;
  /** The nearest step: round(N · log₂ r). */
  readonly step: number;
  /** That step's size: 1200 · step / N. */
  readonly stepCents: number;
  /** The pure interval's size: 1200 · log₂ r. */
  readonly pureCents: number;
  /** stepCents − pureCents: positive when the step is wide of pure. */
  readonly error: number;
}

/** The step of an N-EDO nearest a pure interval, and how far off it is. */
export function approximate(n: number, target: Ratio): StepApproximation {
  const step = nearestSteps(n, target);
  const stepCents = (CENTS_PER_OCTAVE * step) / n;
  const pureCents = cents(target);
  return { target, step, stepCents, pureCents, error: stepCents - pureCents };
}

/** The nearest step to each of EDO_TARGETS, in that order. */
export const edoApproximations = (n: number): readonly StepApproximation[] =>
  EDO_TARGETS.map((target) => approximate(n, target));

/**
 * The intervals the error chart measures: the 5-limit ones (3/2, 5/4, 6/5), on which
 * 12, 19, 31 and 53 stand out. 7/4 and 11/8 would bury 12-EDO, whose 7th and 11th are poor.
 */
export const CHART_TARGETS: readonly Ratio[] = EDO_TARGETS.slice(0, 3);

/** One N on the error chart, with the chart's interval it gets furthest from pure. */
export interface ChartPoint {
  readonly n: number;
  readonly worst: StepApproximation;
}

/** Every N from EDO_MIN to EDO_MAX by its largest error among CHART_TARGETS. */
export function edoErrorChart(): readonly ChartPoint[] {
  return Array.from({ length: EDO_MAX - EDO_MIN + 1 }, (_, i) => {
    const n = EDO_MIN + i;
    const worst = CHART_TARGETS.map((target) => approximate(n, target)).reduce((a, b) =>
      Math.abs(b.error) > Math.abs(a.error) ? b : a,
    );
    return { n, worst };
  });
}

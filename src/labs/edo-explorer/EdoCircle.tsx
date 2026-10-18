import { CENTS_PER_OCTAVE, type StepApproximation, edoSystem } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatRatio, formatSignedCents } from '../../format/numbers';

const text = copy.edoExplorer;

/** SVG user units: the circle's radius, and where marks and their labels sit outside it. */
const R = 102;
const MARK_R = R + 13;
const LABEL_R = R + 27;
/** Step numbers are drawn for every step up to this N; above it only for marked steps. */
const LABEL_ALL_STEPS_UP_TO = 24;

/** A point at `fraction` of a turn clockwise from the top, `radius` from the centre. */
function at(fraction: number, radius: number): { x: number; y: number } {
  const angle = 2 * Math.PI * fraction;
  return { x: radius * Math.sin(angle), y: -radius * Math.cos(angle) };
}

const anchorFor = (x: number) => (x > 4 ? 'start' : x < -4 ? 'end' : 'middle');

/**
 * The octave as a circle of N equal steps (step 0 at the top, clockwise). Each pure
 * interval is an ink ring at its exact angle, joined to its nearest step.
 */
export function EdoCircle({ n, approximations }: { n: number; approximations: readonly StepApproximation[] }) {
  const marked = new Set(approximations.map((a) => ((a.step % n) + n) % n));
  const dense = n > LABEL_ALL_STEPS_UP_TO;
  return (
    <figure className="edo-circle">
      <svg role="img" aria-label={text.circleLabel(n)} viewBox="-192 -148 384 296" className="edo-circle-svg">
        <circle className="edo-ring" r={R} />
        {Array.from({ length: n }, (_, k) => {
          const dot = at(k / n, R);
          const label = at(k / n, R - 13);
          const isMarked = marked.has(k);
          return (
            <g key={k}>
              <circle
                className="edo-step"
                data-marked={isMarked || undefined}
                cx={dot.x}
                cy={dot.y}
                r={isMarked ? 3.6 : dense ? 1.6 : 2.4}
              />
              {(!dense || isMarked || k === 0) && (
                <text className="edo-step-number" x={label.x} y={label.y} data-marked={isMarked || undefined}>
                  {k}
                </text>
              )}
            </g>
          );
        })}
        {approximations.map((a) => {
          const pure = at(a.pureCents / 1200, MARK_R);
          const step = at(a.step / n, R);
          const label = at(a.pureCents / 1200, LABEL_R);
          return (
            <g key={formatRatio(a.target)}>
              <line className="edo-mark-link" x1={pure.x} y1={pure.y} x2={step.x} y2={step.y} />
              <circle className="edo-mark" cx={pure.x} cy={pure.y} r={4.5} />
              <text className="edo-mark-label" x={label.x} y={label.y} textAnchor={anchorFor(label.x)}>
                {text.markLabel(formatRatio(a.target), formatSignedCents(a.error, 'controls'))}
              </text>
            </g>
          );
        })}
        <text className="edo-circle-title" y={-4}>
          {copy.settings.tuningSystem.name(edoSystem(n))}
        </text>
        <text className="edo-circle-sub" y={14}>
          {text.stepSize(formatCents(CENTS_PER_OCTAVE / n, 'controls'))}
        </text>
      </svg>
      <figcaption className="edo-caption">{text.circleKey}</figcaption>
    </figure>
  );
}

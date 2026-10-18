import { edoErrorChart } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatDecimal, formatRatio } from '../../format/numbers';
import { STANDOUT_EDOS } from './exploredEdo';

const text = copy.edoExplorer;

/** Every N's largest 5-limit error; the same for every visit. */
const CHART = edoErrorChart();

/** SVG user units. */
const WIDTH = 680;
const HEIGHT = 190;
const LEFT = 36;
const TOP = 16;
const BOTTOM = 20;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;
const BAND = (WIDTH - LEFT) / CHART.length;
const GRID_CENTS = 25;
const Y_MAX = Math.ceil(Math.max(...CHART.map((p) => Math.abs(p.worst.error))) / GRID_CENTS) * GRID_CENTS;
/** N values labelled under the axis. */
const AXIS_N = [5, 10, 20, 30, 40, 50, 60, 70];

const xOf = (index: number) => LEFT + index * BAND;
const yOf = (size: number) => TOP + PLOT_HEIGHT * (1 - size / Y_MAX);
const isStandout = (n: number) => (STANDOUT_EDOS as readonly number[]).includes(n);

/**
 * The error chart: one bar per N from 5 to 72, as tall as its largest error among 3/2,
 * 5/4 and 6/5. The standouts 12, 19, 31 and 53 are labelled; clicking a bar explores it.
 */
export function EdoErrorChart({ selected, onSelect }: { selected: number; onSelect: (n: number) => void }) {
  return (
    <figure className="edo-chart">
      <h2 className="edo-chart-heading">{text.chartHeading}</h2>
      <div className="edo-chart-scroll">
      <svg role="img" aria-label={text.chartLabel} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="edo-chart-svg">
        {Array.from({ length: Y_MAX / GRID_CENTS + 1 }, (_, i) => {
          const cents = i * GRID_CENTS;
          return (
            <g key={cents}>
              <line className="edo-grid" x1={LEFT} x2={WIDTH} y1={yOf(cents)} y2={yOf(cents)} />
              <text className="edo-axis-label" x={LEFT - 6} y={yOf(cents)} textAnchor="end">
                {`${formatDecimal(cents, 0)}¢`}
              </text>
            </g>
          );
        })}
        {CHART.map(({ n, worst }, i) => {
          const size = Math.abs(worst.error);
          const standout = isStandout(n);
          const title = text.chartBar(
            n,
            formatCents(size, 'controls'),
            text.targetNames[formatRatio(worst.target)] ?? formatRatio(worst.target),
          );
          return (
            <g key={n}>
              <rect
                className="edo-bar"
                data-n={n}
                data-standout={standout || undefined}
                data-selected={n === selected || undefined}
                x={xOf(i) + 1}
                y={yOf(size)}
                width={BAND - 2}
                height={TOP + PLOT_HEIGHT - yOf(size)}
              />
              {(standout || n === selected) && (
                <text
                  className={standout ? 'edo-standout-label' : 'edo-selected-label'}
                  x={xOf(i) + BAND / 2}
                  y={yOf(size) - 4}
                  textAnchor="middle"
                >
                  {n}
                </text>
              )}
              <rect
                className="edo-bar-hit"
                data-n={n}
                x={xOf(i)}
                y={TOP}
                width={BAND}
                height={PLOT_HEIGHT + BOTTOM}
                onClick={() => onSelect(n)}
              >
                <title>{title}</title>
              </rect>
            </g>
          );
        })}
        {AXIS_N.map((n) => (
          <text
            key={n}
            className="edo-axis-label"
            x={xOf(n - CHART[0]!.n) + BAND / 2}
            y={HEIGHT - 6}
            textAnchor="middle"
          >
            {n}
          </text>
        ))}
      </svg>
      </div>
      <figcaption className="edo-caption">{text.chartCaption}</figcaption>
    </figure>
  );
}

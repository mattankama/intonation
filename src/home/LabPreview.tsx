import type { ReactNode } from 'react';
import type { LabId } from '../labs/ids';
import {
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  type Point,
  chordColumnsPreview,
  edoCirclePreview,
  latticePreview,
  roughnessPreview,
  soundWavesPreview,
  spiralPreview,
} from './previews';

const round = (v: number) => Math.round(v * 100) / 100;
const polyline = (points: readonly Point[]) =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p.x)} ${round(p.y)}`).join(' ');
const segments = (pairs: readonly (readonly [Point, Point])[]) =>
  pairs.map(([a, b]) => `M${round(a.x)} ${round(a.y)}L${round(b.x)} ${round(b.y)}`).join('');

function SoundWaves() {
  const { bars, wave, waveMid } = soundWavesPreview();
  return (
    <>
      {bars.map((b, i) => (
        <rect key={i} className="preview-bar" x={round(b.x)} y={round(b.y)} width={round(b.width)} height={round(b.height)} />
      ))}
      <line className="preview-guide" x1={wave[0]!.x} y1={waveMid} x2={wave[wave.length - 1]!.x} y2={waveMid} />
      <path className="preview-ink" d={polyline(wave)} />
    </>
  );
}

function Roughness() {
  const { box, contours, pins } = roughnessPreview();
  return (
    <>
      <rect className="preview-frame" x={box.x} y={box.y} width={box.width} height={box.height} />
      {contours.map((contour, level) => (
        <path key={level} className="preview-contour" data-level={level} d={segments(contour)} />
      ))}
      {pins.map((p, i) => (
        <circle key={i} className="preview-dot" cx={round(p.x)} cy={round(p.y)} r={1.6} />
      ))}
    </>
  );
}

function Spiral() {
  const { systems } = spiralPreview();
  return (
    <>
      {systems.map(({ system, spiral }) => (
        <path key={system} className="preview-guide" d={polyline(spiral)} />
      ))}
      {systems.map(({ system, notes }) =>
        notes.map((p, i) => <circle key={`${system}:${i}`} className="preview-dot" cx={round(p.x)} cy={round(p.y)} r={1.2} />),
      )}
    </>
  );
}

function ChordColumns() {
  const { columns } = chordColumnsPreview();
  return (
    <>
      {columns.map(({ system, box, zeroX, notes }) => (
        <g key={system ?? 'pure'}>
          <rect className="preview-column" x={round(box.x)} y={box.y} width={round(box.width)} height={box.height} rx={3} />
          <line className="preview-guide" x1={round(zeroX)} y1={box.y + 6} x2={round(zeroX)} y2={box.y + box.height - 6} />
          {notes.map((n, i) => (
            <g key={i}>
              <line className="preview-ink" x1={round(zeroX)} y1={round(n.y)} x2={round(n.x)} y2={round(n.y)} />
              <circle className="preview-dot" cx={round(n.x)} cy={round(n.y)} r={2.2} />
            </g>
          ))}
        </g>
      ))}
    </>
  );
}

function Lattice() {
  const { nodes, edges, triangle } = latticePreview();
  return (
    <>
      <polygon className="preview-fill" points={triangle.map((p) => `${round(p.x)},${round(p.y)}`).join(' ')} />
      <path className="preview-ink preview-thin" d={segments(edges)} />
      {nodes.map(({ node, point }) => (
        <circle
          key={`${node.three}:${node.five}`}
          className="preview-dot"
          cx={round(point.x)}
          cy={round(point.y)}
          r={1.8}
        />
      ))}
    </>
  );
}

function EdoCircle() {
  const { centre, radius, steps, marks } = edoCirclePreview();
  return (
    <>
      <circle className="preview-guide" cx={centre.x} cy={centre.y} r={radius} />
      {marks.map(({ point, step }, i) => (
        <line key={i} className="preview-link" x1={round(point.x)} y1={round(point.y)} x2={round(step.x)} y2={round(step.y)} />
      ))}
      {steps.map((p, k) => (
        <circle key={k} className="preview-dot" cx={round(p.x)} cy={round(p.y)} r={2} />
      ))}
      {marks.map(({ point }, i) => (
        <circle key={i} className="preview-ring" cx={round(point.x)} cy={round(point.y)} r={2.6} />
      ))}
    </>
  );
}

const DRAWINGS: Record<LabId, () => ReactNode> = {
  'sound-waves': SoundWaves,
  'beats-and-roughness': Roughness,
  'tuning-systems': Spiral,
  'chord-comparison': ChordColumns,
  'just-intonation-lattice': Lattice,
  'edo-explorer': EdoCircle,
};

/** A Lab card's preview: a flat ink drawing of the Lab's own visual (decision #18). Decorative. */
export function LabPreview({ lab }: { lab: LabId }) {
  const Drawing = DRAWINGS[lab];
  return (
    <svg
      className="lab-card-preview"
      data-lab={lab}
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      aria-hidden="true"
      focusable="false"
    >
      <Drawing />
    </svg>
  );
}

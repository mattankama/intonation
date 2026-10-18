/**
 * The home page's Lab card previews (decision #18): flat ink drawings of each Lab's own
 * visual, computed from the acoustics core in a 16:10 box. Pure geometry, no React; every
 * drawing shows the Lab as it first opens, except where noted.
 */
import {
  LANDSCAPE_MAX_CENTS,
  type LatticeNode,
  type TuningSystemId,
  edoApproximations,
  presetHarmonics,
  roughnessLandscape,
  tuningTable,
  wavePeak,
  waveValue,
} from '../core';
import { DEFAULT_BOTTOM, bottomFrequency, landscapePins } from '../labs/beats-and-roughness/landscape';
import { readChordState } from '../labs/chord-comparison/chordState';
import { exploredEdo } from '../labs/edo-explorer/exploredEdo';
import { TONIC_TRIAD } from '../labs/just-intonation-lattice/chord';
import { latticeEdges, latticeGrid, nodePosition } from '../labs/just-intonation-lattice/geometry';
import { chordColumns } from '../labs/chord-comparison/useChordComparison';
import { DEFAULT_SYSTEMS } from '../labs/tuning-systems/systems';
import { DEFAULT_SETTINGS } from '../state/settings';
import { type Segment, contourSegments } from './contour';

/** SVG user units of every preview: 16:10. */
export const PREVIEW_WIDTH = 160;
export const PREVIEW_HEIGHT = 100;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Rect extends Point {
  readonly width: number;
  readonly height: number;
}

const MARGIN = 10;

// --- Sound waves: harmonic bars above the waveform they add up to -------------------------

export interface SoundWavesPreview {
  readonly bars: readonly Rect[];
  readonly wave: readonly Point[];
  /** The waveform's zero line. */
  readonly waveMid: number;
}

/** The string-like Timbre: the Lab opens on a sine, which would be one lonely bar. */
const PREVIEW_TIMBRE = 'string';
const BARS_TOP = MARGIN;
const BARS_BOTTOM = 44;
const WAVE_TOP = 52;
const WAVE_BOTTOM = PREVIEW_HEIGHT - MARGIN;
const WAVE_PERIODS = 2;
const WAVE_SAMPLES = 160;

export function soundWavesPreview(): SoundWavesPreview {
  const harmonics = presetHarmonics(PREVIEW_TIMBRE);
  const strongest = Math.max(...harmonics);
  const pitch = (PREVIEW_WIDTH - 2 * MARGIN) / harmonics.length;
  const bars = harmonics.map((a, i) => {
    const height = ((BARS_BOTTOM - BARS_TOP) * a) / strongest;
    return { x: MARGIN + i * pitch + pitch * 0.2, y: BARS_BOTTOM - height, width: pitch * 0.6, height };
  });
  const waveMid = (WAVE_TOP + WAVE_BOTTOM) / 2;
  const scale = (WAVE_BOTTOM - WAVE_TOP) / 2 / wavePeak(harmonics);
  const wave = Array.from({ length: WAVE_SAMPLES + 1 }, (_, s) => ({
    x: MARGIN + ((PREVIEW_WIDTH - 2 * MARGIN) * s) / WAVE_SAMPLES,
    y: waveMid - waveValue(harmonics, (2 * Math.PI * WAVE_PERIODS * s) / WAVE_SAMPLES) * scale,
  }));
  return { bars, wave, waveMid };
}

// --- Beats & roughness: the roughness landscape seen from above, as a contour map ---------

export interface RoughnessPreview {
  /** The map: lower interval 0–1200¢ left to right, upper interval 0–1200¢ top to bottom. */
  readonly box: Rect;
  /** One list of segments per contour level, lowest level first. */
  readonly contours: readonly (readonly Segment[])[];
  /** The nine pure chords pinned in the Lab, in menu order (major first). */
  readonly pins: readonly Point[];
}

/** Grid points per axis: the Lab's phone grid (20¢ steps), plenty for a thumbnail. */
const CONTOUR_POINTS = 61;
/**
 * Where the contour lines go, as shares of the map lying below them: most chords sit in a
 * broad middle band of roughness, so evenly spaced heights would leave the map nearly empty.
 */
const CONTOUR_SHARES = [0.15, 0.45, 0.8];

/** A 3 × 3 box blur, so a thumbnail's contours trace the landscape's shape, not its 20¢ grain. */
function smoothed(values: Float32Array, size: number): Float32Array {
  const out = new Float32Array(values.length);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy;
          const xx = x + dx;
          if (yy < 0 || yy >= size || xx < 0 || xx >= size) continue;
          sum += values[yy * size + xx]!;
          count++;
        }
      out[y * size + x] = sum / count;
    }
  return out;
}

export function roughnessPreview(): RoughnessPreview {
  const box = { x: MARGIN, y: MARGIN, width: PREVIEW_WIDTH - 2 * MARGIN, height: PREVIEW_HEIGHT - 2 * MARGIN };
  // The Lab's bottom note, in the string-like Timbre: a sine's landscape is almost flat.
  const bottom = bottomFrequency(DEFAULT_BOTTOM, DEFAULT_SETTINGS.referencePitch);
  const landscape = roughnessLandscape(bottom, presetHarmonics(PREVIEW_TIMBRE), CONTOUR_POINTS);
  // The landscape's heights run lower × upper; the map wants rows of upper, columns of lower.
  const grid = new Float32Array(CONTOUR_POINTS * CONTOUR_POINTS);
  for (let lower = 0; lower < CONTOUR_POINTS; lower++)
    for (let upper = 0; upper < CONTOUR_POINTS; upper++)
      grid[upper * CONTOUR_POINTS + lower] = landscape.heights[lower * CONTOUR_POINTS + upper]!;
  const rows = smoothed(grid, CONTOUR_POINTS);
  const cell = CONTOUR_POINTS - 1;
  const toBox = (p: Point): Point => ({ x: box.x + (box.width * p.x) / cell, y: box.y + (box.height * p.y) / cell });
  const sorted = Float32Array.from(rows).sort();
  const levels = CONTOUR_SHARES.map((share) => sorted[Math.floor(share * sorted.length)]!);
  const contours = levels.map((level) =>
    contourSegments(rows, CONTOUR_POINTS, level).map(([a, b]): Segment => [toBox(a), toBox(b)]),
  );
  const pins = landscapePins().map(({ pure }) => ({
    x: box.x + (box.width * pure.lower) / LANDSCAPE_MAX_CENTS,
    y: box.y + (box.height * pure.upper) / LANDSCAPE_MAX_CENTS,
  }));
  return { box, contours, pins };
}

// --- Tuning systems: the pitch spiral seen from above ------------------------------------

export interface SpiralPreview {
  readonly centre: Point;
  /**
   * The Lab's default systems, each on its own spiral a little further out (two octaves, one
   * turn each, climbing outwards), with every note in both octaves.
   */
  readonly systems: readonly {
    readonly system: TuningSystemId;
    readonly spiral: readonly Point[];
    readonly notes: readonly Point[];
  }[];
}

const SPIRAL_CENTRE = { x: PREVIEW_WIDTH / 2, y: PREVIEW_HEIGHT / 2 };
const SPIRAL_START = 9;
/** Radius gained per octave, and the gap between neighbouring systems. */
const SPIRAL_STEP = 15;
const SPIRAL_SYSTEM_GAP = 3;
const SPIRAL_OCTAVES = 2;
const SPIRAL_SAMPLES = 120;

/** `cents` above the Tonic, clockwise from straight up, `offset` outside the spiral. */
function spiralAt(cents: number, offset: number): Point {
  const angle = (2 * Math.PI * cents) / 1200;
  const r = SPIRAL_START + (SPIRAL_STEP * cents) / 1200 + offset;
  return { x: SPIRAL_CENTRE.x + r * Math.sin(angle), y: SPIRAL_CENTRE.y - r * Math.cos(angle) };
}

export function spiralPreview(): SpiralPreview {
  const end = 1200 * SPIRAL_OCTAVES;
  const tonic = DEFAULT_SETTINGS.tonic;
  const systems = DEFAULT_SYSTEMS.map((system, k) => {
    const offset = k * SPIRAL_SYSTEM_GAP;
    const spiral = Array.from({ length: SPIRAL_SAMPLES + 1 }, (_, i) => spiralAt((end * i) / SPIRAL_SAMPLES, offset));
    const octave = tuningTable({ system, tonic }).map((row) => row.cents);
    const notes = Array.from({ length: SPIRAL_OCTAVES }, (_, o) => octave.map((c) => c + 1200 * o))
      .flat()
      .map((c) => spiralAt(c, offset));
    return { system, spiral, notes };
  });
  return { centre: SPIRAL_CENTRE, systems };
}

// --- Chord comparison: the pure chord beside the compared systems' versions ---------------

export interface ChordColumnPreview {
  /** null for the pure chord. */
  readonly system: TuningSystemId | null;
  readonly box: Rect;
  /** The column's 0¢ line. */
  readonly zeroX: number;
  /** Bass first: each note's cents off pure, drawn that far sideways from the 0¢ line. */
  readonly notes: readonly (Point & { readonly centsOff: number })[];
}

export interface ChordColumnsPreview {
  readonly columns: readonly ChordColumnPreview[];
}

const COLUMN_GAP = 6;
/** The column's half-width stands for this many cents (the Lab's bars span ±50¢). */
const COLUMN_CENTS = 25;

export function chordColumnsPreview(): ChordColumnsPreview {
  const { pureRoot, systems } = chordColumns(readChordState(new URLSearchParams()), DEFAULT_SETTINGS);
  const offsets: { system: TuningSystemId | null; cents: number[] }[] = [
    { system: null, cents: pureRoot.notes.map(() => 0) },
    ...systems.map((c) => ({ system: c.system, cents: c.tuned.notes.map((n) => n.centsOffPure) })),
  ];
  const width = (PREVIEW_WIDTH - 2 * MARGIN - COLUMN_GAP * (offsets.length - 1)) / offsets.length;
  const columns = offsets.map(({ system, cents }, k) => {
    const box = { x: MARGIN + k * (width + COLUMN_GAP), y: MARGIN, width, height: PREVIEW_HEIGHT - 2 * MARGIN };
    const zeroX = box.x + width / 2;
    const clamp = (c: number) => Math.max(-COLUMN_CENTS, Math.min(COLUMN_CENTS, c));
    const notes = cents.map((centsOff, i) => ({
      x: zeroX + (clamp(centsOff) / COLUMN_CENTS) * (width / 2),
      y: box.y + box.height - ((i + 1) * box.height) / (cents.length + 1),
      centsOff,
    }));
    return { system, box, zeroX, notes };
  });
  return { columns };
}

// --- Just-intonation lattice: the flat 5-limit grid with the Tonic's major triad ------------

export interface LatticePreview {
  readonly nodes: readonly { readonly node: LatticeNode; readonly point: Point }[];
  /** ×3 and ×5 steps and the minor-third diagonals. */
  readonly edges: readonly (readonly [Point, Point])[];
  /** The major triad on the Tonic (1/1, 5/4, 3/2), filled. */
  readonly triangle: readonly [Point, Point, Point];
}

export function latticePreview(): LatticePreview {
  const grid = latticeGrid({ phone: false, limit: 5 }, TONIC_TRIAD);
  const flat = grid.map((node) => {
    const [x, y] = nodePosition(node);
    return { x, y: -y };
  });
  const xs = flat.map((p) => p.x);
  const ys = flat.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const room = 2 * (MARGIN + 2);
  const scale = Math.min((PREVIEW_WIDTH - room) / (maxX - minX), (PREVIEW_HEIGHT - room) / (maxY - minY));
  const fit = (p: Point): Point => ({
    x: PREVIEW_WIDTH / 2 + (p.x - (minX + maxX) / 2) * scale,
    y: PREVIEW_HEIGHT / 2 + (p.y - (minY + maxY) / 2) * scale,
  });
  const nodes = grid.map((node, i) => ({ node, point: fit(flat[i]!) }));
  const pointOf = (n: LatticeNode) =>
    nodes.find((m) => m.node.three === n.three && m.node.five === n.five && m.node.seven === n.seven)!.point;
  const edges = latticeEdges(grid).map((e): readonly [Point, Point] => [pointOf(e.from), pointOf(e.to)]);
  const [tonic, third, fifth] = TONIC_TRIAD.map(pointOf);
  return { nodes, edges, triangle: [tonic!, third!, fifth!] };
}

// --- EDO explorer: the octave as a circle of equal steps, with pure-interval rings ----------

export interface EdoCirclePreview {
  readonly centre: Point;
  readonly radius: number;
  /** Step 0 at the top, clockwise. */
  readonly steps: readonly Point[];
  /** Each pure interval the Lab marks: a ring at its exact angle, joined to its nearest step. */
  readonly marks: readonly { readonly point: Point; readonly step: Point }[];
}

const EDO_CENTRE = { x: PREVIEW_WIDTH / 2, y: PREVIEW_HEIGHT / 2 };
const EDO_RADIUS = 32;
const EDO_MARK_RADIUS = EDO_RADIUS + 8;

const onCircle = (fraction: number, radius: number): Point => ({
  x: EDO_CENTRE.x + radius * Math.sin(2 * Math.PI * fraction),
  y: EDO_CENTRE.y - radius * Math.cos(2 * Math.PI * fraction),
});

export function edoCirclePreview(): EdoCirclePreview {
  const n = exploredEdo(DEFAULT_SETTINGS);
  const steps = Array.from({ length: n }, (_, k) => onCircle(k / n, EDO_RADIUS));
  const marks = edoApproximations(n).map((a) => ({
    point: onCircle(a.pureCents / 1200, EDO_MARK_RADIUS),
    step: steps[((a.step % n) + n) % n]!,
  }));
  return { centre: EDO_CENTRE, radius: EDO_RADIUS, steps, marks };
}

import { describe, expect, it } from 'vitest';
import {
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  chordColumnsPreview,
  edoCirclePreview,
  latticePreview,
  roughnessPreview,
  soundWavesPreview,
  spiralPreview,
} from './previews';

const inside = ({ x, y }: { x: number; y: number }) =>
  x >= 0 && x <= PREVIEW_WIDTH && y >= 0 && y <= PREVIEW_HEIGHT;

describe('Sound waves preview', () => {
  const preview = soundWavesPreview();

  it('draws the 16 harmonic bars of the string-like Timbre, scaled to its recipe', () => {
    expect(preview.bars).toHaveLength(16);
    const [first, second, , , fifth] = preview.bars;
    // The recipe: a₁ = 1, a₂ = 0.593, a₅ = 0.403 (issue #14).
    expect(second!.height / first!.height).toBeCloseTo(0.593, 3);
    expect(fifth!.height / first!.height).toBeCloseTo(0.403, 3);
    // Bars stand on one baseline, left to right.
    expect(new Set(preview.bars.map((b) => b.y + b.height)).size).toBe(1);
    expect(preview.bars.every((b, i) => i === 0 || b.x > preview.bars[i - 1]!.x)).toBe(true);
  });

  it('draws two periods of the waveform below the bars, starting on its mid-line', () => {
    expect(preview.wave.length).toBeGreaterThan(100);
    const [start] = preview.wave;
    // Every harmonic is in sine phase, so the wave starts at zero.
    expect(start!.y).toBeCloseTo(preview.waveMid, 6);
    expect(preview.wave.every(inside)).toBe(true);
    const lowestBar = Math.max(...preview.bars.map((b) => b.y + b.height));
    expect(Math.min(...preview.wave.map((p) => p.y))).toBeGreaterThan(lowestBar);
  });
});

describe('Beats & roughness preview', () => {
  const preview = roughnessPreview();
  const { box } = preview;
  /** A point as fractions of the map: lower interval across, upper interval down. */
  const onMap = (p: { x: number; y: number }) => ({
    lower: ((p.x - box.x) / box.width) * 1200,
    upper: ((p.y - box.y) / box.height) * 1200,
  });

  it('draws the roughness landscape as several contour lines inside its map', () => {
    expect(preview.contours.length).toBeGreaterThanOrEqual(3);
    for (const contour of preview.contours) {
      expect(contour.length).toBeGreaterThan(0);
      for (const segment of contour)
        for (const p of segment) {
          expect(p.x).toBeGreaterThanOrEqual(box.x - 1e-9);
          expect(p.x).toBeLessThanOrEqual(box.x + box.width + 1e-9);
          expect(p.y).toBeGreaterThanOrEqual(box.y - 1e-9);
          expect(p.y).toBeLessThanOrEqual(box.y + box.height + 1e-9);
        }
    }
    expect(inside(box) && inside({ x: box.x + box.width, y: box.y + box.height })).toBe(true);
  });

  it('pins the nine pure chords, the major triad at its stacked thirds', () => {
    expect(preview.pins).toHaveLength(9);
    // 4:5:6 stacks a pure major third (386.314¢) and a pure minor third (315.641¢).
    const major = onMap(preview.pins[0]!);
    expect(major.lower).toBeCloseTo(386.314, 2);
    expect(major.upper).toBeCloseTo(315.641, 2);
  });
});

describe('Tuning systems preview', () => {
  const preview = spiralPreview();
  const { centre } = preview;
  /** Turns clockwise from straight up, 0–1. */
  const turn = (p: { x: number; y: number }) => {
    const a = Math.atan2(p.x - centre.x, centre.y - p.y) / (2 * Math.PI);
    return a < 0 ? a + 1 : a;
  };
  const radius = (p: { x: number; y: number }) => Math.hypot(p.x - centre.x, p.y - centre.y);

  it("flattens the Lab's spiral: the four default systems' notes over two octaves", () => {
    expect(preview.systems.map((s) => s.system)).toEqual(['12-edo', 'meantone', 'pythagorean', 'just']);
    for (const { notes } of preview.systems) expect(notes).toHaveLength(24);
    expect(preview.systems.every((s) => s.spiral.every(inside) && s.notes.every(inside))).toBe(true);
  });

  it('puts the Tonic straight up and each note at its cents as a fraction of a turn', () => {
    for (const { notes } of preview.systems) expect(turn(notes[0]!)).toBeCloseTo(0, 9);
    const just = preview.systems[3]!.notes;
    // Just intonation's E is 5/4 above C: 386.314¢.
    expect(turn(just[4]!)).toBeCloseTo(386.314 / 1200, 5);
    // 12-EDO's F♯ is half a turn round.
    expect(turn(preview.systems[0]!.notes[6]!)).toBeCloseTo(0.5, 9);
  });

  it('climbs outwards: an octave further out, each system a little outside the one before', () => {
    const edo = preview.systems[0]!.notes;
    expect(radius(edo[12]!)).toBeGreaterThan(radius(edo[0]!));
    expect(radius(edo[23]!)).toBeGreaterThan(radius(edo[11]!));
    const tonics = preview.systems.map((s) => radius(s.notes[0]!));
    expect(tonics).toEqual([...tonics].sort((a, b) => a - b));
    expect(new Set(tonics).size).toBe(4);
  });
});

describe('Chord comparison preview', () => {
  const preview = chordColumnsPreview();
  const offs = (k: number) => preview.columns[k]!.notes.map((n) => n.centsOff);

  it("shows the Lab's opening C major as four columns: pure, then 12-EDO, meantone and just", () => {
    expect(preview.columns.map((c) => c.system)).toEqual([null, '12-edo', 'meantone', 'just']);
    const lefts = preview.columns.map((c) => c.box.x);
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    for (const column of preview.columns) {
      expect(column.notes).toHaveLength(3);
      expect(inside(column.box) && inside({ x: column.box.x + column.box.width, y: column.box.y + column.box.height })).toBe(true);
      // Bass at the bottom.
      const ys = column.notes.map((n) => n.y);
      expect(ys).toEqual([...ys].sort((a, b) => b - a));
    }
  });

  it("marks each note's cents off pure, sideways from the column's 0¢ line", () => {
    expect(offs(0)).toEqual([0, 0, 0]);
    // 12-EDO: third 400¢ vs 386.314¢, fifth 700¢ vs 701.955¢.
    expect(offs(1)[1]).toBeCloseTo(13.686, 3);
    expect(offs(1)[2]).toBeCloseTo(-1.955, 3);
    // Quarter-comma meantone: a pure third, a fifth 5.377¢ narrow.
    expect(offs(2)[1]).toBeCloseTo(0, 9);
    expect(offs(2)[2]).toBeCloseTo(-5.377, 3);
    expect(offs(3).every((c) => Math.abs(c) < 1e-9)).toBe(true);

    const edo = preview.columns[1]!;
    const [, third, fifth] = edo.notes.map((n) => n.x - edo.zeroX);
    expect(third!).toBeGreaterThan(0);
    expect(fifth!).toBeLessThan(0);
    expect(third! / fifth!).toBeCloseTo(13.686 / -1.955, 2);
    for (const note of preview.columns[0]!.notes) expect(note.x).toBe(preview.columns[0]!.zeroX);
  });
});

describe('Just-intonation lattice preview', () => {
  const preview = latticePreview();
  const at = (three: number, five: number) =>
    preview.nodes.find((n) => n.node.three === three && n.node.five === five && n.node.seven === 0)!.point;

  it("draws the Lab's flat 5-limit grid: ×3 across, ×5 up, nothing in the ×7 direction", () => {
    expect(preview.nodes).toHaveLength(35);
    expect(preview.nodes.every((n) => n.node.seven === 0 && inside(n.point))).toBe(true);
    // 3/2 sits straight to the right of 1/1; 5/4 above and to the right.
    expect(at(1, 0).y).toBeCloseTo(at(0, 0).y, 9);
    expect(at(1, 0).x).toBeGreaterThan(at(0, 0).x);
    expect(at(0, 1).y).toBeLessThan(at(0, 0).y);
    expect(at(0, 1).x).toBeGreaterThan(at(0, 0).x);
    // 6 × 5 ×3 steps, 7 × 4 ×5 steps and 6 × 4 minor-third diagonals.
    expect(preview.edges).toHaveLength(30 + 28 + 24);
  });

  it('fills the C major triangle: 1/1, 5/4 and 3/2', () => {
    expect(preview.triangle).toEqual([at(0, 0), at(0, 1), at(1, 0)]);
  });
});

describe('EDO explorer preview', () => {
  const preview = edoCirclePreview();
  const { centre } = preview;
  const turn = (p: { x: number; y: number }) => {
    const a = Math.atan2(p.x - centre.x, centre.y - p.y) / (2 * Math.PI);
    return a < 0 ? a + 1 : a;
  };

  it("draws the Lab's opening 12-EDO as twelve steps round a circle, step 0 at the top", () => {
    expect(preview.steps).toHaveLength(12);
    expect(turn(preview.steps[0]!)).toBeCloseTo(0, 9);
    expect(turn(preview.steps[3]!)).toBeCloseTo(0.25, 9);
    expect(preview.steps.every(inside)).toBe(true);
  });

  it('rings each pure interval at its exact angle, joined to its nearest step', () => {
    expect(preview.marks).toHaveLength(5);
    const [fifth, third, , seventh] = preview.marks;
    // 3/2 = 701.955¢, nearest step 7; 5/4 = 386.314¢, step 4; 7/4 = 968.826¢, step 10.
    expect(turn(fifth!.point)).toBeCloseTo(701.955 / 1200, 5);
    expect(fifth!.step).toEqual(preview.steps[7]);
    expect(turn(third!.point)).toBeCloseTo(386.314 / 1200, 5);
    expect(third!.step).toEqual(preview.steps[4]);
    expect(turn(seventh!.point)).toBeCloseTo(968.826 / 1200, 5);
    expect(seventh!.step).toEqual(preview.steps[10]);
    expect(preview.marks.every((m) => inside(m.point))).toBe(true);
  });
});

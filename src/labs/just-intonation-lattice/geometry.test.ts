import { describe, expect, it } from 'vitest';
import { chordFaces, latticeEdges, latticeGrid, latticeView, nodePosition, pumpView, revealed } from './geometry';

const node = (three: number, five = 0, seven = 0) => ({ three, five, seven });
type V = readonly [number, number, number];

const area = ([a, b, c]: readonly [V, V, V]) => {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cross = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  return Math.hypot(...cross) / 2;
};
const totalArea = (faces: readonly (readonly [V, V, V])[]) => faces.reduce((sum, f) => sum + area(f), 0);
const cellArea = area([nodePosition(node(0)), nodePosition(node(1)), nodePosition(node(0, 1))]);

describe('the lattice grid (decision #17)', () => {
  it('desktop: ×3 from −3 to +3 and ×5 from −2 to +2, flat at first', () => {
    const grid = latticeGrid({ phone: false, limit: 5 });
    expect(grid).toHaveLength(35);
    expect(grid).toContainEqual(node(-3, -2));
    expect(grid).toContainEqual(node(3, 2));
    expect(grid.every((n) => n.seven === 0)).toBe(true);
  });

  it('desktop 7-limit adds a ×7 layer (×3 −1..+1, ×5 −1..+1)', () => {
    const grid = latticeGrid({ phone: false, limit: 7 });
    expect(grid).toHaveLength(44);
    expect(grid.filter((n) => n.seven === 1)).toHaveLength(9);
  });

  it('phones: a smaller grid, ×3 −2..+2 and ×5 −1..+1, plus a ×7 layer', () => {
    expect(latticeGrid({ phone: true, limit: 5 })).toHaveLength(15);
    const seven = latticeGrid({ phone: true, limit: 7 }).filter((n) => n.seven === 1);
    expect(seven).toEqual([node(-1, 0, 1), node(0, 0, 1), node(1, 0, 1)]);
  });

  it('always includes the chord’s notes, even outside the grid', () => {
    const grid = latticeGrid({ phone: true, limit: 5 }, [node(4, -1), node(0)]);
    expect(grid).toHaveLength(16);
    expect(grid).toContainEqual(node(4, -1));
  });
});

describe('lattice edges', () => {
  it('join neighbours along ×3, ×5, ×7 and the minor-third diagonal', () => {
    const edges = latticeEdges([node(0), node(1), node(0, 1), node(0, 0, 1), node(2, 2)]);
    const kinds = edges.map((e) => e.kind).sort();
    expect(kinds).toEqual(['diagonal', 'five', 'seven', 'three']);
  });
});

describe('the ×7 reveal', () => {
  it('flat: a ×7 step points straight at the viewer, so it is hidden', () => {
    const [x, y] = revealed(nodePosition(node(0, 0, 1)), 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });

  it('turned: the ×7 layer rises above the flat lattice like a second floor', () => {
    const [x, y] = revealed(nodePosition(node(0, 0, 1)), 1);
    expect(y).toBeGreaterThan(1);
    expect(Math.abs(x)).toBeLessThan(1);
  });
});

describe('chord shapes', () => {
  const faces = (...nodes: ReturnType<typeof node>[]) => chordFaces(nodes.map(nodePosition));

  it('a triad is one triangle, the cell of the lattice', () => {
    const triad = faces(node(0), node(0, 1), node(1));
    expect(triad).toHaveLength(1);
    expect(totalArea(triad)).toBeCloseTo(cellArea);
  });

  it('notes in a line (C–G–D) have no area', () => {
    expect(faces(node(0), node(1), node(2))).toEqual([]);
    expect(faces(node(0), node(1))).toEqual([]);
  });

  it('a flat major seventh chord (C–E–G–B) is a parallelogram of two cells', () => {
    const shape = faces(node(0), node(0, 1), node(1), node(1, 1));
    expect(totalArea(shape)).toBeCloseTo(2 * cellArea);
  });

  it('a note inside the shape adds no area', () => {
    const shape = faces(node(0), node(3), node(0, 3), node(1, 1));
    expect(totalArea(shape)).toBeCloseTo(9 * cellArea);
  });

  it('the harmonic seventh chord (4:5:6:7) is a solid with four faces', () => {
    expect(faces(node(0), node(0, 1), node(1), node(0, 0, 1))).toHaveLength(4);
  });
});

describe('framing the view', () => {
  it('desktop keeps one view of the whole grid', () => {
    expect(latticeView({ phone: false, limit: 5 }, [node(3, 2)])).toEqual(
      latticeView({ phone: false, limit: 5 }, []),
    );
  });

  it('phones frame the chord, or the Tonic when there is none', () => {
    const empty = latticeView({ phone: true, limit: 5 }, []);
    expect(empty.target).toEqual([0, 0, 0]);
    const left = latticeView({ phone: true, limit: 5 }, [node(-2), node(-2, 1), node(-1)]);
    expect(left.target[0]).toBeLessThan(-1);
    expect(left.position[0]).toBeCloseTo(left.target[0]);
  });
});

describe('framing a comma pump (decision #17: long pumps pan along their path)', () => {
  const desktop = { phone: false, limit: 5 } as const;
  // The syntonic pump's first loop: roots C–A–D–G–C' and the notes of its chords.
  const syntonicLoop = [node(0), node(-1, 1), node(-2, 1), node(-3, 1), node(-4, 1), node(-4, 2), node(-3, 2)];

  it('desktop keeps the grid view while the loop fits in it', () => {
    expect(pumpView(desktop, syntonicLoop, [node(-1, 1)])).toEqual(latticeView(desktop, []));
  });

  it('desktop frames a loop that leaves the grid, from further back', () => {
    const fifths = Array.from({ length: 14 }, (_, i) => node(i));
    const view = pumpView(desktop, fifths, [node(0)]);
    const grid = latticeView(desktop, []);
    expect(view.target[0]).toBeGreaterThan(5);
    expect(view.target[0]).toBeLessThan(12);
    expect(view.position[2] - view.target[2]).toBeGreaterThan(grid.position[2] - grid.target[2]);
  });

  it('phones follow the current chord', () => {
    const chord = [node(6), node(6, 1), node(7)];
    expect(pumpView({ phone: true, limit: 5 }, syntonicLoop, chord)).toEqual(
      latticeView({ phone: true, limit: 5 }, chord),
    );
  });
});

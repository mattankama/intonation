/**
 * The lattice's geometry (pure, no three.js): where each node sits, which nodes are drawn,
 * the turn that reveals ×7, the faces of a chord's shape and the camera framing.
 *
 * Layout: ×3 runs to the right, ×5 up and to the right (so every triad is a triangle cell,
 * with the minor-third diagonal as its third side), ×7 towards the viewer. Flat, the ×7
 * direction points straight out of the screen; turned, the ×7 layer rises like a second floor.
 */
import type { LatticeNode } from '../../core';
import type { SceneView } from '../../scene3d/scene';
import type { Limit } from './chord';
import { sameNode } from './chord';

export type Vec3 = readonly [number, number, number];

/** Scene units per step: ×3 across, ×5 up (with a skew to the right), ×7 between floors. */
const THREE_STEP = 1.25;
const FIVE_SKEW = 0.62;
const FIVE_STEP = 1.08;
const SEVEN_STEP = 2.6;

/** The turn (radians, three.js Euler order XYZ) that reveals the ×7 direction. */
export const REVEAL_ROTATION = { x: -0.8, y: 0.1 } as const;

/** A node's place on the flat (unturned) lattice; the Tonic 1/1 is at the origin. */
export function nodePosition(n: LatticeNode): Vec3 {
  return [n.three * THREE_STEP + n.five * FIVE_SKEW, n.five * FIVE_STEP, n.seven * SEVEN_STEP];
}

/**
 * A point turned `t` of the way (0 flat … 1 fully turned) to reveal ×7: the same rotation
 * the scene gives its lattice group, Ry first, then Rx.
 */
export function revealed(p: Vec3, t: number): Vec3 {
  const ry = REVEAL_ROTATION.y * t;
  const rx = REVEAL_ROTATION.x * t;
  const x1 = p[0] * Math.cos(ry) + p[2] * Math.sin(ry);
  const z1 = -p[0] * Math.sin(ry) + p[2] * Math.cos(ry);
  return [x1, p[1] * Math.cos(rx) - z1 * Math.sin(rx), p[1] * Math.sin(rx) + z1 * Math.cos(rx)];
}

export interface LatticeLayout {
  readonly phone: boolean;
  readonly limit: Limit;
}

/** Inclusive ranges of ×3 and ×5 exponents for one layer. */
interface Layer {
  readonly seven: number;
  readonly three: readonly [number, number];
  readonly five: readonly [number, number];
}

/** Decision #17: desktop shows more; phones a smaller grid plus the ×7 layer. */
const LAYERS: Record<'desktop' | 'phone', readonly Layer[]> = {
  desktop: [
    { seven: 0, three: [-3, 3], five: [-2, 2] },
    { seven: 1, three: [-1, 1], five: [-1, 1] },
  ],
  phone: [
    { seven: 0, three: [-2, 2], five: [-1, 1] },
    { seven: 1, three: [-1, 1], five: [0, 0] },
  ],
};

/** The nodes drawn: the grid for the layout (×7 layer only at 7-limit), plus any chord notes outside it. */
export function latticeGrid(layout: LatticeLayout, chord: readonly LatticeNode[] = []): LatticeNode[] {
  const nodes: LatticeNode[] = [];
  for (const layer of LAYERS[layout.phone ? 'phone' : 'desktop']) {
    if (layer.seven !== 0 && layout.limit === 5) continue;
    for (let five = layer.five[0]; five <= layer.five[1]; five++)
      for (let three = layer.three[0]; three <= layer.three[1]; three++)
        nodes.push({ three, five, seven: layer.seven });
  }
  for (const n of chord) if (!nodes.some((m) => sameNode(m, n))) nodes.push(n);
  return nodes;
}

export type EdgeKind = 'three' | 'five' | 'seven' | 'diagonal';

export interface LatticeEdge {
  readonly from: LatticeNode;
  readonly to: LatticeNode;
  readonly kind: EdgeKind;
}

/** Steps joining neighbours: ×3, ×5, ×7 and the minor-third diagonal (×5 ÷ 3) that closes each triad. */
const STEPS: readonly (readonly [EdgeKind, LatticeNode])[] = [
  ['three', { three: 1, five: 0, seven: 0 }],
  ['five', { three: 0, five: 1, seven: 0 }],
  ['diagonal', { three: -1, five: 1, seven: 0 }],
  ['seven', { three: 0, five: 0, seven: 1 }],
];

/** Every edge between two drawn nodes one step apart. */
export function latticeEdges(nodes: readonly LatticeNode[]): LatticeEdge[] {
  const edges: LatticeEdge[] = [];
  for (const from of nodes)
    for (const [kind, step] of STEPS) {
      const to = { three: from.three + step.three, five: from.five + step.five, seven: from.seven + step.seven };
      if (nodes.some((m) => sameNode(m, to))) edges.push({ from, to, kind });
    }
  return edges;
}

// --- Chord shapes: the convex hull of the chord's nodes, as triangles ---------------------

type Triangle = readonly [Vec3, Vec3, Vec3];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vec3) => Math.sqrt(dot(a, a));
const EPSILON = 1e-9;

/** The convex polygon of points lying in one plane (normal `normal`), fanned into triangles. */
function planarHull(points: readonly Vec3[], normal: Vec3): Triangle[] {
  const origin = points[0]!;
  const u = sub(points.find((p) => length(sub(p, origin)) > EPSILON) ?? origin, origin);
  const w = cross(normal, u);
  const flat = points.map((p) => ({ p, x: dot(sub(p, origin), u), y: dot(sub(p, origin), w) }));
  flat.sort((a, b) => a.x - b.x || a.y - b.y);
  type Flat = (typeof flat)[number];
  const turn = (o: Flat, a: Flat, b: Flat) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const scale = dot(u, u) * dot(w, w);
  const half = (list: Flat[]) => {
    const hull: Flat[] = [];
    for (const q of list) {
      while (hull.length >= 2 && turn(hull[hull.length - 2]!, hull[hull.length - 1]!, q) <= EPSILON * scale)
        hull.pop();
      hull.push(q);
    }
    hull.pop();
    return hull;
  };
  const hull = [...half(flat), ...half([...flat].reverse())];
  const triangles: Triangle[] = [];
  for (let i = 1; i + 1 < hull.length; i++) triangles.push([hull[0]!.p, hull[i]!.p, hull[i + 1]!.p]);
  return triangles;
}

/**
 * The shape a chord makes on the lattice, as triangles to fill: none for one or two notes or
 * notes in a line, a flat polygon for notes in one plane, otherwise the faces of a solid.
 */
export function chordFaces(points: readonly Vec3[]): Triangle[] {
  const n = points.length;
  if (n < 3) return [];
  const triples: [number, number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) triples.push([i, j, k]);

  const faces: Triangle[] = [];
  const seen = new Set<string>();
  for (const [i, j, k] of triples) {
    const a = points[i]!;
    const normal = cross(sub(points[j]!, a), sub(points[k]!, a));
    const size = length(normal);
    if (size < EPSILON) continue; // collinear
    const side = points.map((p) => dot(sub(p, a), normal) / size);
    const onPlane = side.map((d) => Math.abs(d) < 1e-6);
    const above = side.some((d, m) => !onPlane[m] && d > 0);
    const below = side.some((d, m) => !onPlane[m] && d < 0);
    if (above && below) continue; // not a face of the hull
    const key = onPlane.map((on) => (on ? 1 : 0)).join('');
    if (seen.has(key)) continue;
    seen.add(key);
    faces.push(...planarHull(points.filter((_, m) => onPlane[m]), normal));
  }
  return faces;
}

// --- Framing -----------------------------------------------------------------------------

/** Desktop: one view of the whole grid; turned, a little further back, as its near edge looms. */
const DESKTOP_VIEWS: Record<Limit, SceneView> = {
  5: { position: [0, 0.3, 13], target: [0, 0.3, 0] },
  7: { position: [0, 0.5, 14.5], target: [0, 0.5, 0] },
};
/** Phones: closer, centred on the chord (decision #17: auto-framing). */
const PHONE_DISTANCE = 9;

/** The starting view: fixed on desktop; on phones it frames the chord (or the Tonic). */
export function latticeView(layout: LatticeLayout, chord: readonly LatticeNode[]): SceneView {
  if (!layout.phone) return DESKTOP_VIEWS[layout.limit];
  const t = layout.limit === 7 ? 1 : 0;
  const points = chord.map((n) => revealed(nodePosition(n), t));
  const mean = (axis: 0 | 1 | 2) =>
    points.length === 0 ? 0 : points.reduce((sum, p) => sum + p[axis], 0) / points.length;
  const target: Vec3 = [mean(0), mean(1), mean(2)];
  return { position: [target[0], target[1], target[2] + PHONE_DISTANCE], target };
}

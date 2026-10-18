/**
 * Contour lines of a square grid of values (marching squares), for the roughness preview.
 * Grid coordinates: x is the column, y the row, both from 0 at the top left.
 */
import type { Point } from './previews';

export type Segment = readonly [Point, Point];

/**
 * The pieces of the contour at `level` through a `size` × `size` grid of values (row by
 * row). A value equal to the level counts as above it.
 */
export function contourSegments(values: ArrayLike<number>, size: number, level: number): Segment[] {
  const segments: Segment[] = [];
  const at = (x: number, y: number) => values[y * size + x]!;
  /** Where the level crosses between two grid points, or null if it doesn't. */
  const crossing = (x1: number, y1: number, x2: number, y2: number): Point | null => {
    const a = at(x1, y1);
    const b = at(x2, y2);
    if (a >= level === b >= level) return null;
    const t = (level - a) / (b - a);
    return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
  };
  for (let y = 0; y + 1 < size; y++)
    for (let x = 0; x + 1 < size; x++) {
      const top = crossing(x, y, x + 1, y);
      const right = crossing(x + 1, y, x + 1, y + 1);
      const bottom = crossing(x, y + 1, x + 1, y + 1);
      const left = crossing(x, y, x, y + 1);
      const found = [top, right, bottom, left].filter((p): p is Point => p !== null);
      if (found.length === 2) {
        segments.push([found[0]!, found[1]!]);
      } else if (found.length === 4) {
        // A saddle: cut off the two corners on the other side of the level from the centre.
        const centreHigh = (at(x, y) + at(x + 1, y) + at(x, y + 1) + at(x + 1, y + 1)) / 4 >= level;
        const topLeftHigh = at(x, y) >= level;
        if (topLeftHigh === centreHigh) segments.push([top!, right!], [bottom!, left!]);
        else segments.push([top!, left!], [right!, bottom!]);
      }
    }
  return segments;
}

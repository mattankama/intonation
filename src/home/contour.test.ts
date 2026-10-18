import { describe, expect, it } from 'vitest';
import { contourSegments } from './contour';

/** Segments as sorted "x,y x,y" strings, so order and direction don't matter. */
const shown = (segments: ReturnType<typeof contourSegments>) =>
  segments
    .map((s) =>
      s
        .map((p) => `${p.x},${p.y}`)
        .sort()
        .join(' '),
    )
    .sort();

describe('contourSegments', () => {
  it('draws nothing where the whole grid is on one side of the level', () => {
    expect(contourSegments([0, 0, 0, 0], 2, 0.5)).toEqual([]);
    expect(contourSegments([1, 1, 1, 1], 2, 0.5)).toEqual([]);
  });

  it('cuts off one high corner, crossing each edge where the value passes the level', () => {
    // Rows top to bottom: [0, 0], [0, 1]; the level 0.5 crosses halfway along both edges.
    expect(shown(contourSegments([0, 0, 0, 1], 2, 0.5))).toEqual(['0.5,1 1,0.5']);
    // A level of 0.25 crosses a quarter of the way from the low corners.
    expect(shown(contourSegments([0, 0, 0, 1], 2, 0.25))).toEqual(['0.25,1 1,0.25']);
  });

  it('runs straight across a grid that rises from top to bottom', () => {
    // Rows: [0, 0, 0], [1, 1, 1], [2, 2, 2]: level 1.5 is the line y = 1.5.
    expect(shown(contourSegments([0, 0, 0, 1, 1, 1, 2, 2, 2], 3, 1.5))).toEqual(['0,1.5 1,1.5', '1,1.5 2,1.5']);
  });

  it('splits a saddle cell into two segments', () => {
    // Rows: [1, 0], [0, 1]: two high corners on a diagonal.
    expect(contourSegments([1, 0, 0, 1], 2, 0.5)).toHaveLength(2);
  });
});

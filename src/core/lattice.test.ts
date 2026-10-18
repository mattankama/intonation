import { describe, expect, it } from 'vitest';
import { chordProportion, latticeNoteName, nodeOfRatio, primeFactors, ratio, ratioOfNode } from './index';

const node = (three: number, five = 0, seven = 0) => ({ three, five, seven });

describe('the just-intonation lattice: ratio ↔ (3, 5, 7) exponents', () => {
  it.each([
    [node(0), 1, 1],
    [node(1), 3, 2],
    [node(-1), 4, 3],
    [node(2), 9, 8],
    [node(0, 1), 5, 4],
    [node(1, 1), 15, 8],
    [node(-1, 1), 5, 3],
    [node(1, -1), 6, 5],
    [node(0, -1), 8, 5],
    [node(2, 1), 45, 32],
    [node(-4, 1), 80, 81],
    [node(0, 0, 1), 7, 4],
    [node(1, 0, 1), 21, 16],
    [node(-1, 0, 1), 7, 6],
    [node(0, 0, -1), 8, 7],
    [node(12), 531441, 524288],
  ])('%o is %s/%s, octave-reduced', (n, num, den) => {
    const reduced = ratioOfNode(n);
    // 80/81 lies below 1/1, so it is raised an octave into [1, 2).
    expect(reduced).toEqual(num < den ? ratio(2 * num, den) : ratio(num, den));
    expect(nodeOfRatio(ratio(num, den))).toEqual(n);
  });

  it('ignores octaves: 3/1, 3/4 and 6/1 are all the ×3 node', () => {
    expect(nodeOfRatio(ratio(3, 1))).toEqual(node(1));
    expect(nodeOfRatio(ratio(3, 4))).toEqual(node(1));
    expect(nodeOfRatio(ratio(6, 1))).toEqual(node(1));
    expect(nodeOfRatio(ratio(2, 1))).toEqual(node(0));
  });

  it('has no node for ratios with primes beyond 7', () => {
    expect(nodeOfRatio(ratio(11, 8))).toBeNull();
    expect(nodeOfRatio(ratio(13, 8))).toBeNull();
  });

  it('round-trips every node in a wide block', () => {
    for (let three = -6; three <= 6; three++)
      for (let five = -3; five <= 3; five++)
        for (let seven = -2; seven <= 2; seven++) {
          const n = node(three, five, seven);
          const r = ratioOfNode(n);
          expect(r.num / r.den).toBeGreaterThanOrEqual(1);
          expect(r.num / r.den).toBeLessThan(2);
          expect(nodeOfRatio(r)).toEqual(n);
        }
  });
});

describe('primeFactors: a ratio as powers of 2, 3, 5 and 7', () => {
  it.each([
    [15, 8, { two: -3, three: 1, five: 1, seven: 0 }],
    [81, 80, { two: -4, three: 4, five: -1, seven: 0 }],
    [7, 4, { two: -2, three: 0, five: 0, seven: 1 }],
    [45, 32, { two: -5, three: 2, five: 1, seven: 0 }],
    [64, 63, { two: 6, three: -2, five: 0, seven: -1 }],
    [1, 1, { two: 0, three: 0, five: 0, seven: 0 }],
  ])('%s/%s', (num, den, factors) => {
    expect(primeFactors(ratio(num, den))).toEqual(factors);
  });

  it('is null beyond the 7-limit', () => {
    expect(primeFactors(ratio(11, 8))).toBeNull();
  });
});

describe('latticeNoteName: the letter name of a node above the Tonic', () => {
  it.each([
    [0, node(0), 'C'],
    [0, node(1), 'G'],
    [0, node(-1), 'F'],
    [0, node(0, 1), 'E'],
    [0, node(1, 1), 'B'],
    [0, node(-1, 1), 'A'],
    [0, node(1, -1), 'E♭'],
    [0, node(0, -1), 'A♭'],
    [0, node(0, 2), 'G♯'],
    [0, node(0, 3), 'B♯'],
    [0, node(-4, 1), 'C'], // the syntonic comma: a lower C
    [0, node(12), 'B♯'], // the Pythagorean comma
    [0, node(0, 0, 1), 'B♭'], // harmonic seventh 7/4
    [2, node(0, 1), 'F♯'], // Tonic D
    [1, node(0, -1), 'B𝄫'], // Tonic D♭: its minor sixth
    [6, node(3, 2), 'A𝄪'], // Tonic F♯: D♯, then thirds F𝄪, A𝄪
    [6, node(3, 3), 'C♯𝄪'], // …and one more third: C triple sharp
    [1, node(-3, -2), 'B𝄫♭'], // Tonic D♭: F♭, then thirds down D𝄫, B triple flat
    [0, node(29), 'G𝄪𝄪'], // four sharps: still written out
    // Long comma pumps pile up accidentals: beyond four they are counted.
    [0, node(36), 'G♯×5'], // three Pythagorean commas above G
    [0, node(-37), 'B♭×6'],
    [0, node(1200), 'A♯×171'], // a hundred Pythagorean commas above A
  ])('Tonic %s, %o → %s', (tonic, n, name) => {
    expect(latticeNoteName(tonic, n)).toBe(name);
  });
});

describe('chordProportion: a chord as whole numbers', () => {
  const r = (num: number, den: number) => ratio(num, den);
  it.each([
    [[r(1, 1), r(5, 4), r(3, 2)], [4, 5, 6]], // major triad
    [[r(1, 1), r(6, 5), r(3, 2)], [10, 12, 15]], // minor triad
    [[r(1, 1), r(5, 4), r(3, 2), r(7, 4)], [4, 5, 6, 7]], // harmonic seventh chord
    [[r(3, 2), r(1, 1), r(5, 4)], [4, 5, 6]], // in any order
    [[r(4, 3), r(5, 3), r(1, 1)], [3, 4, 5]], // F major above the C, voiced as C–F–A
    [[r(5, 4)], [1]],
  ])('%o', (ratios, proportion) => {
    expect(chordProportion(ratios)).toEqual(proportion);
  });
});

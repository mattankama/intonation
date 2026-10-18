import { describe, expect, it } from 'vitest';
import { CHART_TARGETS, EDO_TARGETS, edoApproximations, edoErrorChart, ratio } from './index';

/** Step and error (cents, 3 decimals) for each target, in order 3/2 5/4 6/5 7/4 11/8. */
const byTarget = (n: number) =>
  edoApproximations(n).map((a) => [`${a.target.num}/${a.target.den}`, a.step, Number(a.error.toFixed(3))]);

describe('EDO approximation: the nearest step to each pure interval', () => {
  it('marks 3/2, 5/4, 6/5, 7/4 and 11/8', () => {
    expect(EDO_TARGETS).toEqual([ratio(3, 2), ratio(5, 4), ratio(6, 5), ratio(7, 4), ratio(11, 8)]);
  });

  it('12-EDO: the familiar tempered fifth and thirds, a sharp 7th and an 11/8 at the tritone', () => {
    expect(byTarget(12)).toEqual([
      ['3/2', 7, -1.955],
      ['5/4', 4, 13.686],
      ['6/5', 3, -15.641],
      ['7/4', 10, 31.174],
      ['11/8', 6, 48.682],
    ]);
  });

  it('31-EDO: a major third of 10 steps, 0.8¢ wide', () => {
    expect(byTarget(31)).toEqual([
      ['3/2', 18, -5.181],
      ['5/4', 10, 0.783],
      ['6/5', 8, -5.964],
      ['7/4', 25, -1.084],
      ['11/8', 14, -9.382],
    ]);
  });

  it('19-EDO: a near-pure minor third', () => {
    const [fifth, majorThird, minorThird] = byTarget(19);
    expect(fifth).toEqual(['3/2', 11, -7.218]);
    expect(majorThird).toEqual(['5/4', 6, -7.366]);
    expect(minorThird).toEqual(['6/5', 5, 0.148]);
  });

  it('53-EDO: a fifth within a tenth of a cent', () => {
    const [fifth, majorThird, minorThird] = byTarget(53);
    expect(fifth).toEqual(['3/2', 31, -0.068]);
    expect(majorThird).toEqual(['5/4', 17, -1.408]);
    expect(minorThird).toEqual(['6/5', 14, 1.34]);
  });

  it('measures the error chart on the 5-limit intervals 3/2, 5/4 and 6/5', () => {
    expect(CHART_TARGETS).toEqual([ratio(3, 2), ratio(5, 4), ratio(6, 5)]);
  });

  it('charts every N from 5 to 72 by its largest 5-limit error', () => {
    const chart = edoErrorChart();
    expect(chart.map((p) => p.n)).toEqual(Array.from({ length: 68 }, (_, i) => 5 + i));
    const at = (n: number) => chart.find((p) => p.n === n)!;
    // 12-EDO's worst is its minor third, 15.6¢ narrow; 53-EDO's its major third, 1.4¢ narrow.
    expect(at(12).worst.target).toEqual(ratio(6, 5));
    expect(at(12).worst.error).toBeCloseTo(-15.641, 3);
    expect(at(53).worst.target).toEqual(ratio(5, 4));
    expect(at(53).worst.error).toBeCloseTo(-1.408, 3);
  });

  it('12, 19, 31 and 53 stand out as dips: each beats both neighbours and every smaller N', () => {
    const chart = edoErrorChart();
    const size = (n: number) => Math.abs(chart.find((p) => p.n === n)!.worst.error);
    for (const n of [12, 19, 31, 53]) {
      expect(size(n)).toBeLessThan(size(n - 1));
      expect(size(n)).toBeLessThan(size(n + 1));
      for (let smaller = 5; smaller < n; smaller++) expect(size(n)).toBeLessThan(size(smaller));
    }
  });

  it('gives the step’s size and the pure interval’s size in cents', () => {
    const [fifth] = edoApproximations(31);
    expect(fifth!.stepCents).toBeCloseTo(696.774, 3);
    expect(fifth!.pureCents).toBeCloseTo(701.955, 3);
  });
});

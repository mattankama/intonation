/** An exact fraction num/den in lowest terms, with a positive denominator. */
export interface Ratio {
  readonly num: number;
  readonly den: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

/** Builds an exact ratio from two integers, reduced to lowest terms. */
export function ratio(num: number, den: number): Ratio {
  if (!Number.isInteger(num) || !Number.isInteger(den) || den === 0) {
    throw new RangeError(`ratio needs integers with a non-zero denominator, got ${num}/${den}`);
  }
  const g = gcd(num, den) * Math.sign(den);
  return { num: num / g, den: den / g };
}

/** The value of a ratio as a float; use only for display or sound. */
export function ratioValue(r: Ratio): number {
  return r.num / r.den;
}

/** a + b, exact. */
export function addRatios(a: Ratio, b: Ratio): Ratio {
  return ratio(a.num * b.den + b.num * a.den, a.den * b.den);
}

/** a · b, exact. */
export function multiplyRatios(a: Ratio, b: Ratio): Ratio {
  return ratio(a.num * b.num, a.den * b.den);
}

/** r raised to a whole-number power (negative powers invert), exact. */
export function ratioPower(r: Ratio, exponent: number): Ratio {
  const base = exponent < 0 ? ratio(r.den, r.num) : r;
  return ratio(base.num ** Math.abs(exponent), base.den ** Math.abs(exponent));
}

/** Ratios as the smallest whole numbers in the same proportion, in the same order: 1/1, 5/4, 3/2 → 4, 5, 6. */
export function wholeNumbers(ratios: readonly Ratio[]): number[] {
  const lcm = ratios.reduce((l, r) => (l * r.den) / gcd(l, r.den), 1);
  const whole = ratios.map((r) => (r.num * lcm) / r.den);
  const common = whole.reduce(gcd, 0);
  return whole.map((w) => w / common);
}

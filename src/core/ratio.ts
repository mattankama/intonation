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

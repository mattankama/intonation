/**
 * The just-intonation lattice (issue #30): every 7-limit pure ratio, octaves ignored, is a
 * point 3^a · 5^b · 7^c; its exponents (a, b, c) are its place on the lattice, with ×3
 * (fifths), ×5 (major thirds) and ×7 (harmonic sevenths) as the three directions.
 */
import { type Ratio, ratio, wholeNumbers } from './ratio';
import { fifthsOfTonic, spellFifths } from './tuning';

/** A point on the lattice: the exponents of 3, 5 and 7 (octaves ignored). */
export interface LatticeNode {
  readonly three: number;
  readonly five: number;
  readonly seven: number;
}

/** The exponents of every prime in a 7-limit ratio, 2 included: r = 2^two · 3^three · 5^five · 7^seven. */
export interface PrimeFactors extends LatticeNode {
  readonly two: number;
}

/** How many times `prime` divides n, and what is left. */
function strip(n: number, prime: number): [count: number, rest: number] {
  let count = 0;
  let rest = n;
  while (rest % prime === 0) {
    rest /= prime;
    count++;
  }
  return [count, rest];
}

/** The ratio's exponents of 2, 3, 5 and 7, or null if it has any larger prime (it is not 7-limit). */
export function primeFactors(r: Ratio): PrimeFactors | null {
  let num = r.num;
  let den = r.den;
  const exponent = (prime: number) => {
    const [up, numRest] = strip(num, prime);
    const [down, denRest] = strip(den, prime);
    num = numRest;
    den = denRest;
    return up - down;
  };
  const factors = { two: exponent(2), three: exponent(3), five: exponent(5), seven: exponent(7) };
  return num === 1 && den === 1 ? factors : null;
}

/** The same interval moved by octaves into [1/1, 2/1). */
export function octaveReduce(r: Ratio): Ratio {
  const [, num] = strip(r.num, 2);
  const [, den] = strip(r.den, 2);
  let n = num;
  let d = den;
  while (n >= 2 * d) d *= 2;
  while (n < d) n *= 2;
  return ratio(n, d);
}

/** The node of a 7-limit ratio (octaves ignored), or null for a ratio with a prime above 7. */
export function nodeOfRatio(r: Ratio): LatticeNode | null {
  const factors = primeFactors(r);
  if (!factors) return null;
  const { three, five, seven } = factors;
  return { three, five, seven };
}

/** The ratio of a node, octave-reduced into [1/1, 2/1): (1, 1, 0) is 15/8. */
export function ratioOfNode(node: LatticeNode): Ratio {
  let num = 1;
  let den = 1;
  for (const [prime, exponent] of [
    [3, node.three],
    [5, node.five],
    [7, node.seven],
  ] as const) {
    if (exponent > 0) num *= prime ** exponent;
    else den *= prime ** -exponent;
  }
  return octaveReduce(ratio(num, den));
}

/**
 * Fifths (letter-name steps) each direction moves: ×3 is a fifth up, ×5 a major third
 * (four fifths up, C → E) and ×7 a harmonic seventh, named as a minor seventh (C → B♭).
 */
const FIFTHS_PER_STEP = { three: 1, five: 4, seven: -2 } as const;

/**
 * The letter name of a node above the Tonic, e.g. "E" for 5/4 above C. Nodes a comma apart
 * share a name (81/80 above C is "C"): that is where the lattice shows its commas.
 */
export function latticeNoteName(tonic: number, node: LatticeNode): string {
  const fifths =
    node.three * FIFTHS_PER_STEP.three + node.five * FIFTHS_PER_STEP.five + node.seven * FIFTHS_PER_STEP.seven;
  return spellFifths(fifthsOfTonic(tonic) + fifths);
}

/**
 * A chord's notes as the smallest whole numbers in the same proportion, lowest first:
 * 1/1, 5/4, 3/2 → 4:5:6.
 */
export function chordProportion(notes: readonly Ratio[]): number[] {
  return wholeNumbers([...notes].sort((x, y) => x.num * y.den - y.num * x.den));
}

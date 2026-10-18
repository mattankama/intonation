/**
 * The 12-note tuning systems (decisions #3 and #9).
 *
 * Every historical system here is a chain of 12 notes joined by 11 fifths. Each fifth is a
 * pure 3/2 narrowed by an exact fraction of one comma, so a note's pitch is its Pythagorean
 * ratio (the same number of pure fifths) adjusted by the commas met on the way from the
 * Tonic. The 12th fifth, closing the circle, is whatever is left over: the wolf in
 * Pythagorean and meantone. Changing the Tonic slides the whole chain along the circle
 * of fifths, so the pattern, the wolf and the spellings all move with it.
 */
import { cents } from './cents';
import { type Note, REFERENCE_NOTE, semitonesFromA4 } from './pitch';
import { type Ratio, addRatios, multiplyRatios, ratio, ratioPower, ratioValue } from './ratio';

/** The historical 12-note systems, each a chain of fifths. */
export type ChainSystemId =
  | 'pythagorean'
  | 'meantone'
  | 'werckmeister-iii'
  | 'vallotti'
  | 'kirnberger-iii'
  | 'just';

/** Every tuning system the shared settings offer. */
export type TuningSystemId = '12-edo' | ChainSystemId;

/** The tuning systems in menu order (the spec's order). */
export const TUNING_SYSTEM_IDS: readonly TuningSystemId[] = [
  '12-edo',
  'pythagorean',
  'just',
  'meantone',
  'werckmeister-iii',
  'vallotti',
  'kirnberger-iii',
];

/** Whether a tuning system is an EDO, where the Tonic makes no difference. */
export const isEdo = (system: TuningSystemId): boolean => system === '12-edo';

/** A tuning system and the Tonic it is built from (pitch class, 0 = C). */
export interface Tuning {
  readonly system: TuningSystemId;
  readonly tonic: number;
}

export type CommaId = 'pythagorean' | 'syntonic';

const COMMAS: Record<CommaId, Ratio> = {
  pythagorean: ratio(531441, 524288),
  syntonic: ratio(81, 80),
};

/** A comma's exact ratio: Pythagorean 531441/524288, syntonic 81/80. */
export const commaRatio = (comma: CommaId): Ratio => COMMAS[comma];

interface ChainSystem {
  /** The comma the fifths are narrowed by. */
  readonly comma: CommaId;
  /** Fifths from the Tonic to the first note of the chain (−3 = E♭ when the Tonic is C). */
  readonly start: number;
  /**
   * The fifths of the chain that are narrowed, keyed by the fifths-position of their lower
   * note (0 = the fifth Tonic–dominant, C–G), each as the fraction of the comma it loses.
   * Every other fifth in the chain is pure.
   */
  readonly narrowed: Readonly<Record<number, Ratio>>;
  /** Whether the fifth that closes the circle is a wolf (decision #3). */
  readonly wolf: boolean;
}

/** The same fraction for every fifth of a chain starting at `start`. */
function everyFifth(start: number, fraction: Ratio): Record<number, Ratio> {
  return Object.fromEntries(Array.from({ length: 11 }, (_, i) => [start + i, fraction]));
}
/** The same fraction for the fifths whose lower notes are at these positions. */
function fifthsAt(positions: number[], fraction: Ratio): Record<number, Ratio> {
  return Object.fromEntries(positions.map((k) => [k, fraction]));
}

const QUARTER = ratio(1, 4);

const CHAIN_SYSTEMS: Record<ChainSystemId, ChainSystem> = {
  // E♭…G♯, every fifth pure; the wolf G♯–E♭ is a Pythagorean comma narrow.
  pythagorean: { comma: 'pythagorean', start: -3, narrowed: {}, wolf: true },
  // E♭…G♯, every fifth narrowed by ¼ syntonic comma so C–E is a pure 5/4.
  meantone: { comma: 'syntonic', start: -3, narrowed: everyFifth(-3, QUARTER), wolf: true },
  // G♭…B: C–G, G–D, D–A narrowed by ¼ Pythagorean comma; what is left for the closing
  // B–G♭ is the same ¼ comma, so there is no wolf.
  'werckmeister-iii': {
    comma: 'pythagorean',
    start: -6,
    narrowed: fifthsAt([0, 1, 2], QUARTER),
    wolf: false,
  },
  // E♭…G♯: F–C–G–D–A–E–B narrowed by 1/6 Pythagorean comma, the rest pure (no wolf).
  vallotti: {
    comma: 'pythagorean',
    start: -3,
    narrowed: fifthsAt([-1, 0, 1, 2, 3, 4], ratio(1, 6)),
    wolf: false,
  },
  // D♭…F♯: C–G–D–A–E narrowed by ¼ syntonic comma (C–E pure); the closing F♯–D♭ is a
  // schisma narrow.
  'kirnberger-iii': {
    comma: 'syntonic',
    start: -5,
    narrowed: fifthsAt([0, 1, 2, 3], QUARTER),
    wolf: false,
  },
  // D♭…F♯: B♭–F and D–A are a whole syntonic comma narrow (40/27), which turns the
  // Pythagorean thirds into pure ones; the closing F♯–D♭ is 1024/675, far too wide.
  just: { comma: 'syntonic', start: -5, narrowed: fifthsAt([-2, 2], ratio(1, 1)), wolf: true },
};

const PURE_FIFTH_CENTS = cents(ratio(3, 2));
const commaCents = (system: ChainSystem) => cents(COMMAS[system.comma]);

/** Fifths above the Tonic (within the system's chain) of the key a pitch class above it. */
function chainPosition(system: ChainSystem, interval: number): number {
  for (let k = system.start; k < system.start + 12; k++) {
    if (mod(7 * k, 12) === interval) return k;
  }
  throw new RangeError(`no key ${interval} semitones above the Tonic`);
}

/**
 * The exact fraction of the comma by which the key k fifths from the Tonic sits below the
 * Pythagorean note k pure fifths away: up the chain each narrowed fifth lowers it, down the
 * chain each one raises it (a negative fraction).
 */
function commaFraction(system: ChainSystem, k: number): Ratio {
  let total = ratio(0, 1);
  for (let i = Math.min(0, k); i < Math.max(0, k); i++) {
    const n = system.narrowed[i];
    if (n) total = addRatios(total, n);
  }
  return k >= 0 ? total : ratio(-total.num, total.den);
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** An element of a fixed table; the index is always in range by construction. */
function at<T>(table: readonly T[], index: number): T {
  const value = table[index];
  if (value === undefined) throw new RangeError(`index ${index} is outside the table`);
  return value;
}

/** Semitones from the Tonic up to a key, 0–11. */
const intervalAboveTonic = (tuning: Tuning, pitchClass: number) => mod(pitchClass - tuning.tonic, 12);

/**
 * How far a key is from its 12-EDO counterpart, both measured from the Tonic, in cents
 * (e.g. +13.685 for the Pythagorean C♯ in C). Built from the chain, so it never wraps.
 */
function deviationFromEdo12(tuning: Tuning, pitchClass: number): number {
  if (tuning.system === '12-edo') return 0;
  const system = CHAIN_SYSTEMS[tuning.system];
  const k = chainPosition(system, intervalAboveTonic(tuning, pitchClass));
  return k * (PURE_FIFTH_CENTS - 700) - ratioValue(commaFraction(system, k)) * commaCents(system);
}

/** Cents of a key above the Tonic, from 0 up to (not including) 1200. */
export function centsAboveTonic(tuning: Tuning, pitchClass: number): number {
  return 100 * intervalAboveTonic(tuning, pitchClass) + deviationFromEdo12(tuning, pitchClass);
}

/** A note resolved to sound: its frequency and where it sits. */
export interface ResolvedPitch {
  readonly frequency: number;
  /** Cents of its key above the Tonic, 0–1200. */
  readonly centsAboveTonic: number;
  /** Signed cents from A4, which sounds at the Reference pitch. */
  readonly centsFromA4: number;
}

/**
 * The frequency of a note in a tuning system. A4 always sounds at the Reference pitch;
 * every other note sits at its own cents from A4 in the system: f = f_A4 · 2^(c/1200).
 */
export function resolvePitch(tuning: Tuning, note: Note, referencePitchHz: number): ResolvedPitch {
  const centsFromA4 =
    100 * semitonesFromA4(note) +
    deviationFromEdo12(tuning, note.pitchClass) -
    deviationFromEdo12(tuning, REFERENCE_NOTE.pitchClass);
  return {
    frequency: referencePitchHz * 2 ** (centsFromA4 / 1200),
    centsAboveTonic: centsAboveTonic(tuning, note.pitchClass),
    centsFromA4,
  };
}

/** The size in cents of the chain's fifth whose lower note is k fifths above the Tonic. */
function fifthCents(system: ChainSystem, k: number): number {
  const n = system.narrowed[k];
  return PURE_FIFTH_CENTS - (n ? ratioValue(n) * commaCents(system) : 0);
}

/** Letter names in fifths order: position −1 is F, 0 is C, 1 is G. */
const FIFTHS_LETTERS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
/** Accidentals from two flats to two sharps, indexed by sharps + 2. */
const ACCIDENTALS = ['𝄫', '♭', '', '♯', '𝄪'];

/** Pitch classes of the natural notes in fifths order: F, C, G, D, A, E, B. */
const FIFTHS_NATURALS = [5, 0, 7, 2, 9, 4, 11];

/** The letter (as an index into fifths order) and the sharps (+) or flats (−) of a position. */
function letterAndAccidental(position: number) {
  return { letter: mod(position + 1, 7), accidental: Math.floor((position + 1) / 7) };
}

/** The spelling of the note a number of fifths above C (−3 → E♭, 8 → G♯). */
function spellFifths(position: number): string {
  const { letter, accidental } = letterAndAccidental(position);
  return at(FIFTHS_LETTERS, letter) + at(ACCIDENTALS, accidental + 2);
}

/**
 * Fifths above C of each Tonic, spelled as in its major key signature: D♭ (5 flats)
 * rather than C♯ (7 sharps), F♯ rather than G♭. Indexed by pitch class.
 */
const TONIC_FIFTHS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];
const tonicFifths = (tuning: Tuning) => at(TONIC_FIFTHS, mod(tuning.tonic, 12));

/** The name of a Tonic, e.g. "D♭" for pitch class 1. */
export function tonicSpelling(pitchClass: number): string {
  return spellFifths(at(TONIC_FIFTHS, mod(pitchClass, 12)));
}

/** Fifths above C of the familiar 12-EDO spellings, by pitch class. */
const FAMILIAR_FIFTHS = [0, 7, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];

/** Fifths above C of the spelling a tuning system gives a key. */
function keyFifths(tuning: Tuning, pitchClass: number): number {
  if (tuning.system === '12-edo') return at(FAMILIAR_FIFTHS, mod(pitchClass, 12));
  const system = CHAIN_SYSTEMS[tuning.system];
  return tonicFifths(tuning) + chainPosition(system, intervalAboveTonic(tuning, pitchClass));
}

/** The historical spelling of a key in a tuning system, e.g. "G♯" or "A♭". */
export function keySpelling(tuning: Tuning, pitchClass: number): string {
  return spellFifths(keyFifths(tuning, pitchClass));
}

/**
 * A note's name in its tuning system with its octave, e.g. "G♯4". The octave number goes
 * with the letter, so the key above B4 spelled B♯ is "B♯4", not "B♯5".
 */
export function noteName(tuning: Tuning, note: Note): string {
  const position = keyFifths(tuning, note.pitchClass);
  const { letter, accidental } = letterAndAccidental(position);
  const natural = at(FIFTHS_NATURALS, letter);
  const octaveShift = Math.round((natural + accidental - note.pitchClass) / 12);
  return `${spellFifths(position)}${note.octave - octaveShift}`;
}

/** The 12 keys of a 12-note tuning system in fifths order, and the fifth that closes the circle. */
export interface ChainOfFifths {
  /** Spellings from the lowest to the highest in fifths, e.g. E♭ … G♯. */
  readonly notes: readonly string[];
  /** From the last note of the chain up to the first, e.g. G♯–E♭. */
  readonly closingFifth: { readonly from: string; readonly to: string; readonly cents: number };
  /** Whether that closing fifth is a wolf. */
  readonly wolf: boolean;
}

/** How a 12-note system is built from its Tonic; null for an EDO, which has no chain. */
export function chainOfFifths(tuning: Tuning): ChainOfFifths | null {
  if (tuning.system === '12-edo') return null;
  const system = CHAIN_SYSTEMS[tuning.system];
  const positions = Array.from({ length: 12 }, (_, i) => system.start + i);
  const notes = positions.map((k) => spellFifths(tonicFifths(tuning) + k));
  // Twelve fifths make seven octaves, so the closing fifth is whatever the other 11 leave.
  const chainCents = positions.slice(0, 11).reduce((sum, k) => sum + fifthCents(system, k), 0);
  return {
    notes,
    closingFifth: { from: at(notes, 11), to: at(notes, 0), cents: 7 * 1200 - chainCents },
    wolf: system.wolf,
  };
}

/** The exact ratio of k pure fifths, brought into the octave above the Tonic (7 → 2187/2048). */
function pythagoreanRatio(k: number): Ratio {
  const fifths = ratioPower(ratio(3, 2), k);
  const octaves = Math.floor(Math.log2(ratioValue(fifths)));
  return multiplyRatios(fifths, ratioPower(ratio(2, 1), -octaves));
}

/** How a key of a 12-note system is built from its Tonic, for The math. */
export interface KeyConstruction {
  readonly spelling: string;
  /** Fifths from the Tonic along the chain (negative = below, e.g. −1 for F in C). */
  readonly fifths: number;
  /** The same number of pure fifths, as an exact ratio within the octave. */
  readonly pythagorean: Ratio;
  readonly comma: CommaId;
  /** How much of the comma the key sits below that Pythagorean note (negative = above). */
  readonly commaFraction: Ratio;
  /** The key's exact ratio to the Tonic, or null when a fraction of a comma makes it irrational. */
  readonly ratio: Ratio | null;
  /** Cents above the Tonic. */
  readonly cents: number;
}

/** The construction of a key; null for 12-EDO, which is not built from fifths. */
export function keyConstruction(tuning: Tuning, pitchClass: number): KeyConstruction | null {
  if (tuning.system === '12-edo') return null;
  const system = CHAIN_SYSTEMS[tuning.system];
  const k = chainPosition(system, intervalAboveTonic(tuning, pitchClass));
  const pythagorean = pythagoreanRatio(k);
  const fraction = commaFraction(system, k);
  const exact =
    fraction.den === 1
      ? multiplyRatios(pythagorean, ratioPower(COMMAS[system.comma], -fraction.num))
      : null;
  return {
    spelling: keySpelling(tuning, pitchClass),
    fifths: k,
    pythagorean,
    comma: system.comma,
    commaFraction: fraction,
    ratio: exact,
    cents: centsAboveTonic(tuning, pitchClass),
  };
}

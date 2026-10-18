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

/** An equal division of the octave into N steps, e.g. '31-edo'; '12-edo' is standard 12-EDO. */
export type EdoId = `${number}-edo`;

/** Every tuning system the shared settings offer: the chains, and N-EDO for N = 5…72. */
export type TuningSystemId = EdoId | ChainSystemId;

/** The N-EDOs offered (decision #8). */
export const EDO_MIN = 5;
export const EDO_MAX = 72;

/** The N-EDO tuning system. */
export const edoSystem = (n: number): EdoId => `${n}-edo`;

/** The named tuning systems in menu order (the spec's order); any other N-EDO joins them. */
export const TUNING_SYSTEM_IDS = [
  '12-edo',
  'pythagorean',
  'just',
  'meantone',
  'werckmeister-iii',
  'vallotti',
  'kirnberger-iii',
] as const satisfies readonly TuningSystemId[];

/** A tuning system with a name of its own: 12-EDO and the historical chains. */
export type NamedTuningSystemId = (typeof TUNING_SYSTEM_IDS)[number];

/** Whether a tuning system is an EDO, where the Tonic makes no difference. */
export const isEdo = (system: TuningSystemId): system is EdoId => system.endsWith('-edo');

/** The number of steps per octave of an EDO (31 for 31-EDO); null for a 12-note chain. */
export function edoDivisions(system: TuningSystemId): number | null {
  return isEdo(system) ? Number(system.slice(0, -'-edo'.length)) : null;
}

/**
 * The N of an N-EDO other than 12-EDO, whose keys are steps rather than the 12 familiar
 * notes; null for 12-EDO and the 12-note chains, whose keys are pitch classes.
 */
export function stepEdo(system: TuningSystemId): number | null {
  const n = edoDivisions(system);
  return n === 12 ? null : n;
}

/**
 * A tuning system from its id, e.g. 'meantone' or '31-edo' (N from 5 to 72, written
 * without leading zeros); undefined for anything else.
 */
export function parseTuningSystem(raw: string): TuningSystemId | undefined {
  const named = TUNING_SYSTEM_IDS.find((id) => id === raw);
  if (named) return named;
  const match = /^([1-9]\d*)-edo$/.exec(raw);
  const n = match ? Number(match[1]) : NaN;
  return n >= EDO_MIN && n <= EDO_MAX ? edoSystem(n) : undefined;
}

/**
 * The step of an N-EDO that A sits on, counting from step 0, the step nearest C. A4 is
 * always a step (decision #8), so the steps are laid out from it: C is the step nearest
 * 900¢ below A (a tie goes to the higher step).
 */
const edoStepOfA = (n: number) => -Math.round((-9 * n) / 12);

/**
 * The steps nearest the 12 familiar notes C, C♯ … B (indexed by pitch class), counted from
 * step 0 of the octave; B can land on N, the next octave's step 0. Nearness is to each
 * note's 12-EDO pitch with A on its step; several notes can share a step in a small EDO.
 */
export function edoLandmarks(n: number): readonly number[] {
  const a = edoStepOfA(n);
  return Array.from({ length: 12 }, (_, pc) => a + Math.round(((pc - 9) * n) / 12));
}

/** Signed steps of an N-EDO note from A4 (pitchClass holds the step within the octave). */
export const edoStepsFromA4 = (n: number, note: Note): number =>
  (note.octave - REFERENCE_NOTE.octave) * n + note.pitchClass - edoStepOfA(n);

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

const isChain = (system: TuningSystemId): system is ChainSystemId => system in CHAIN_SYSTEMS;

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
  if (!isChain(tuning.system)) return 0;
  const system = CHAIN_SYSTEMS[tuning.system];
  const k = chainPosition(system, intervalAboveTonic(tuning, pitchClass));
  return k * (PURE_FIFTH_CENTS - 700) - ratioValue(commaFraction(system, k)) * commaCents(system);
}

/**
 * Cents of a key above the Tonic, from 0 up to (not including) 1200. In an N-EDO other
 * than 12-EDO the key is a step, measured from step 0 (the Tonic makes no difference).
 */
export function centsAboveTonic(tuning: Tuning, pitchClass: number): number {
  const n = stepEdo(tuning.system);
  if (n !== null) return (1200 * mod(pitchClass, n)) / n;
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
  const n = stepEdo(tuning.system);
  if (n !== null) {
    const centsFromA4 = (1200 * edoStepsFromA4(n, note)) / n;
    return {
      frequency: referencePitchHz * 2 ** (centsFromA4 / 1200),
      centsAboveTonic: centsAboveTonic(tuning, note.pitchClass),
      centsFromA4,
    };
  }
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
  if (!isChain(tuning.system)) return at(FAMILIAR_FIFTHS, mod(pitchClass, 12));
  const system = CHAIN_SYSTEMS[tuning.system];
  return tonicFifths(tuning) + chainPosition(system, intervalAboveTonic(tuning, pitchClass));
}

/** An N-EDO key, named by its step (decision #8): "step 10 of 31". */
const stepName = (n: number, step: number) => `step ${mod(step, n)} of ${n}`;

/**
 * The historical spelling of a key in a tuning system, e.g. "G♯" or "A♭". Letter names
 * belong to 12-EDO and the 12-note systems; any other N-EDO names the step, "step 10 of 31".
 */
export function keySpelling(tuning: Tuning, pitchClass: number): string {
  const n = stepEdo(tuning.system);
  if (n !== null) return stepName(n, pitchClass);
  return spellFifths(keyFifths(tuning, pitchClass));
}

/**
 * A note's name in its tuning system with its octave, e.g. "G♯4". The octave number goes
 * with the letter, so the key above B4 spelled B♯ is "B♯4", not "B♯5". An N-EDO note is
 * its step and octave, "step 10 of 31, octave 4" (octave 4 starts at the step nearest C4).
 */
export function noteName(tuning: Tuning, note: Note): string {
  const n = stepEdo(tuning.system);
  if (n !== null) return `${stepName(n, note.pitchClass)}, octave ${note.octave}`;
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
  if (!isChain(tuning.system)) return null;
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

/** The construction of a key; null for an EDO, which is not built from fifths. */
export function keyConstruction(tuning: Tuning, pitchClass: number): KeyConstruction | null {
  if (!isChain(tuning.system)) return null;
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

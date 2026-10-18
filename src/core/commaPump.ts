/**
 * Comma pumps (issue #31, decision #11): a progression of pure chords, each holding the
 * note it shares with the previous chord, that comes home shifted by a comma.
 *
 * Pitches are kept as exact prime exponents above the starting Tonic (PrimeFactors:
 * 2^two · 3^three · 5^five · 7^seven), so loops can repeat without the fractions
 * outgrowing exact arithmetic.
 */
import { cents } from './cents';
import { CHORD_INTERVALS, type ChordIntervalId, type ChordType, type PureChordChoice, chordTones } from './chord';
import { nearestPureInterval } from './interval';
import { type LatticeNode, type PrimeFactors, primeFactors } from './lattice';
import { type Ratio, ratio } from './ratio';

export const COMMA_PUMP_IDS = ['syntonic', 'pythagorean', 'lesser-diesis', 'greater-diesis', 'septimal'] as const;
export type CommaPumpId = (typeof COMMA_PUMP_IDS)[number];

/** One chord of a pump: its root as fifths above the starting Tonic (its spelling), and its type. */
export interface PumpChord {
  readonly root: number;
  readonly type: ChordType;
  readonly pure: PureChordChoice;
}

const pumpChord = (root: number, type: ChordType = 'major', pure: PureChordChoice = '5-limit'): PumpChord => ({
  root,
  type,
  pure,
});
const range = (count: number, step: number) => Array.from({ length: count }, (_, i) => i * step);

/** Each pump's chords, from the starting chord to the chord that comes home (the same chord, a comma off). */
const PUMPS: Record<CommaPumpId, readonly PumpChord[]> = {
  // I–vi–ii–V–I: C–Am–Dm–G–C.
  syntonic: [pumpChord(0), pumpChord(3, 'minor'), pumpChord(2, 'minor'), pumpChord(1), pumpChord(0)],
  // Twelve major chords up by fifths: C–G–D–…–B♯.
  pythagorean: range(13, 1).map((root) => pumpChord(root)),
  // Major chords up by major thirds: C–E–G♯–B♯.
  'lesser-diesis': range(4, 4).map((root) => pumpChord(root)),
  // Minor chords up by minor thirds: Cm–E♭m–G♭m–B𝄫m–D𝄫m.
  'greater-diesis': range(5, -3).map((root) => pumpChord(root, 'minor')),
  // I–IV–V7–I with the harmonic seventh: C–F–G7–C.
  septimal: [pumpChord(0), pumpChord(-1), pumpChord(1, 'dominant-7th', 'alternative'), pumpChord(0)],
};

/** The pump's chords, starting chord first and the chord that comes home last. */
export const commaPumpChords = (id: CommaPumpId): readonly PumpChord[] => PUMPS[id];

/** Chords stepped through in one loop (the home chord starts the next loop). */
export const commaPumpLength = (id: CommaPumpId): number => PUMPS[id].length - 1;

// --- Exact pitches as prime exponents -------------------------------------------------------

const UNISON: PrimeFactors = { two: 0, three: 0, five: 0, seven: 0 };

const combine = (a: PrimeFactors, b: PrimeFactors, k: number): PrimeFactors => ({
  two: a.two + k * b.two,
  three: a.three + k * b.three,
  five: a.five + k * b.five,
  seven: a.seven + k * b.seven,
});

const factorsOf = (r: Ratio): PrimeFactors => primeFactors(r)!;

const PRIME_CENTS = { three: cents(ratio(3, 1)), five: cents(ratio(5, 1)), seven: cents(ratio(7, 1)) };

/** The size in cents of the pitch 2^two · 3^three · 5^five · 7^seven. */
export function factorsCents(f: PrimeFactors): number {
  return 1200 * f.two + PRIME_CENTS.three * f.three + PRIME_CENTS.five * f.five + PRIME_CENTS.seven * f.seven;
}

/** The pitch moved by whole octaves into [1/1, 2/1). */
export function octaveReduceFactors(f: PrimeFactors): PrimeFactors {
  return { ...f, two: f.two - Math.floor(factorsCents(f) / 1200) };
}

/** The pitch's place on the lattice (octaves ignored). */
export const nodeOfFactors = (f: PrimeFactors): LatticeNode => ({ three: f.three, five: f.five, seven: f.seven });

/** The pitch as an exact fraction, in BigInts so that long pumps never lose a digit. */
export function factorsFraction(f: PrimeFactors): { num: bigint; den: bigint } {
  let num = 1n;
  let den = 1n;
  for (const [prime, exponent] of [
    [2n, f.two],
    [3n, f.three],
    [5n, f.five],
    [7n, f.seven],
  ] as const) {
    if (exponent > 0) num *= prime ** BigInt(exponent);
    else den *= prime ** BigInt(-exponent);
  }
  return { num, den };
}

// --- Stepping ---------------------------------------------------------------------------------

/** Letter-name class of a pitch: its fifths above the Tonic, mod 12 (B♯ and C are one note). */
const noteClass = (f: PrimeFactors) => mod(f.three + 4 * f.five - 2 * f.seven, 12);
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Chord notes sound within one octave from 300¢ below the Tonic: a chord changes inversion, never register. */
const VOICING_FLOOR = -300;

const intoVoicing = (f: PrimeFactors): PrimeFactors => ({
  ...f,
  two: f.two - Math.floor((factorsCents(f) - VOICING_FLOOR) / 1200),
});

export interface PumpNote {
  readonly interval: ChordIntervalId;
  /** Its exact pitch above the starting Tonic. */
  readonly pitch: PrimeFactors;
}

/** A pump chord tuned pure. */
export interface TunedPumpChord {
  readonly chord: PumpChord;
  /** The root's pitch (octave not voiced): its node is the root's place on the lattice. */
  readonly root: PrimeFactors;
  /** Lowest first. */
  readonly notes: readonly PumpNote[];
  /** The note kept at its exact pitch from the previous chord, or null (first chord, or none shared). */
  readonly held: PumpNote | null;
}

/**
 * The next chord of a pump, tuned pure: positioned so the note it shares with the previous
 * chord keeps its exact pitch (the first shared note, root first, if there are several);
 * with no shared note its root moves by the simplest pure interval. The first chord is
 * built on 1/1.
 */
export function tunePumpChord(previous: TunedPumpChord | null, next: PumpChord): TunedPumpChord {
  const intervals = chordTones({ root: 0, type: next.type, inversion: 0, pure: next.pure }).map((t) => t.interval);
  let root = UNISON;
  let heldInterval: ChordIntervalId | null = null;
  if (previous) {
    const shared = intervals
      .map((interval) => ({
        interval,
        note: previous.notes.find((n) => noteClass(n.pitch) === mod(next.root + CHORD_INTERVALS[interval].fifths, 12)),
      }))
      .find((s) => s.note);
    if (shared?.note) {
      heldInterval = shared.interval;
      root = combine(shared.note.pitch, factorsOf(CHORD_INTERVALS[shared.interval].ratio), -1);
    } else {
      const semitones = mod(7 * (next.root - previous.chord.root), 12);
      root = combine(previous.root, factorsOf(nearestPureInterval(100 * semitones)), 1);
    }
  }
  const notes = intervals
    .map((interval) => ({ interval, pitch: intoVoicing(combine(root, factorsOf(CHORD_INTERVALS[interval].ratio), 1)) }))
    .sort((a, b) => factorsCents(a.pitch) - factorsCents(b.pitch));
  return { chord: next, root, notes, held: notes.find((n) => n.interval === heldInterval) ?? null };
}

/** One step of a pump run: which loop it is in and where in the loop. */
export interface PumpStep extends TunedPumpChord {
  readonly step: number;
  /** Loops completed: the drift so far is the comma times this. */
  readonly loop: number;
  /** 0 = the home chord, at the start of each loop. */
  readonly position: number;
}

/** Steps 0 … `steps` of the pump: loops repeat from home, each one a comma further off. */
export function runCommaPump(id: CommaPumpId, steps: number): PumpStep[] {
  const length = commaPumpLength(id);
  const run: PumpStep[] = [];
  let previous: TunedPumpChord | null = null;
  for (let step = 0; step <= steps; step++) {
    const position = step % length;
    const tuned = tunePumpChord(previous, PUMPS[id][position === 0 && step > 0 ? length : position]!);
    run.push({ ...tuned, step, loop: Math.floor(step / length), position });
    previous = tuned;
  }
  return run;
}

/** The comma of one loop: where home's root lands, as an interval within ±600¢ of 1/1. */
export function commaPumpComma(id: CommaPumpId): PrimeFactors {
  const home = runCommaPump(id, commaPumpLength(id)).at(-1)!.root;
  return { ...home, two: home.two - Math.round(factorsCents(home) / 1200) };
}

/** The drift after `loops` loops: the comma that many times over. */
export const commaPumpDrift = (id: CommaPumpId, loops: number): PrimeFactors =>
  combine(UNISON, commaPumpComma(id), loops);

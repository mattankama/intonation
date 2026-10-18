/**
 * Chords (decisions #7 Pure chord ratios, #9 Note spelling, #8 Notes in EDOs).
 *
 * A chord is a Root (pitch class), one of nine types and an inversion. Its pure chord
 * stacks 5-limit pure thirds in the order the name implies; two types offer an
 * alternative pure chord. A tuning system plays the chord on its own keys, from its
 * Tonic, never retuned to the Root; the pure chord is anchored on the root that system
 * produces, so the root always reads 0¢ off pure.
 */
import { CENTS_PER_OCTAVE } from './cents';
import type { Note } from './pitch';
import { type Ratio, multiplyRatios, ratio, ratioValue, wholeNumbers } from './ratio';
import {
  type Tuning,
  edoLandmarks,
  isChain,
  keyFifths,
  keySpelling,
  noteName,
  resolvePitch,
  spellFifths,
  stepEdo,
} from './tuning';

/** The intervals a chord is built from, above its root. */
export type ChordIntervalId =
  | 'unison'
  | 'major-second'
  | 'minor-third'
  | 'major-third'
  | 'fourth'
  | 'diminished-fifth'
  | 'septimal-tritone'
  | 'fifth'
  | 'augmented-fifth'
  | 'harmonic-seventh'
  | 'minor-seventh'
  | 'major-seventh';

interface ChordInterval {
  /** The pure interval above the root. */
  readonly ratio: Ratio;
  /** Its key in a 12-note system: semitones above the root's key. */
  readonly semitones: number;
  /** Its spelling, as fifths above the root's spelling (major third = 4 fifths up: C–E). */
  readonly fifths: number;
}

export const CHORD_INTERVALS: Readonly<Record<ChordIntervalId, ChordInterval>> = {
  unison: { ratio: ratio(1, 1), semitones: 0, fifths: 0 },
  'major-second': { ratio: ratio(9, 8), semitones: 2, fifths: 2 },
  'minor-third': { ratio: ratio(6, 5), semitones: 3, fifths: -3 },
  'major-third': { ratio: ratio(5, 4), semitones: 4, fifths: 4 },
  fourth: { ratio: ratio(4, 3), semitones: 5, fifths: -1 },
  'diminished-fifth': { ratio: ratio(36, 25), semitones: 6, fifths: -6 },
  'septimal-tritone': { ratio: ratio(7, 5), semitones: 6, fifths: -6 },
  fifth: { ratio: ratio(3, 2), semitones: 7, fifths: 1 },
  'augmented-fifth': { ratio: ratio(25, 16), semitones: 8, fifths: 8 },
  'harmonic-seventh': { ratio: ratio(7, 4), semitones: 10, fifths: -2 },
  'minor-seventh': { ratio: ratio(9, 5), semitones: 10, fifths: -2 },
  'major-seventh': { ratio: ratio(15, 8), semitones: 11, fifths: 5 },
};

/** The nine chord types, in menu order. */
export const CHORD_TYPES = [
  'major',
  'minor',
  'diminished',
  'augmented',
  'dominant-7th',
  'major-7th',
  'minor-7th',
  'sus2',
  'sus4',
] as const;
export type ChordType = (typeof CHORD_TYPES)[number];

/** Which pure chord a chord is measured against: the 5-limit default or the alternative. */
export type PureChordChoice = '5-limit' | 'alternative';

/** Each type's intervals in root position: the 5-limit chord, and the alternative if any. */
const CHORD_SHAPES: Record<
  ChordType,
  { pure: readonly ChordIntervalId[]; alternative?: readonly ChordIntervalId[] }
> = {
  major: { pure: ['unison', 'major-third', 'fifth'] },
  minor: { pure: ['unison', 'minor-third', 'fifth'] },
  diminished: {
    pure: ['unison', 'minor-third', 'diminished-fifth'],
    alternative: ['unison', 'minor-third', 'septimal-tritone'],
  },
  augmented: { pure: ['unison', 'major-third', 'augmented-fifth'] },
  'dominant-7th': {
    pure: ['unison', 'major-third', 'fifth', 'minor-seventh'],
    alternative: ['unison', 'major-third', 'fifth', 'harmonic-seventh'],
  },
  'major-7th': { pure: ['unison', 'major-third', 'fifth', 'major-seventh'] },
  'minor-7th': { pure: ['unison', 'minor-third', 'fifth', 'minor-seventh'] },
  sus2: { pure: ['unison', 'major-second', 'fifth'] },
  sus4: { pure: ['unison', 'fourth', 'fifth'] },
};

/** A chord to play: its Root (pitch class, 0 = C), type, inversion and pure chord. */
export interface ChordChoice {
  readonly root: number;
  readonly type: ChordType;
  /** 0 = root position, 1 = first inversion, … up to the number of notes − 1. */
  readonly inversion: number;
  readonly pure: PureChordChoice;
}

/** Whether a chord type offers an alternative pure chord (dominant 7th and diminished). */
export const hasAlternativePureChord = (type: ChordType): boolean =>
  CHORD_SHAPES[type].alternative !== undefined;

/** The number of notes in a chord type: 3 or 4. */
export const chordSize = (type: ChordType): number => CHORD_SHAPES[type].pure.length;

/** One note of a chord, bass first: which interval it is and how many octaves it is raised. */
export interface ChordTone {
  readonly interval: ChordIntervalId;
  /** 1 for a note an inversion has raised an octave, else 0. */
  readonly octaves: number;
  /** Its pure ratio above the root (in root position's octave), e.g. 2/1 for a raised root. */
  readonly ratio: Ratio;
}

/** The chord's notes from the bass up: inversion k raises the lowest k notes an octave. */
export function chordTones(choice: ChordChoice): readonly ChordTone[] {
  const shape = CHORD_SHAPES[choice.type];
  const intervals = (choice.pure === 'alternative' && shape.alternative) || shape.pure;
  const k = Math.max(0, Math.min(choice.inversion, intervals.length - 1));
  const rotated = [...intervals.slice(k), ...intervals.slice(0, k)];
  return rotated.map((interval, i) => {
    const octaves = i >= intervals.length - k ? 1 : 0;
    return {
      interval,
      octaves,
      ratio: multiplyRatios(CHORD_INTERVALS[interval].ratio, ratio(2 ** octaves, 1)),
    };
  });
}

/** A pure chord: its notes above the root as exact ratios, and as whole-number proportions. */
export interface PureChord {
  /** Bass first, e.g. 5/4, 3/2, 2/1 for a first-inversion major chord. */
  readonly ratios: readonly Ratio[];
  /** The same in lowest whole numbers, e.g. [5, 6, 8]. */
  readonly proportion: readonly number[];
}

export function pureChord(choice: ChordChoice): PureChord {
  const ratios = chordTones(choice).map((tone) => tone.ratio);
  return { ratios, proportion: wholeNumbers(ratios) };
}

/** Chords are played with the root in octave 4 (from C4 up to B4). */
export const CHORD_ROOT_OCTAVE = 4;

/** Something a listener should know about how a tuning system plays a chord. */
export type ChordRemark =
  /** A 12-note system plays a note on a key it spells differently: "uses G♯ as A♭". */
  | { readonly kind: 'borrowed'; readonly key: string; readonly as: string }
  /** An N-EDO's mapped step for an interval differs from its nearest step. */
  | {
      readonly kind: 'mapping';
      readonly edo: number;
      readonly interval: ChordIntervalId;
      readonly nearest: number;
      readonly mapped: number;
      /** The mapped intervals it is built from: the fifth (3), major third (5), harmonic seventh (7). */
      readonly builtFrom: readonly ChordIntervalId[];
    }
  /** An N-EDO has no step for an interval: it maps onto the root's unison or octave. */
  | {
      readonly kind: 'no-step';
      readonly edo: number;
      readonly interval: ChordIntervalId;
      readonly mapsTo: 'unison' | 'octave';
    };

/** One note of a chord as a tuning system plays it, beside its pure target. */
export interface TunedNote {
  readonly interval: ChordIntervalId;
  /** The key played: a pitch class, or a step in an N-EDO other than 12. */
  readonly note: Note;
  /** Its name in the tuning system, e.g. "G♯4" or "step 10 of 31, octave 4". */
  readonly name: string;
  readonly frequency: number;
  /** The pure chord's note: the root's frequency times its pure ratio. */
  readonly pureFrequency: number;
  /** 1200 · log₂(frequency / pureFrequency); the root is always 0. */
  readonly centsOffPure: number;
}

export interface TunedChord {
  /** Bass first. */
  readonly notes: readonly TunedNote[];
  readonly remarks: readonly ChordRemark[];
}

/** Familiar spellings of the Roots as fifths above C; C♯/D♭ and F♯/G♭ follow the system. */
const ROOT_FIFTHS = [0, null, 2, -3, 4, -1, null, 1, -4, 3, -2, 5];

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * A chord as a tuning system plays it, anchored on the system's Tonic: in a 12-note
 * system each note is the key a whole number of semitones above the root's key (never
 * an invented note). The pure chord sits on the root the system produces.
 */
export function tuneChord(tuning: Tuning, choice: ChordChoice, referencePitchHz: number): TunedChord {
  const tones = chordTones(choice);
  const n = stepEdo(tuning.system);
  // Keys per octave, the root's key (counted from octave 4's first key) and each interval's
  // keys above it: semitones in a 12-note system, mapped steps in any other N-EDO.
  const keys = n ?? 12;
  const rootKey = n === null ? choice.root : (edoLandmarks(n)[choice.root] ?? 0);
  const keysAbove = (interval: ChordIntervalId) =>
    n === null ? CHORD_INTERVALS[interval].semitones : mappedSteps(n, CHORD_INTERVALS[interval].ratio);
  const noteAt = (key: number): Note => ({
    pitchClass: mod(key, keys),
    octave: CHORD_ROOT_OCTAVE + Math.floor(key / keys),
  });
  const notes = tones.map((tone) => ({
    tone,
    note: noteAt(rootKey + keysAbove(tone.interval) + keys * tone.octaves),
  }));
  const rootFrequency = resolvePitch(tuning, noteAt(rootKey), referencePitchHz).frequency;
  return {
    notes: notes.map(({ tone, note }) => {
      const frequency = resolvePitch(tuning, note, referencePitchHz).frequency;
      const pureFrequency = rootFrequency * ratioValue(tone.ratio);
      return {
        interval: tone.interval,
        note,
        name: noteName(tuning, note),
        frequency,
        pureFrequency,
        // The root (or the root raised an octave) is pure by definition.
        centsOffPure:
          tone.interval === 'unison' ? 0 : CENTS_PER_OCTAVE * Math.log2(frequency / pureFrequency),
      };
    }),
    remarks: n === null ? borrowedKeys(tuning, choice.root, notes) : edoRemarks(n, tones),
  };
}

const PRIMES = [2, 3, 5, 7] as const;
/** The pure interval that carries each odd prime's mapping: 3/2, 5/4, 7/4. */
const PRIME_INTERVALS: readonly ChordIntervalId[] = ['fifth', 'major-third', 'harmonic-seventh'];

/** The exponents of 2, 3, 5 and 7 in a ratio of 7-limit whole numbers (6/5 → [1, 1, −1, 0]). */
function primeExponents(r: Ratio): number[] {
  const exponents = PRIMES.map(() => 0);
  const factor = (value: number, sign: number) => {
    let rest = value;
    PRIMES.forEach((p, i) => {
      while (rest % p === 0) {
        rest /= p;
        exponents[i]! += sign;
      }
    });
    if (rest !== 1) throw new RangeError(`${value} is not a 7-limit number`);
  };
  factor(r.num, 1);
  factor(r.den, -1);
  return exponents;
}

/**
 * The steps an N-EDO gives a pure interval under its EDO mapping: each prime gets the
 * EDO's best step for it (round(N·log₂ p), so 3/2, 5/4 and 7/4 each get their nearest
 * step) and every interval is built from those, e.g. 6/5 = mapped 3/2 − mapped 5/4.
 */
export function mappedSteps(n: number, r: Ratio): number {
  return primeExponents(r).reduce(
    (sum, e, i) => sum + e * Math.round(n * Math.log2(PRIMES[i]!)),
    0,
  );
}

/** The step nearest a pure interval, note by note: round(N · log₂ r). */
export const nearestSteps = (n: number, r: Ratio): number => Math.round(n * Math.log2(ratioValue(r)));

/**
 * Where an N-EDO's mapping is worth a word: an interval with no step of its own (it maps
 * onto the root's unison or octave), or one whose mapped step isn't its nearest step.
 */
function edoRemarks(n: number, tones: readonly ChordTone[]): ChordRemark[] {
  return tones.flatMap(({ interval }): ChordRemark[] => {
    if (interval === 'unison') return [];
    const pure = CHORD_INTERVALS[interval].ratio;
    const mapped = mappedSteps(n, pure);
    if (mod(mapped, n) === 0) {
      return [{ kind: 'no-step', edo: n, interval, mapsTo: mapped > 0 ? 'octave' : 'unison' }];
    }
    const nearest = nearestSteps(n, pure);
    if (nearest === mapped) return [];
    const exponents = primeExponents(pure);
    const builtFrom = PRIME_INTERVALS.filter((_, i) => exponents[i + 1] !== 0);
    return [{ kind: 'mapping', edo: n, interval, nearest, mapped, builtFrom }];
  });
}

/** The keys a 12-note system plays under another name in this chord. */
function borrowedKeys(
  tuning: Tuning,
  root: number,
  notes: readonly { tone: ChordTone; note: Note }[],
): ChordRemark[] {
  if (!isChain(tuning.system)) return [];
  const rootFifths = ROOT_FIFTHS[root] ?? keyFifths(tuning, root);
  return notes.flatMap(({ tone, note }) => {
    const key = keySpelling(tuning, note.pitchClass);
    const as = spellFifths(rootFifths + CHORD_INTERVALS[tone.interval].fifths);
    return key === as ? [] : [{ kind: 'borrowed' as const, key, as }];
  });
}

/**
 * The full table of a tuning system's notes (Tuning systems Lab, issue #26): one row per
 * key of a 12-note system, or per step of an N-EDO, in the octave starting at the Tonic.
 */
import type { Note } from './pitch';
import { type Ratio, ratio } from './ratio';
import {
  type TuningSystemChoice,
  centsAboveTonic,
  edoDivisions,
  edoLandmarks,
  keyConstruction,
  keySpelling,
} from './tuning';

export interface TuningTableRow {
  /** The note, in the octave that starts at the Tonic in octave 4 (playable as is). */
  readonly note: Note;
  /** Its spelling in the system ("G♯", or "step 10 of 31" in an N-EDO). */
  readonly spelling: string;
  /** Cents above the Tonic (in an EDO, above the step nearest the Tonic), 0 to 1200. */
  readonly cents: number;
  /** Its exact ratio to the Tonic, or null where none exists. */
  readonly ratio: Ratio | null;
  /** Signed cents from the nearest 12-EDO note, both measured from the Tonic. */
  readonly centsFromEdo12: number;
}

const BASE_OCTAVE = 4;
const UNISON = ratio(1, 1);

const fromEdo12 = (cents: number) => cents - 100 * Math.round(cents / 100);

/**
 * Every note of a tuning system in ascending order from its Tonic. An EDO has no Tonic of
 * its own, so its table starts on the step nearest the Tonic; only that step has a ratio.
 */
export function tuningTable(systemChoice: TuningSystemChoice): readonly TuningTableRow[] {
  const n = edoDivisions(systemChoice.system);
  if (n === null) {
    return Array.from({ length: 12 }, (_, i) => {
      const above = systemChoice.tonic + i;
      const pitchClass = above % 12;
      const cents = centsAboveTonic(systemChoice, pitchClass);
      return {
        note: { pitchClass, octave: BASE_OCTAVE + Math.floor(above / 12) },
        spelling: keySpelling(systemChoice, pitchClass),
        cents,
        ratio: keyConstruction(systemChoice, pitchClass)?.ratio ?? null,
        centsFromEdo12: fromEdo12(cents),
      };
    });
  }
  const start = edoLandmarks(n)[systemChoice.tonic % 12]!;
  return Array.from({ length: n }, (_, i) => {
    const step = start + i;
    const cents = (1200 * i) / n;
    return {
      note: { pitchClass: step % n, octave: BASE_OCTAVE + Math.floor(step / n) },
      spelling: keySpelling(systemChoice, step % n),
      cents,
      ratio: i === 0 ? UNISON : null,
      centsFromEdo12: fromEdo12(cents),
    };
  });
}

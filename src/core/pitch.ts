/**
 * A note of a 12-note tuning system, addressed by pitch class and octave in
 * scientific pitch notation: pitch class 0 is C, 9 is A; C4 is middle C.
 * In an N-EDO other than 12-EDO, `pitchClass` is the step within the octave (0…N−1),
 * step 0 being the step nearest C, so octave 4 starts at the step nearest C4.
 */
export interface Note {
  readonly pitchClass: number;
  readonly octave: number;
}

/** The note the Reference pitch is assigned to. */
export const REFERENCE_NOTE: Note = { pitchClass: 9, octave: 4 };

/** Signed distance from A4 in 12-EDO semitones (C5 → 3, C4 → −9). */
export function semitonesFromA4(note: Note): number {
  return (
    (note.octave - REFERENCE_NOTE.octave) * 12 + (note.pitchClass - REFERENCE_NOTE.pitchClass)
  );
}

/** The 12-EDO frequency of a note in Hz: f = f_ref · 2^(n/12), n semitones from A4. */
export function edo12Frequency(note: Note, referencePitchHz: number): number {
  return referencePitchHz * 2 ** (semitonesFromA4(note) / 12);
}

/** Familiar 12-EDO spellings by pitch class (historical spellings belong to each tuning system). */
const EDO12_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

/** A note's familiar 12-EDO name with its octave, e.g. "C♯4". */
export function edo12NoteName(note: Note): string {
  return `${EDO12_NAMES[note.pitchClass]}${note.octave}`;
}

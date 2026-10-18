/**
 * The EDO explorer's N is the shared tuning system's: choosing N here sets the tuning
 * system to N-EDO (URL `tuning=31-edo`), so the keyboard and chord buttons play the EDO
 * being explored. While a 12-note system is chosen, the explorer shows 12-EDO.
 */
import {
  CHORD_ROOT_OCTAVE,
  CHORD_TYPES,
  type ChordChoice,
  type Tuning,
  edoDivisions,
  edoSystem,
  resolvePitch,
  tuneChord,
} from '../../core';
import type { Settings } from '../../state/settings';
import { useSettings } from '../../state/useSettings';

/** Choosing N sets the shared tuning system to N-EDO, so the keyboard plays it too. */
export function useChooseEdo(): (n: number) => void {
  const [, update] = useSettings();
  return (n: number) => update({ tuningSystem: edoSystem(n) });
}

/** The N shown while the shared tuning system isn't an EDO. */
export const FALLBACK_EDO = 12;

/** The EDOs that dip lowest on the error chart, offered as quick picks. */
export const STANDOUT_EDOS = [12, 19, 31, 53] as const;

/** The N being explored. */
export const exploredEdo = (settings: Settings): number =>
  edoDivisions(settings.tuningSystem) ?? FALLBACK_EDO;

/** The explored N-EDO as a tuning (EDOs ignore the Tonic). */
export const edoTuning = (n: number, settings: Settings): Tuning => ({
  system: edoSystem(n),
  tonic: settings.tonic,
});

/** The scale: every step from step 0 of octave 4 up to the octave above, as frequencies. */
export function edoScale(n: number, settings: Settings): readonly number[] {
  const tuning = edoTuning(n, settings);
  return Array.from(
    { length: n + 1 },
    (_, k) =>
      resolvePitch(tuning, { pitchClass: k % n, octave: CHORD_ROOT_OCTAVE + Math.floor(k / n) }, settings.referencePitch)
        .frequency,
  );
}

/** The chords offered: every type on step 0 (the Root C), plus the harmonic 7th 4:5:6:7. */
export const EDO_CHORDS: readonly ChordChoice[] = CHORD_TYPES.flatMap((type) => {
  const chord: ChordChoice = { root: 0, type, inversion: 0, pure: '5-limit' };
  return type === 'dominant-7th' ? [chord, { ...chord, pure: 'alternative' as const }] : [chord];
});

/** A chord as the N-EDO plays it: its steps above step 0, and the tuned chord. */
export function edoChord(n: number, chord: ChordChoice, settings: Settings) {
  const tuned = tuneChord(edoTuning(n, settings), chord, settings.referencePitch);
  const steps = tuned.notes.map((note) => (note.note.octave - CHORD_ROOT_OCTAVE) * n + note.note.pitchClass);
  return { steps, tuned };
}

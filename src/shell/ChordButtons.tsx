import { playChord } from '../audio/chords';
import { type TuningSystemChoice, isEdo, tonicSpelling, tuneChord } from '../core';
import { copy } from '../copy/en';

/**
 * The chords offered beside the keyboard, as semitones above the Tonic: I, IV, V and vi,
 * then III and ♭VI, which in a historical system on C (E and A♭) reach towards the wolf.
 */
const CHORD_BUTTONS = [
  { above: 0, type: 'major' },
  { above: 5, type: 'major' },
  { above: 7, type: 'major' },
  { above: 9, type: 'minor' },
  { above: 4, type: 'major' },
  { above: 8, type: 'major' },
] as const;

/**
 * Chord buttons beside the keyboard (decision #12): each plays a whole chord in the
 * current tuning system with one click, from its Tonic (from C in an EDO). Hidden on phones.
 */
export function ChordButtons({ systemChoice, referencePitch }: { systemChoice: TuningSystemChoice; referencePitch: number }) {
  const tonic = isEdo(systemChoice.system) ? 0 : systemChoice.tonic;
  const text = copy.chordButtons;
  return (
    <div className="chord-buttons" role="group" aria-label={text.label} title={text.hint}>
      {CHORD_BUTTONS.map(({ above, type }) => {
        const root = (tonic + above) % 12;
        const spelling = tonicSpelling(root);
        const name = copy.chords.name(spelling, type);
        return (
          <button
            key={above}
            type="button"
            className="button-tertiary ml-focusable chord-button"
            aria-label={text.play(name)}
            onClick={() =>
              playChord(
                tuneChord(systemChoice, { root, type, inversion: 0, pure: '5-limit' }, referencePitch).notes.map(
                  (note) => note.frequency,
                ),
              )
            }
          >
            {text.short(spelling, type)}
          </button>
        );
      })}
    </div>
  );
}

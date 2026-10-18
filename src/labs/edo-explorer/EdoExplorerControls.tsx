import { useId } from 'react';
import { playChord } from '../../audio/chords';
import { EDO_MAX, EDO_MIN, isEdo } from '../../core';
import { copy } from '../../copy/en';
import { remarkText } from '../chord-comparison/ChordComparisonVisual';
import type { LabProps } from '../registry';
import { EDO_CHORDS, STANDOUT_EDOS, edoChord, edoScale, exploredEdo, useChooseEdo } from './exploredEdo';
import { useScalePlayback } from './usePlayback';

const text = copy.edoExplorer;

/** N (5–72) with the standout EDOs as quick picks. */
export function EdoExplorerControls({ settings }: LabProps) {
  const id = useId();
  const choose = useChooseEdo();
  const n = exploredEdo(settings);
  const shared = isEdo(settings.tuningSystem);
  const scale = useScalePlayback();
  return (
    <div className="edo-controls">
      <div className="field">
        <div className="field-label-row">
          <label className="field-label" htmlFor={id}>
            {text.nLabel}
          </label>
          <output className="field-value" htmlFor={id}>
            {n}
          </output>
        </div>
        <input
          id={id}
          className="field-range ml-focusable"
          type="range"
          min={EDO_MIN}
          max={EDO_MAX}
          step={1}
          value={n}
          aria-describedby={`${id}-hint`}
          onChange={(e) => choose(Number(e.target.value))}
        />
        <span id={`${id}-hint`} className="field-hint">
          {text.nHint}
        </span>
      </div>

      <div className="field">
        <span className="field-label" id={`${id}-standouts`}>
          {text.standoutsLabel}
        </span>
        <div className="edo-standouts" role="group" aria-labelledby={`${id}-standouts`}>
          {STANDOUT_EDOS.map((standout) => (
            <button
              key={standout}
              type="button"
              className="button-tertiary ml-focusable edo-standout"
              aria-pressed={shared && standout === n}
              onClick={() => choose(standout)}
            >
              {text.standout(standout)}
            </button>
          ))}
        </div>
      </div>

      <h2 className="edo-controls-heading">{text.playHeading}</h2>
      <button
        type="button"
        className="button-primary ml-focusable"
        onClick={() => (scale.playing ? scale.stop() : scale.play(edoScale(n, settings)))}
      >
        {scale.playing ? text.stop : text.playScale(n)}
      </button>
      <ul className="edo-chords" aria-label={text.chordsLabel}>
        {EDO_CHORDS.map((chord) => {
          const { steps, tuned } = edoChord(n, chord, settings);
          const name =
            chord.pure === 'alternative'
              ? copy.chordComparison.alternativeName(chord.type)
              : copy.chords.types[chord.type];
          const shownSteps = text.chordSteps(steps);
          return (
            <li key={`${chord.type}-${chord.pure}`} className="edo-chord">
              <span className="edo-chord-name">{name}</span>
              <span className="edo-chord-steps">{shownSteps}</span>
              <button
                type="button"
                className="button-tertiary ml-focusable edo-chord-play"
                aria-label={text.playChord(name, shownSteps)}
                onClick={() => playChord(tuned.notes.map((note) => note.frequency))}
              >
                <span aria-hidden="true">▶</span>
              </button>
              {tuned.remarks.length > 0 && (
                <span className="edo-chord-remarks">{tuned.remarks.map(remarkText).join(' ')}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

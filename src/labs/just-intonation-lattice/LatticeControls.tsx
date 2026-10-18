import { useId } from 'react';
import { isEdo, ratioValue } from '../../core';
import { copy } from '../../copy/en';
import { usePhoneLayout } from '../../scene3d';
import { TonicSelect } from '../../shell/TuningFields';
import type { LabProps } from '../registry';
import { type Limit, sameNode, setLimit, toggleNode } from './chord';
import { latticeGrid } from './geometry';
import { chordNote, chordNotes, playChord, useLattice } from './state';

const text = copy.latticeLab;

/** The limit (flat or turned to ×7), the chord's notes, and the Tonic the lattice is built from. */
export function LatticeControls({ settings }: LabProps) {
  const [state, setState] = useLattice();
  const phone = usePhoneLayout();
  const id = useId();
  const notes = chordNotes(state.chord, settings.tonic);
  const addable = latticeGrid({ phone, limit: state.limit })
    .filter((n) => !state.chord.some((m) => sameNode(m, n)))
    .map((n) => chordNote(n, settings.tonic))
    .sort((a, b) => ratioValue(a.ratio) - ratioValue(b.ratio));

  const changeChord = (chord: typeof state.chord) => {
    setState({ ...state, chord });
    playChord(chord, settings);
  };

  return (
    <div className="jl-controls">
      <p className="field-hint">{text.hint}</p>

      <fieldset className="jl-limit">
        <legend className="field-label">{text.limit.legend}</legend>
        {([5, 7] as const).map((limit: Limit) => (
          <label key={limit} className="jl-radio">
            <input
              type="radio"
              className="ml-focusable"
              name={`${id}-limit`}
              checked={state.limit === limit}
              onChange={() => setState(setLimit(state, limit))}
            />
            {limit === 5 ? text.limit.five : text.limit.seven}
          </label>
        ))}
        <span className="field-hint">{text.limit.hint}</span>
      </fieldset>

      <h3 className="jl-heading">{text.chordHeading}</h3>
      {notes.length === 0 ? (
        <p className="field-hint">{text.chordEmpty}</p>
      ) : (
        <ul className="jl-chord" aria-label={text.chordLabel}>
          {notes.map((note) => (
            <li key={note.label} className="jl-chord-note">
              <span>{note.label}</span>
              <button
                type="button"
                className="button-tertiary ml-focusable jl-remove"
                aria-label={text.remove(note.label)}
                title={text.remove(note.label)}
                onClick={() => changeChord(toggleNode(state.chord, note.node))}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="field">
        <label className="field-label" htmlFor={`${id}-add`}>
          {text.add}
        </label>
        <select
          id={`${id}-add`}
          className="field-control ml-focusable"
          value=""
          onChange={(e) => {
            const note = addable.find((n) => n.label === e.target.value);
            if (note) changeChord(toggleNode(state.chord, note.node));
          }}
        >
          <option value="" disabled>
            {text.addPlaceholder}
          </option>
          {addable.map((note) => (
            <option key={note.label} value={note.label}>
              {note.label}
            </option>
          ))}
        </select>
      </div>

      <div className="jl-actions">
        <button
          type="button"
          className="jl-play ml-focusable"
          disabled={state.chord.length === 0}
          onClick={() => playChord(state.chord, settings)}
        >
          {text.play}
        </button>
        <button
          type="button"
          className="button-tertiary ml-focusable"
          disabled={state.chord.length === 0}
          onClick={() => setState({ ...state, chord: [] })}
        >
          {text.clear}
        </button>
      </div>

      {/* The rail hides the Tonic while the shared system is an EDO; the lattice still uses it. */}
      {isEdo(settings.tuningSystem) && <TonicSelect hint={text.tonicHint} />}
    </div>
  );
}

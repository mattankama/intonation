import { useEffect, useId, useRef } from 'react';
import {
  EDO_MAX,
  EDO_MIN,
  TUNING_SYSTEM_IDS,
  edoSystem,
  isEdo,
  stepEdo,
  tonicSpelling,
} from '../core';
import { copy } from '../copy/en';
import { SETTING_FIELDS } from '../state/settings';
import { useSettings } from '../state/useSettings';

const PITCH_CLASSES = Array.from({ length: 12 }, (_, pc) => pc);

/** The menu value standing for every N-EDO other than 12-EDO. */
const OTHER_EDO = 'n-edo';
/** The N-EDO offered first: 31-EDO, the best-known EDO after 12. */
const FIRST_OTHER_EDO = 31;

/** Tuning system: 12-EDO, the six historical 12-note systems, and N-EDO. */
export function TuningSystemField() {
  const [settings, update] = useSettings();
  const id = useId();
  const text = copy.settings.tuningSystem;
  // Coming back to N-EDO returns to the last N chosen here.
  const lastN = useRef(FIRST_OTHER_EDO);
  const n = stepEdo(settings.tuningSystem);
  useEffect(() => {
    if (n !== null) lastN.current = n;
  }, [n]);
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {text.label}
      </label>
      <select
        id={id}
        className="field-control ml-focusable"
        value={n === null ? settings.tuningSystem : OTHER_EDO}
        onChange={(e) => {
          if (e.target.value === OTHER_EDO) {
            update({ tuningSystem: edoSystem(lastN.current) });
            return;
          }
          const system = SETTING_FIELDS.tuningSystem.parse(e.target.value);
          if (system) update({ tuningSystem: system });
        }}
      >
        {TUNING_SYSTEM_IDS.map((system) => (
          <option key={system} value={system}>
            {text.names[system]}
          </option>
        ))}
        <option value={OTHER_EDO}>{text.otherEdo}</option>
      </select>
    </div>
  );
}

/**
 * N, the steps per octave: shown for every EDO (12-EDO included), in the place the Tonic
 * takes for the 12-note systems.
 */
export function EdoStepsField() {
  const [settings, update] = useSettings();
  const id = useId();
  if (!isEdo(settings.tuningSystem)) return null;
  const n = stepEdo(settings.tuningSystem) ?? 12;
  const text = copy.settings.edoSteps;
  return (
    <div className="field">
      <div className="field-label-row">
        <label className="field-label" htmlFor={id}>
          {text.label}
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
        onChange={(e) => update({ tuningSystem: edoSystem(Number(e.target.value)) })}
      />
      <span id={`${id}-hint`} className="field-hint">
        {text.hint}
      </span>
    </div>
  );
}

/** Tonic: the note the tuning system is built from. Not offered for EDOs, where it does nothing. */
export function TonicField() {
  const [settings] = useSettings();
  if (isEdo(settings.tuningSystem)) return null;
  return <TonicSelect hint={copy.settings.tonic.hint} />;
}

/**
 * The shared Tonic picker, always shown. A Lab that builds several tuning systems from the
 * Tonic (Tuning systems) offers it in its Controls while the rail hides it for an EDO.
 */
export function TonicSelect({ hint }: { hint: string }) {
  const [settings, update] = useSettings();
  const id = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {copy.settings.tonic.label}
      </label>
      <select
        id={id}
        className="field-control ml-focusable"
        value={String(settings.tonic)}
        aria-describedby={`${id}-hint`}
        onChange={(e) => update({ tonic: Number(e.target.value) })}
      >
        {PITCH_CLASSES.map((pc) => (
          <option key={pc} value={pc}>
            {tonicSpelling(pc)}
          </option>
        ))}
      </select>
      <span id={`${id}-hint`} className="field-hint">
        {hint}
      </span>
    </div>
  );
}

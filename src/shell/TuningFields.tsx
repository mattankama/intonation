import { useId } from 'react';
import { TUNING_SYSTEM_IDS, isEdo, tonicSpelling } from '../core';
import { copy } from '../copy/en';
import { SETTING_FIELDS } from '../state/settings';
import { useSettings } from '../state/useSettings';

const PITCH_CLASSES = Array.from({ length: 12 }, (_, pc) => pc);

/** Tuning system: 12-EDO plus the six historical 12-note systems. */
export function TuningSystemField() {
  const [settings, update] = useSettings();
  const id = useId();
  const text = copy.settings.tuningSystem;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {text.label}
      </label>
      <select
        id={id}
        className="field-control ml-focusable"
        value={settings.tuningSystem}
        onChange={(e) => {
          const system = SETTING_FIELDS.tuningSystem.parse(e.target.value);
          if (system) update({ tuningSystem: system });
        }}
      >
        {TUNING_SYSTEM_IDS.map((system) => (
          <option key={system} value={system}>
            {text.names[system]}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Tonic: the note the tuning system is built from. Not offered for EDOs, where it does nothing. */
export function TonicField() {
  const [settings, update] = useSettings();
  const id = useId();
  if (isEdo(settings.tuningSystem)) return null;
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
        {copy.settings.tonic.hint}
      </span>
    </div>
  );
}

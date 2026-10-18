import { useId, useState } from 'react';
import { copy } from '../copy/en';
import {
  REFERENCE_PITCH_MAX,
  REFERENCE_PITCH_MIN,
  REFERENCE_PITCH_PRESETS,
  SETTING_FIELDS,
} from '../state/settings';
import { useSettings } from '../state/useSettings';

const CUSTOM = 'custom';
const text = copy.settings.referencePitch;
const isPreset = (hz: number) => (REFERENCE_PITCH_PRESETS as readonly number[]).includes(hz);

/** Reference pitch: presets 415 / 432 / 440 / 442 Hz plus a custom value. */
export function ReferencePitchField() {
  const [settings, update] = useSettings();
  const hz = settings.referencePitch;
  const id = useId();
  const [customChosen, setCustomChosen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const showCustom = customChosen || !isPreset(hz);
  const draftValid = draft === null || SETTING_FIELDS.referencePitch.parse(draft) !== undefined;

  return (
    <div className="field">
      <label className="field-label" htmlFor={`${id}-select`}>
        {text.label}
      </label>
      <select
        id={`${id}-select`}
        className="field-control ml-focusable"
        value={showCustom ? CUSTOM : String(hz)}
        onChange={(e) => {
          const value = e.target.value;
          if (value === CUSTOM) {
            setCustomChosen(true);
          } else {
            setCustomChosen(false);
            setDraft(null);
            update({ referencePitch: Number(value) });
          }
        }}
      >
        {REFERENCE_PITCH_PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {text.option(preset)}
          </option>
        ))}
        <option value={CUSTOM}>{text.custom}</option>
      </select>
      {showCustom && (
        <div className="field-custom">
          <input
            id={`${id}-custom`}
            className="field-control ml-focusable"
            type="number"
            inputMode="decimal"
            min={REFERENCE_PITCH_MIN}
            max={REFERENCE_PITCH_MAX}
            step={0.01}
            aria-label={text.customLabel}
            aria-invalid={!draftValid}
            aria-describedby={`${id}-range`}
            value={draft ?? String(hz)}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft(raw);
              const parsed = SETTING_FIELDS.referencePitch.parse(raw);
              if (parsed !== undefined) update({ referencePitch: parsed });
            }}
            onBlur={() => setDraft(null)}
          />
          <span id={`${id}-range`} className="field-hint">
            {text.range(REFERENCE_PITCH_MIN, REFERENCE_PITCH_MAX)}
          </span>
        </div>
      )}
    </div>
  );
}

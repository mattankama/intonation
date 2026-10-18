import { useId } from 'react';
import { copy } from '../copy/en';
import { useSettings } from '../state/useSettings';

const text = copy.settings.volume;

/** Master volume, 0–100 %. */
export function VolumeField() {
  const [settings, update] = useSettings();
  const id = useId();

  return (
    <div className="field">
      <div className="field-label-row">
        <label className="field-label" htmlFor={id}>
          {text.label}
        </label>
        <output className="field-value" htmlFor={id}>
          {text.value(settings.volume)}
        </output>
      </div>
      <input
        id={id}
        className="field-range ml-focusable"
        type="range"
        min={0}
        max={100}
        step={1}
        value={settings.volume}
        onChange={(e) => update({ volume: Number(e.target.value) })}
      />
    </div>
  );
}

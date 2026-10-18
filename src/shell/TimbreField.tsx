import { useEffect, useId } from 'react';
import {
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  type CustomTimbre,
  TIMBRE_PRESET_IDS,
  type TimbrePresetId,
  isCustomTimbre,
} from '../core';
import { copy } from '../copy/en';
import { formatDecimal } from '../format/numbers';
import { useSettings } from '../state/useSettings';

const text = copy.settings;

/** "+0.3", "−0.3", "0": brightness with its sign. */
const formatBrightness = (b: number) => (b > 0 ? '+' : '') + formatDecimal(b, 1).replace(/\.0$/, '');

const CUSTOM = 'custom';

/**
 * The last Custom Timbre seen this visit, so it stays in the picker after switching to a
 * preset. Memory only: a fresh visit without a link starts from the presets (decision #10).
 */
let rememberedCustom: CustomTimbre | null = null;

/**
 * Timbre preset or the Custom Timbre, plus brightness for every preset but Sine
 * (nothing to reweight). Brightness is hidden for Custom: its sliders already define it.
 */
export function TimbreField() {
  const [settings, update] = useSettings();
  const id = useId();
  const current = isCustomTimbre(settings.timbre) ? settings.timbre : null;
  useEffect(() => {
    if (current) rememberedCustom = current;
  }, [current]);
  const custom = current ?? rememberedCustom;

  return (
    <>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-timbre`}>
          {text.timbre.label}
        </label>
        <select
          id={`${id}-timbre`}
          className="field-control ml-focusable"
          value={isCustomTimbre(settings.timbre) ? CUSTOM : settings.timbre}
          onChange={(e) =>
            update({
              timbre: e.target.value === CUSTOM && custom ? custom : (e.target.value as TimbrePresetId),
            })
          }
        >
          {TIMBRE_PRESET_IDS.map((preset) => (
            <option key={preset} value={preset}>
              {text.timbre.presets[preset]}
            </option>
          ))}
          {custom && <option value={CUSTOM}>{text.timbre.custom(custom.from)}</option>}
        </select>
      </div>
      {!current && settings.timbre !== 'sine' && (
        <div className="field">
          <div className="field-label-row">
            <label className="field-label" htmlFor={`${id}-brightness`}>
              {text.brightness.label}
            </label>
            <output className="field-value" htmlFor={`${id}-brightness`}>
              {formatBrightness(settings.brightness)}
            </output>
          </div>
          <input
            id={`${id}-brightness`}
            className="field-range ml-focusable"
            type="range"
            min={BRIGHTNESS_MIN}
            max={BRIGHTNESS_MAX}
            step={0.1}
            value={settings.brightness}
            onChange={(e) => update({ brightness: Math.round(Number(e.target.value) * 10) / 10 })}
          />
          <div className="field-range-ends" aria-hidden="true">
            <span>{text.brightness.dark}</span>
            <span>{text.brightness.bright}</span>
          </div>
        </div>
      )}
    </>
  );
}

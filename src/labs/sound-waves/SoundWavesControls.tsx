import { LEVEL_MAX, editHarmonic, isCustomTimbre } from '../../core';
import { copy } from '../../copy/en';
import { useSettings } from '../../state/useSettings';
import type { LabProps } from '../registry';
import { shownTimbre } from './shownTimbre';

const text = copy.soundWaves;
const timbreText = copy.settings.timbre;

/**
 * A slider and a mute switch per harmonic. Moving either turns the current Timbre into
 * the one Custom Timbre (decision #10); "Reset to preset" restores the preset it came from.
 */
export function SoundWavesControls({ settings }: LabProps) {
  const [, update] = useSettings();
  const { timbre, brightness } = settings;
  const shown = shownTimbre(settings);
  const edit = (n: number, change: { level?: number; muted?: boolean }) =>
    update({ timbre: editHarmonic(timbre, brightness, n, change) });

  return (
    <div className="sw-controls">
      <p className="sw-status">
        {isCustomTimbre(timbre)
          ? text.editingCustom(timbreText.custom(timbre.from))
          : text.editingPreset(timbreText.presets[timbre])}
      </p>
      {isCustomTimbre(timbre) && (
        <button
          type="button"
          className="button-tertiary ml-focusable sw-reset"
          onClick={() => update({ timbre: timbre.from })}
        >
          {text.reset}
        </button>
      )}
      <h3 className="sw-heading">{text.harmonicsHeading}</h3>
      <div className="sw-harmonics-head" aria-hidden="true">
        <span>{text.columns.harmonic}</span>
        <span>{text.columns.level}</span>
        <span />
        <span>{text.columns.mute}</span>
      </div>
      <ol className="sw-harmonics">
        {shown.levels.map((level, i) => {
          const n = i + 1;
          const muted = shown.muted[i]!;
          return (
            <li key={n} className="sw-harmonic" data-muted={muted}>
              <span className="sw-harmonic-number" aria-hidden="true">
                {text.multiple(n)}
              </span>
              <input
                className="field-range ml-focusable"
                type="range"
                aria-label={text.harmonicLevel(n)}
                aria-valuetext={text.level(level)}
                min={0}
                max={LEVEL_MAX}
                step={1}
                value={level}
                onChange={(e) => edit(n, { level: Math.round(Number(e.target.value)) })}
              />
              <output className="field-value sw-harmonic-level">{text.level(level)}</output>
              <input
                className="sw-mute ml-focusable"
                type="checkbox"
                role="switch"
                aria-label={text.mute(n)}
                title={text.mute(n)}
                checked={muted}
                onChange={(e) => edit(n, { muted: e.target.checked })}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

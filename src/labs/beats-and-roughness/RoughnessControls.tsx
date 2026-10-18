import { useId } from 'react';
import { stackedChord } from '../../core';
import { copy } from '../../copy/en';
import { formatDecimal } from '../../format/numbers';
import type { LabProps } from '../registry';
import { BOTTOM_NOTES, type BottomNote } from './landscape';
import { PINS, pinName, playStacked, useBottom, useLandscape, useShowEdo12 } from './roughnessState';

const text = copy.roughnessLab;
const roughness = (value: number) => formatDecimal(value, 2);

/** The bottom note, the 12-EDO toggle, and the pinned chords as play buttons. */
export function RoughnessControls({ settings }: LabProps) {
  const [, setBottom] = useBottom();
  const [showEdo12, setShowEdo12] = useShowEdo12();
  const { bottom, bottomHz, landscape } = useLandscape(settings);
  const id = useId();
  const relative = (lower: number, upper: number) =>
    Math.min(1, landscape.relative(stackedChord(bottomHz, lower, upper)));

  return (
    <section className="br-controls br-roughness-controls" aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`} className="br-heading">
        {text.heading}
      </h3>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-bottom`}>
          {text.bottomLabel}
        </label>
        <select
          id={`${id}-bottom`}
          className="field-control ml-focusable"
          value={bottom}
          onChange={(e) => setBottom(e.target.value as BottomNote)}
        >
          {BOTTOM_NOTES.map((note) => (
            <option key={note} value={note}>
              {note}
            </option>
          ))}
        </select>
        <p className="field-hint">{text.bottomHint}</p>
      </div>
      <div className="field">
        <label className="field-check">
          <input
            type="checkbox"
            className="ml-focusable"
            checked={showEdo12}
            onChange={(e) => setShowEdo12(e.target.checked)}
          />
          {text.showEdo12}
        </label>
        <p className="field-hint">{text.showEdo12Hint}</p>
      </div>
      <div className="br-pins">
        <div className="br-pins-header">
          <h4 className="br-subheading">{text.pinsHeading}</h4>
          <span className="br-pins-unit">{text.pinsRoughness}</span>
        </div>
        <ul className="br-pin-list">
          {PINS.flatMap((pin) => {
            const versions = showEdo12 ? (['pure', 'edo12'] as const) : (['pure'] as const);
            return versions.map((version) => {
              const name = pinName(pin, version);
              const { lower, upper } = pin[version];
              return (
                <li key={name} className="br-pin" data-version={version}>
                  <button
                    type="button"
                    className="br-pin-play ml-focusable"
                    aria-label={text.play(name)}
                    onClick={() => playStacked(bottomHz, { name, lower, upper })}
                  >
                    <span aria-hidden="true">▶</span>
                    {name}
                  </button>
                  <span className="br-pin-roughness">{roughness(relative(lower, upper))}</span>
                </li>
              );
            });
          })}
        </ul>
        <p className="field-hint">{text.pinsHint}</p>
      </div>
    </section>
  );
}

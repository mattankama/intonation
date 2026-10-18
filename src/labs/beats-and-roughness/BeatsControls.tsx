import { useId } from 'react';
import { copy } from '../../copy/en';
import { formatHz } from '../../format/numbers';
import type { LabProps } from '../registry';
import { twoTones, startTones, stopTones, useGap, usePlaying } from './beatsState';
import { GAP_MAX, GAP_MIN, GAP_STEP } from './gap';

const text = copy.beatsLab;

/** Play / Stop for the two tones, and the gap slider. */
export function BeatsControls({ settings }: LabProps) {
  const [gap, setGap] = useGap();
  const playing = usePlaying();
  const id = useId();

  return (
    <section className="br-controls" aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`} className="br-heading">
        {text.heading}
      </h3>
      <button
        type="button"
        className="br-play ml-focusable"
        onClick={() => (playing ? stopTones() : startTones(twoTones(settings, gap)))}
      >
        <span aria-hidden="true">{playing ? '■' : '▶'}</span>
        {playing ? text.stop : text.play}
      </button>
      <div className="field">
        <div className="field-label-row">
          <label className="field-label" htmlFor={id}>
            {text.gapLabel}
          </label>
          <output className="field-value" htmlFor={id}>
            {formatHz(gap)}
          </output>
        </div>
        <input
          id={id}
          className="field-range ml-focusable"
          type="range"
          min={GAP_MIN}
          max={GAP_MAX}
          step={GAP_STEP}
          value={gap}
          aria-valuetext={formatHz(gap)}
          onChange={(e) => setGap(Number(e.target.value))}
        />
        <p className="field-hint">{text.gapHint}</p>
      </div>
    </section>
  );
}

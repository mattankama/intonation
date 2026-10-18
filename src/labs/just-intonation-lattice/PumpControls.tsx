import { useId } from 'react';
import { COMMA_PUMP_IDS, type CommaPumpId } from '../../core';
import { copy } from '../../copy/en';
import { formatCents } from '../../format/numbers';
import type { LabProps } from '../registry';
import { MAX_LOOPS, type PumpState } from './pumpState';
import { pumpDescription } from './labels';
import { nextChord, playToHome, setDrone, stopPump, useDrone, usePumpPlaying } from './pumpPlayback';
import { usePumpPicture } from './pumpPicture';
import { usePump } from './urlState';

const text = copy.latticeLab.pump;

/** The comma explorer (issue #31): the preset, Next / Play / Reset, and the drone on 1/1. */
export function PumpControls({ settings, pump }: LabProps & { pump: PumpState }) {
  const [, setPump] = usePump();
  const picture = usePumpPicture(pump);
  const playing = usePumpPlaying();
  const drone = useDrone();
  const id = useId();

  return (
    <>
      <p className="field-hint">{text.hint}</p>

      <div className="field">
        <label className="field-label" htmlFor={`${id}-pump`}>
          {text.select}
        </label>
        <select
          id={`${id}-pump`}
          className="field-control ml-focusable"
          value={pump.id}
          aria-describedby={`${id}-pump-hint`}
          onChange={(e) => {
            stopPump();
            setPump({ id: e.target.value as CommaPumpId, step: 0 });
          }}
        >
          {COMMA_PUMP_IDS.map((pumpId) => (
            <option key={pumpId} value={pumpId}>
              {text.names[pumpId]}
            </option>
          ))}
        </select>
        <span id={`${id}-pump-hint`} className="field-hint">
          {pumpDescription(settings.tonic, pump.id, (c) => formatCents(c, 'controls'))}
        </span>
      </div>

      <div className="jl-actions">
        <button
          type="button"
          className="jl-play ml-focusable"
          disabled={!picture?.canStep}
          onClick={() => nextChord(settings)}
        >
          {text.next}
        </button>
        <button
          type="button"
          className="jl-secondary ml-focusable"
          onClick={() => (playing ? stopPump() : playToHome(settings))}
        >
          {playing ? text.stop : text.play}
        </button>
        <button
          type="button"
          className="button-tertiary ml-focusable"
          disabled={pump.step === 0}
          onClick={() => {
            stopPump();
            setPump({ ...pump, step: 0 });
          }}
        >
          {text.reset}
        </button>
      </div>
      {picture && !picture.canStep && <p className="field-hint">{text.maxed(MAX_LOOPS)}</p>}

      <div className="field">
        <label className="jl-radio">
          <input
            type="checkbox"
            className="ml-focusable"
            checked={drone}
            aria-describedby={`${id}-drone-hint`}
            onChange={(e) => setDrone(e.target.checked, settings)}
          />
          {text.drone}
        </label>
        <span id={`${id}-drone-hint`} className="field-hint">
          {text.droneHint}
        </span>
      </div>
    </>
  );
}

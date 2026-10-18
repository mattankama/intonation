import { useId } from 'react';
import {
  EDO_MAX,
  EDO_MIN,
  TUNING_SYSTEM_IDS,
  type TuningSystemId,
  edoDivisions,
  edoSystem,
  isEdo,
  parseTuningSystem,
  stepEdo,
} from '../../core';
import { copy } from '../../copy/en';
import { TonicSelect } from '../../shell/TuningFields';
import type { LabProps } from '../registry';
import { TuningTables } from './TuningTables';
import { useComparedSystems, usePicks } from './state';
import { MAX_SYSTEMS } from './systems';

const text = copy.tuningSystemsLab;
const names = copy.settings.tuningSystem;

/** The menu value standing for every N-EDO other than 12-EDO. */
const OTHER_EDO = 'n-edo';
/** The N-EDO offered first, as in the shared settings. */
const FIRST_OTHER_EDO = 31;

/** The first N-EDO from 31 up (then down) that isn't compared already. */
function freeEdo(taken: readonly TuningSystemId[]): TuningSystemId {
  for (let n = FIRST_OTHER_EDO; n <= EDO_MAX; n++) if (!taken.includes(edoSystem(n))) return edoSystem(n);
  for (let n = FIRST_OTHER_EDO - 1; n >= EDO_MIN; n--) {
    if (n !== 12 && !taken.includes(edoSystem(n))) return edoSystem(n);
  }
  return edoSystem(FIRST_OTHER_EDO);
}

/** Choose up to four tuning systems to compare; the Tonic they are all built from; every note in a table. */
export function TuningSystemsControls({ settings }: LabProps) {
  const [systems, setSystems] = useComparedSystems();
  const [picks, onPick] = usePicks(systems, settings);
  const replace = (k: number, system: TuningSystemId) => {
    if (systems.some((s, i) => i !== k && s === system)) return;
    setSystems(systems.map((s, i) => (i === k ? system : s)));
  };
  const add = () => {
    const named = TUNING_SYSTEM_IDS.find((id) => !systems.includes(id));
    setSystems([...systems, named ?? freeEdo(systems)]);
  };

  return (
    <div className="ts-controls">
      <p className="field-hint">{text.pickHint}</p>
      <h3 className="ts-heading">{text.systemsHeading}</h3>
      <ol className="ts-slots">
        {systems.map((system, k) => (
          <SystemSlot
            key={k}
            k={k}
            system={system}
            others={systems.filter((_, i) => i !== k)}
            removable={systems.length > 1}
            onChange={(next) => replace(k, next)}
            onRemove={() => setSystems(systems.filter((_, i) => i !== k))}
          />
        ))}
      </ol>
      {systems.length < MAX_SYSTEMS && (
        <button type="button" className="button-tertiary ml-focusable ts-add" onClick={add}>
          {text.add}
        </button>
      )}
      {/* The rail hides the Tonic while the shared system is an EDO; the spiral still uses it. */}
      {isEdo(settings.tuningSystem) && <TonicSelect hint={text.tonicHint} />}
      <TuningTables systems={systems} tonic={settings.tonic} picks={picks} onPick={onPick} />
    </div>
  );
}

function SystemSlot({
  k,
  system,
  others,
  removable,
  onChange,
  onRemove,
}: {
  k: number;
  system: TuningSystemId;
  others: readonly TuningSystemId[];
  removable: boolean;
  onChange: (system: TuningSystemId) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const n = edoDivisions(system);
  const label = text.slot(k + 1);
  return (
    <li className="ts-slot">
      <div className="field">
        <div className="field-label-row">
          <label className="field-label" htmlFor={id}>
            {label}
          </label>
          {removable && (
            <button
              type="button"
              className="button-tertiary ml-focusable ts-remove"
              aria-label={text.remove(names.name(system))}
              title={text.remove(names.name(system))}
              onClick={onRemove}
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
        <select
          id={id}
          className="field-control ml-focusable"
          value={stepEdo(system) === null ? system : OTHER_EDO}
          onChange={(e) => {
            if (e.target.value === OTHER_EDO) onChange(freeEdo(others));
            else {
              const next = parseTuningSystem(e.target.value);
              if (next) onChange(next);
            }
          }}
        >
          {TUNING_SYSTEM_IDS.map((option) => (
            <option key={option} value={option} disabled={others.includes(option)}>
              {names.names[option]}
            </option>
          ))}
          <option value={OTHER_EDO}>{names.otherEdo}</option>
        </select>
      </div>
      {n !== null && (
        <div className="field">
          <div className="field-label-row">
            <span className="field-label">{copy.settings.edoSteps.label}</span>
            <output className="field-value" htmlFor={`${id}-n`}>
              {n}
            </output>
          </div>
          <input
            id={`${id}-n`}
            className="field-range ml-focusable"
            type="range"
            aria-label={text.edoSteps(k + 1)}
            min={EDO_MIN}
            max={EDO_MAX}
            step={1}
            value={n}
            onChange={(e) => onChange(edoSystem(Number(e.target.value)))}
          />
        </div>
      )}
    </li>
  );
}

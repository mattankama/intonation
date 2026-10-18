import { type ReactNode, useId } from 'react';
import {
  CHORD_TYPES,
  EDO_MAX,
  EDO_MIN,
  TUNING_SYSTEM_IDS,
  type TuningSystemId,
  chordSize,
  edoSystem,
  hasAlternativePureChord,
  parseTuningSystem,
  pureChord,
  stepEdo,
  tonicSpelling,
} from '../../core';
import { copy } from '../../copy/en';
import type { LabProps } from '../registry';
import { MAX_SYSTEMS, comparedSystems } from './chordState';
import { useChordComparison } from './useChordComparison';

const text = copy.chordComparison;
const systemNames = copy.settings.tuningSystem;
/** The menu value standing for every N-EDO other than 12-EDO. */
const OTHER_EDO = 'n-edo';
/** The N-EDOs offered first when N-EDO is picked, then every other N. */
const EDO_PREFERENCE = [
  31, 19, 22, 53, 41,
  ...Array.from({ length: EDO_MAX - EDO_MIN + 1 }, (_, i) => EDO_MIN + i),
];

/** A Lab select with its label. */
function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field-control ml-focusable"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

/** One column's tuning system: a named system, or N-EDO with its own N. */
function SystemPicker({
  index,
  system,
  others,
  onChange,
  onRemove,
}: {
  index: number;
  system: TuningSystemId;
  others: readonly TuningSystemId[];
  onChange: (system: TuningSystemId) => void;
  onRemove: (() => void) | null;
}) {
  const id = useId();
  const n = stepEdo(system);
  const free = (candidate: TuningSystemId) => !others.includes(candidate);
  return (
    <li className="cc-system">
      <div className="cc-system-row">
        <label className="visually-hidden" htmlFor={id}>
          {text.systemLabel(index + 1)}
        </label>
        <select
          id={id}
          className="field-control ml-focusable"
          value={n === null ? system : OTHER_EDO}
          onChange={(e) => {
            if (e.target.value === OTHER_EDO) {
              const next = EDO_PREFERENCE.map(edoSystem).find((s) => s !== '12-edo' && free(s));
              if (next) onChange(next);
              return;
            }
            const next = parseTuningSystem(e.target.value);
            if (next) onChange(next);
          }}
        >
          {TUNING_SYSTEM_IDS.map((named) => (
            <option key={named} value={named} disabled={!free(named)}>
              {systemNames.names[named]}
            </option>
          ))}
          <option value={OTHER_EDO}>{systemNames.otherEdo}</option>
        </select>
        {onRemove && (
          <button
            type="button"
            className="button-tertiary ml-focusable cc-remove"
            aria-label={text.remove(systemNames.name(system))}
            title={text.remove(systemNames.name(system))}
            onClick={onRemove}
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>
      {n !== null && (
        <div className="field">
          <div className="field-label-row">
            <label className="field-label" htmlFor={`${id}-n`}>
              {copy.settings.edoSteps.label}
            </label>
            <output className="field-value" htmlFor={`${id}-n`}>
              {n}
            </output>
          </div>
          <input
            id={`${id}-n`}
            className="field-range ml-focusable"
            type="range"
            aria-label={text.stepsLabel(index + 1)}
            min={EDO_MIN}
            max={EDO_MAX}
            step={1}
            value={n}
            onChange={(e) => {
              // A value another column already has is skipped: each column is a different system.
              const next = edoSystem(Number(e.target.value));
              if (free(next)) onChange(next);
            }}
          />
        </div>
      )}
    </li>
  );
}

/** The chord (Root, type, inversion, pure chord) and the tuning systems to compare. */
export function ChordComparisonControls({ settings }: LabProps) {
  const [state, update] = useChordComparison();
  const { chord } = state;
  const systems = comparedSystems(state.systems, settings);
  const setChord = (change: Partial<typeof chord>) => {
    const next = { ...chord, ...change };
    update({
      chord: {
        ...next,
        inversion: next.inversion < chordSize(next.type) ? next.inversion : 0,
        pure: hasAlternativePureChord(next.type) ? next.pure : '5-limit',
      },
    });
  };
  const setSystems = (next: readonly TuningSystemId[]) => update({ systems: next });
  const unused = [...TUNING_SYSTEM_IDS, edoSystem(31), edoSystem(19)].find((s) => !systems.includes(s));

  return (
    <div className="cc-controls">
      <SelectField
        label={text.rootLabel}
        value={String(chord.root)}
        onChange={(v) => setChord({ root: Number(v) })}
      >
        {copy.chords.roots.map((name, pc) => (
          <option key={pc} value={pc}>
            {name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label={text.typeLabel}
        value={chord.type}
        onChange={(v) => setChord({ type: CHORD_TYPES.find((t) => t === v) ?? chord.type })}
      >
        {CHORD_TYPES.map((type) => (
          <option key={type} value={type}>
            {copy.chords.types[type]}
          </option>
        ))}
      </SelectField>
      <SelectField
        label={text.inversionLabel}
        value={String(chord.inversion)}
        onChange={(v) => setChord({ inversion: Number(v) })}
      >
        {Array.from({ length: chordSize(chord.type) }, (_, k) => (
          <option key={k} value={k}>
            {copy.chords.inversions[k]}
          </option>
        ))}
      </SelectField>
      {hasAlternativePureChord(chord.type) && (
        <SelectField
          label={text.pureLabel}
          value={chord.pure}
          onChange={(v) => setChord({ pure: v === 'alternative' ? 'alternative' : '5-limit' })}
        >
          {(['5-limit', 'alternative'] as const).map((pure) => (
            <option key={pure} value={pure}>
              {text.pureOption(
                pure === '5-limit' ? text.fiveLimit : text.alternativeName(chord.type),
                pureChord({ ...chord, inversion: 0, pure }).proportion.join(':'),
              )}
            </option>
          ))}
        </SelectField>
      )}

      <h3 className="cc-controls-heading">{text.systemsHeading}</h3>
      <ol className="cc-systems">
        {systems.map((system, i) => (
          <SystemPicker
            key={i}
            index={i}
            system={system}
            others={systems.filter((_, j) => j !== i)}
            onChange={(next) => setSystems(systems.map((s, j) => (j === i ? next : s)))}
            onRemove={systems.length > 1 ? () => setSystems(systems.filter((_, j) => j !== i)) : null}
          />
        ))}
      </ol>
      {systems.length < MAX_SYSTEMS && unused && (
        <button
          type="button"
          className="button-tertiary ml-focusable cc-add"
          onClick={() => setSystems([...systems, unused])}
        >
          {text.add}
        </button>
      )}
      <p className="field-hint">{text.maxSystems(MAX_SYSTEMS)}</p>
      <p className="field-hint">{text.tonicNote(tonicSpelling(settings.tonic))}</p>
    </div>
  );
}

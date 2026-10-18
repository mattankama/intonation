import { useMemo } from 'react';
import { type TuningSystemId, noteName, tuningTable } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatRatio } from '../../format/numbers';
import { lazyScene, systemColorVar, usePhoneLayout } from '../../scene3d';
import type { LabProps } from '../registry';
import type { PitchSpiralProps } from './PitchSpiral';
import { type Pick, intervalOf } from './spiral';
import { isPicked, rowPick, useComparedSystems, usePicks } from './state';

const text = copy.tuningSystemsLab;
const PitchSpiral = lazyScene<PitchSpiralProps>(() => import('./PitchSpiral'), {
  label: text.sceneLabel,
  className: 'ts-scene',
});
const systemName = (system: TuningSystemId) => copy.settings.tuningSystem.name(system);

/** Cents with a sign, "+11.7¢" / "−13.7¢" / "0.0¢" (Controls precision). */
export function signedCents(value: number): string {
  const shown = formatCents(value, 'controls');
  return value > 0 && shown !== formatCents(0, 'controls') ? `+${shown}` : shown;
}

/** The spiral with its legend, the picked note or interval, and a table per system. */
export function TuningSystemsVisual({ settings }: LabProps) {
  const [systems] = useComparedSystems();
  const [picks, onPick] = usePicks(systems, settings);
  const phone = usePhoneLayout();

  return (
    <div className="ts-visual">
      <ul className="ts-legend" aria-label={text.legendLabel}>
        {systems.map((system, k) => (
          <li key={system} className="ts-legend-item">
            <span className="ts-swatch" style={{ background: systemColorVar(k) }} aria-hidden="true" />
            {systemName(system)}
          </li>
        ))}
      </ul>
      <PitchSpiral systems={systems} tonic={settings.tonic} phone={phone} picks={picks} onPick={onPick} />
      <PickReadout picks={picks} tonic={settings.tonic} />
      <div className="ts-tables" role="region" aria-label={text.tablesLabel}>
        {systems.map((system, k) => (
          <SystemTable key={system} system={system} k={k} tonic={settings.tonic} picks={picks} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

const pickName = (pick: Pick, tonic: number) =>
  text.pickedNote(noteName({ system: pick.system, tonic }, pick.note), systemName(pick.system));

function PickReadout({ picks, tonic }: { picks: readonly Pick[]; tonic: number }) {
  let message: string = text.pickHint;
  if (picks.length === 1) message = text.picked(pickName(picks[0]!, tonic));
  if (picks.length === 2) {
    const interval = intervalOf(picks[0]!, picks[1]!);
    const off = formatCents(Math.abs(interval.offPure), 'controls');
    message = text.interval(
      pickName(interval.low, tonic),
      pickName(interval.high, tonic),
      formatCents(interval.size, 'controls'),
      formatRatio(interval.pure),
      formatCents(interval.target - interval.low.cents, 'controls'),
      off === formatCents(0, 'controls') ? null : text.offPure(off, interval.offPure > 0),
    );
  }
  return (
    <p className="ts-readout" role="status">
      {picks.length === 2 && <span className="ts-ring-key" aria-hidden="true" title={text.pureTargetKey} />}
      {message}
    </p>
  );
}

function SystemTable({
  system,
  k,
  tonic,
  picks,
  onPick,
}: {
  system: TuningSystemId;
  k: number;
  tonic: number;
  picks: readonly Pick[];
  onPick: (pick: Pick) => void;
}) {
  const rows = useMemo(() => tuningTable({ system, tonic }), [system, tonic]);
  const columns = text.columns;
  return (
    <table className="ts-table">
      <caption className="ts-table-caption">
        <span className="ts-caption-name">
          <span className="ts-swatch" style={{ background: systemColorVar(k) }} aria-hidden="true" />
          {systemName(system)}
        </span>
      </caption>
      <thead>
        <tr>
          <th scope="col">{columns.note}</th>
          <th scope="col">{columns.cents}</th>
          <th scope="col">{columns.ratio}</th>
          <th scope="col">{columns.fromEdo12}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.note.pitchClass}:${row.note.octave}`}>
            <th scope="row">
              <button
                type="button"
                className="ts-note ml-focusable"
                aria-pressed={isPicked(picks, system, row)}
                onClick={() => onPick(rowPick(system, row))}
              >
                {row.spelling}
              </button>
            </th>
            <td>{formatCents(row.cents, 'controls')}</td>
            <td>{row.ratio ? formatRatio(row.ratio) : text.noRatio}</td>
            <td>{signedCents(row.centsFromEdo12)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

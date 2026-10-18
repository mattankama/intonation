import { useId, useMemo } from 'react';
import { type TuningSystemId, tuningTable } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatRatio, formatSignedCents } from '../../format/numbers';
import { systemColorVar } from '../../scene3d';
import type { Pick } from './spiral';
import { isPicked, rowPick } from './state';

const text = copy.tuningSystemsLab;

/**
 * Every note of each compared system, one table per system (issue #26). Shown in the
 * inspector's Controls tab (decision #12: "the Lab's own controls and tables"); a note
 * button picks the same note as tapping it on the spiral.
 */
export function TuningTables({
  systems,
  tonic,
  picks,
  onPick,
}: {
  systems: readonly TuningSystemId[];
  tonic: number;
  picks: readonly Pick[];
  onPick: (pick: Pick) => void;
}) {
  const headingId = useId();
  return (
    <section className="ts-tables" aria-labelledby={headingId}>
      <h3 id={headingId} className="ts-heading">
        {text.tablesLabel}
      </h3>
      {systems.map((system, k) => (
        <SystemTable key={system} system={system} k={k} tonic={tonic} picks={picks} onPick={onPick} />
      ))}
    </section>
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
          {/* The spiral's legend swatch beside the table (design-system README's scoped exception). */}
          <span className="ts-swatch" style={{ background: systemColorVar(k) }} aria-hidden="true" />
          {copy.settings.tuningSystem.name(system)}
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
            <td>{formatSignedCents(row.centsFromEdo12, 'controls')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { type TuningSystemId, noteName } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatRatio } from '../../format/numbers';
import { lazyScene, systemColorVar, usePhoneLayout } from '../../scene3d';
import type { LabProps } from '../registry';
import type { PitchSpiralProps } from './PitchSpiral';
import { type Pick, intervalOf } from './spiral';
import { useComparedSystems, usePicks } from './state';

const text = copy.tuningSystemsLab;
const PitchSpiral = lazyScene<PitchSpiralProps>(() => import('./PitchSpiral'), {
  label: text.sceneLabel,
  className: 'ts-scene',
});
const systemName = (system: TuningSystemId) => copy.settings.tuningSystem.name(system);

/** The spiral with its legend and the picked note or interval; the tables are in Controls. */
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

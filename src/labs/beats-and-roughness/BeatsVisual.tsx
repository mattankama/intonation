import { useMemo } from 'react';
import { BEAT_MAX_HZ, timbreHarmonics } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatHz } from '../../format/numbers';
import { lazyScene, systemColorVar, usePhoneLayout } from '../../scene3d';
import type { LabProps } from '../registry';
import type { BeatsRibbonProps } from './BeatsRibbon';
import { type TwoTones, twoTones, useGap, usePlaying, useToneSync } from './beatsState';

const text = copy.beatsLab;
const BeatsRibbon = lazyScene<BeatsRibbonProps>(() => import('./BeatsRibbon'), {
  label: text.sceneLabel,
  className: 'br-scene',
});

/** Ribbon key entries and their data colours (the swatch index matches the scene). */
const LEGEND = [
  { label: text.legend.tone1, k: 1, kind: 'line' },
  { label: text.legend.tone2, k: 2, kind: 'line' },
  { label: text.legend.sum, k: 0, kind: 'line' },
  { label: text.legend.swell, k: 3, kind: 'dot' },
] as const;

/** The beats section: the interference ribbon, its key and the beat rate. */
export function BeatsVisual({ settings }: LabProps) {
  const [gap] = useGap();
  const tones = twoTones(settings, gap);
  const playing = usePlaying();
  const phone = usePhoneLayout();
  useToneSync(tones);

  // A stable array while the Timbre is unchanged, so the ribbon only redraws on real changes.
  const key = timbreHarmonics(settings.timbre, settings.brightness).join(',');
  const harmonics = useMemo(() => key.split(',').map(Number), [key]);

  return (
    <section className="br-beats" data-playing={playing} aria-label={text.heading}>
      <ul className="br-legend" aria-label={text.legendLabel}>
        {LEGEND.map(({ label, k, kind }) => (
          <li key={label} className="br-legend-item">
            <span className={`br-swatch br-swatch-${kind}`} style={{ background: systemColorVar(k) }} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
      <BeatsRibbon harmonics={harmonics} gap={gap} playing={playing} phone={phone} />
      <p className="br-caption">{text.caption(phone)}</p>
      <BeatReadout tones={tones} />
    </section>
  );
}

function BeatReadout({ tones }: { tones: TwoTones }) {
  const note =
    tones.rate === 0 ? text.unison : tones.rate > BEAT_MAX_HZ ? text.tooFast : text.countable;
  return (
    <div className="br-readout">
      <p className="br-rate">
        <span className="br-rate-label">{text.rateLabel}</span>
        <span className="br-rate-value">{formatHz(tones.rate)}</span>
        <span className="br-rate-unit">{text.rateUnit}</span>
      </p>
      <p className="br-tones">
        {text.tones(formatHz(tones.f1), formatHz(tones.f2), formatCents(tones.cents, 'controls'))}
      </p>
      <p className="br-note">{note}</p>
    </div>
  );
}

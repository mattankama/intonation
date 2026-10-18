import { useMemo } from 'react';
import { type ChordType, stackedChord } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatDecimal, formatHz } from '../../format/numbers';
import { lazyScene } from '../../scene3d';
import type { LabProps } from '../registry';
import type { RoughnessSceneProps, ScenePin } from './RoughnessScene';
import { PINS, type PlayedChord, pinName, playStacked, useLandscape, usePlayedChord, useShowEdo12 } from './roughnessState';

const text = copy.roughnessLab;
const RoughnessScene = lazyScene<RoughnessSceneProps>(() => import('./RoughnessScene'), {
  label: text.sceneLabel,
  className: 'br-scene',
});

/**
 * Where each pin's label goes (default view, seen from the 1200¢ corner): the triads stand
 * within 70¢ of each other and reach right, the 7th chords and sus2 reach left, and staggered
 * stems lift their labels clear of each other.
 */
const PIN_LAYOUT: Record<ChordType, { stem: number; side: 'left' | 'right' }> = {
  sus4: { stem: 0.4, side: 'right' },
  diminished: { stem: 0.85, side: 'right' },
  major: { stem: 1.3, side: 'right' },
  minor: { stem: 1.75, side: 'right' },
  augmented: { stem: 2.2, side: 'right' },
  'dominant-7th': { stem: 0.4, side: 'left' },
  'major-7th': { stem: 0.85, side: 'left' },
  'minor-7th': { stem: 1.3, side: 'left' },
  sus2: { stem: 1.75, side: 'left' },
};

/** Key entries, matching the scene: ink pure chords, teal 12-EDO versions, the gold-backed last chord. */
const LEGEND = [
  { label: text.legend.pure, kind: 'pure' },
  { label: text.legend.edo12, kind: 'edo12' },
  { label: text.legend.played, kind: 'played' },
] as const;

/** The roughness section: the landscape, its key, and the last chord played. */
export function RoughnessVisual({ settings }: LabProps) {
  const { bottom, bottomHz, landscape, points, phone } = useLandscape(settings);
  const [showEdo12] = useShowEdo12();
  const played = usePlayedChord();
  // Relative roughness 0–1 (a chord between grid points can pass the roughest grid point a little).
  const relative = (lower: number, upper: number) =>
    Math.min(1, landscape.relative(stackedChord(bottomHz, lower, upper)));

  const pins = useMemo(
    () =>
      PINS.flatMap((pin): ScenePin[] => {
        const pureName = pinName(pin, 'pure');
        const layout = PIN_LAYOUT[pin.type];
        const pure: ScenePin = {
          name: pureName,
          version: 'pure',
          ...layout,
          height: Math.min(1, landscape.relative(stackedChord(bottomHz, pin.pure.lower, pin.pure.upper))),
          ...pin.pure,
        };
        if (!showEdo12) return [pure];
        const edo12: ScenePin = {
          name: pinName(pin, 'edo12'),
          version: 'edo12',
          ...layout,
          pureName,
          height: Math.min(1, landscape.relative(stackedChord(bottomHz, pin.edo12.lower, pin.edo12.upper))),
          ...pin.edo12,
        };
        return [pure, edo12];
      }),
    [landscape, bottomHz, showEdo12],
  );

  const playedMark = played ? { ...played, height: relative(played.lower, played.upper) } : null;

  return (
    <section className="br-roughness" aria-label={text.heading} data-points={points}>
      <p className="br-roughness-intro">{text.intro}</p>
      <ul className="br-legend" aria-label={text.legendLabel}>
        {LEGEND.map(({ label, kind }) => (
          <li key={label} className="br-legend-item">
            <span className={`br-swatch br-swatch-dot br-swatch-${kind}`} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
      <RoughnessScene
        landscape={landscape}
        pins={pins}
        played={playedMark}
        phone={phone}
        onPlay={(chord) => playStacked(bottomHz, chord)}
      />
      <p className="br-caption br-roughness-caption">{text.caption(phone)}</p>
      <ChordReadout played={played} roughness={playedMark?.height ?? 0} bottom={bottom} bottomHz={bottomHz} />
    </section>
  );
}

function ChordReadout({
  played,
  roughness,
  bottom,
  bottomHz,
}: {
  played: PlayedChord | null;
  roughness: number;
  bottom: string;
  bottomHz: number;
}) {
  const t = text.readout;
  if (!played) return <p className="br-chord-readout br-note">{t.empty}</p>;
  const lower = formatCents(played.lower, 'controls');
  const upper = formatCents(played.upper, 'controls');
  return (
    <div className="br-chord-readout">
      <p className="br-chord-name">
        {played.name ?? text.pointName(lower, upper)} <span className="br-note">{t.on(bottom, formatHz(bottomHz))}</span>
      </p>
      <dl className="br-chord-values">
        <div>
          <dt>{t.lower}</dt>
          <dd>{lower}</dd>
        </div>
        <div>
          <dt>{t.upper}</dt>
          <dd>{upper}</dd>
        </div>
        <div>
          <dt>{t.roughness}</dt>
          <dd className="br-chord-roughness">{formatDecimal(roughness, 2)}</dd>
        </div>
      </dl>
    </div>
  );
}

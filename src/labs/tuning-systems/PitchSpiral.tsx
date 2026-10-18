import { useMemo } from 'react';
import { type Tuning, type TuningSystemId, keySpelling, noteName, tuningTable } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatRatio } from '../../format/numbers';
import { InkDot, InkLine, InkRing, Scene3D, SceneLabel, type SceneView, type Vec3, useSceneColors } from '../../scene3d/scene';
import { rowPick } from './state';
import { type Pick, SPIRAL_RISE, intervalOf, spiralOctaves, spiralPoint, systemRadius } from './spiral';

const text = copy.tuningSystemsLab;

/** Where the camera starts: two octaves on desktop; one octave, further back, on phones. */
const VIEWS: Record<'desktop' | 'phone', SceneView> = {
  desktop: { position: [0, 3.1, 11.2], target: [0, -0.8, 0] },
  phone: { position: [0, 5.2, 13.6], target: [0, -SPIRAL_RISE / 2 - 0.3, 0] },
};

/** Helix sample spacing in cents. */
const SAMPLE = 10;

export interface PitchSpiralProps {
  systems: readonly TuningSystemId[];
  tonic: number;
  phone: boolean;
  picks: readonly Pick[];
  onPick: (pick: Pick) => void;
}

/**
 * The 3D pitch spiral: one helix per compared system, one turn per octave (issue #26).
 * Loaded lazily (with three.js) by TuningSystemsVisual.
 */
export default function PitchSpiral({ systems, tonic, phone, picks, onPick }: PitchSpiralProps) {
  return (
    <Scene3D label={text.sceneLabel} view={phone ? VIEWS.phone : VIEWS.desktop} className="ts-scene">
      <SpiralContent systems={systems} tonic={tonic} phone={phone} picks={picks} onPick={onPick} />
    </Scene3D>
  );
}

function SpiralContent({ systems, tonic, phone, picks, onPick }: PitchSpiralProps) {
  const colors = useSceneColors();
  const octaves = spiralOctaves(phone);
  const outer = systemRadius(systems.length - 1) + 0.75;
  const top = spiralPoint(octaves * 1200, 0)[1];
  const bottom = spiralPoint(0, 0)[1];
  const axis = useMemo<Vec3[]>(
    () => [
      [0, bottom - 0.3, 0],
      [0, top + 0.3, 0],
    ],
    [bottom, top],
  );
  const interval = picks.length === 2 ? intervalOf(picks[0]!, picks[1]!) : null;

  return (
    <>
      <InkLine points={axis} color={colors.guide} />
      {systems.map((system, k) => (
        <SystemHelix
          key={system}
          system={system}
          tonic={tonic}
          radius={systemRadius(k)}
          color={colors.systems[k]!}
          octaves={octaves}
          picks={picks}
          onPick={onPick}
        />
      ))}
      {/* Essential labels: the 12 familiar note names around the outside. */}
      {Array.from({ length: 12 }, (_, i) => (
        <SceneLabel
          key={i}
          position={spiralPoint(i * 100, outer)}
          text={keySpelling({ system: '12-edo', tonic }, (tonic + i) % 12)}
          tone="small"
        />
      ))}
      {interval && (
        <PureTarget
          position={spiralPoint(interval.target, systemRadius(systems.indexOf(interval.high.system)))}
          label={text.pureTarget(formatRatio(interval.pure))}
        />
      )}
    </>
  );
}

function SystemHelix({
  system,
  tonic,
  radius,
  color,
  octaves,
  picks,
  onPick,
}: {
  system: TuningSystemId;
  tonic: number;
  radius: number;
  color: string;
  octaves: number;
  picks: readonly Pick[];
  onPick: (pick: Pick) => void;
}) {
  const tuning: Tuning = useMemo(() => ({ system, tonic }), [system, tonic]);
  const rows = useMemo(() => tuningTable(tuning), [tuning]);
  const helix = useMemo(
    () => Array.from({ length: (octaves * 1200) / SAMPLE + 1 }, (_, i) => spiralPoint(i * SAMPLE, radius)),
    [octaves, radius],
  );
  return (
    <>
      <InkLine points={helix} color={color} opacity={0.55} />
      {Array.from({ length: octaves }, (_, octave) =>
        rows.map((row) => {
          const pick = rowPick(system, row, octave);
          const picked = picks.some((p) => p.system === system && p.cents === pick.cents);
          const position = spiralPoint(pick.cents, radius);
          return (
            <group key={`${octave}:${row.note.pitchClass}`}>
              <InkDot position={position} color={color} size={picked ? 0.13 : 0.075} onSelect={() => onPick(pick)} />
              {/* Other labels appear on tap: a picked note shows its name and cents. */}
              {picked && (
                <SceneLabel
                  position={[position[0], position[1] + 0.3, position[2]]}
                  text={`${noteName(tuning, pick.note)} · ${formatCents(row.cents, 'controls')}`}
                />
              )}
            </group>
          );
        }),
      )}
    </>
  );
}

function PureTarget({ position, label }: { position: Vec3; label: string }) {
  return (
    <>
      <InkRing position={position} radius={0.2} />
      <SceneLabel position={[position[0], position[1] - 0.34, position[2]]} text={label} tone="small" />
    </>
  );
}

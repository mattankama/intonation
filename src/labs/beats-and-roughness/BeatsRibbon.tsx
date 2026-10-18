import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from 'three';
import type { Harmonics } from '../../core';
import { copy } from '../../copy/en';
import { InkLine, Scene3D, SceneLabel, type SceneView, type Vec3, useSceneColors } from '../../scene3d/scene';
import { GAP_MAX } from './gap';
import { type RibbonCurves, advancePhase, beatPeaks, ribbonCurves, ribbonSampleCount, ribbonSeconds } from './ribbon';

const text = copy.beatsLab;

/** The ribbon runs along x from −HALF (oldest) to +HALF (now). */
const HALF = 4;
/** Each lane: its baseline height, depth and wave height. The sum is drawn twice as tall. */
const LANES = {
  tone1: { y: 1.75, z: -1.2, height: 0.42 },
  tone2: { y: 0.75, z: -0.6, height: 0.42 },
  sum: { y: -0.75, z: 0.4, height: 0.84 },
} as const;
type LaneId = keyof typeof LANES;

/** Where the camera starts: a little above and to the left, so the lanes stand apart in depth. */
const VIEWS: Record<'desktop' | 'phone', SceneView> = {
  desktop: { position: [-2.2, 1.9, 9.4], target: [-0.45, 0.35, 0] },
  phone: { position: [-2.2, 2.1, 13.6], target: [-0.6, 0.35, 0] },
};

/** Room for the most samples any gap draws (the desktop window is the longer one). */
const CAPACITY = ribbonSampleCount(GAP_MAX, ribbonSeconds(false));
/** Room for every swell marker the window can hold. */
const MAX_SWELLS = Math.ceil(GAP_MAX * ribbonSeconds(false)) + 2;
/** The sum's ribbon fill: one ink hairline every this many samples. */
const HATCH_EVERY = 2;

export interface BeatsRibbonProps {
  harmonics: Harmonics;
  gap: number;
  playing: boolean;
  phone: boolean;
}

/**
 * The 3D interference ribbon (issue #28): tone 1, tone 2 and their sum side by side,
 * with markers where the tones are in step. Animates only while the tones play.
 * Loaded lazily (with three.js) by BeatsVisual.
 */
export default function BeatsRibbon(props: BeatsRibbonProps) {
  return (
    <Scene3D label={text.sceneLabel} view={props.phone ? VIEWS.phone : VIEWS.desktop} className="br-scene">
      <RibbonContent {...props} />
    </Scene3D>
  );
}

const x = (t: number, seconds: number) => HALF * (1 + (2 * t) / seconds);

function RibbonContent({ harmonics, gap, playing, phone }: BeatsRibbonProps) {
  const colors = useSceneColors();
  const invalidate = useThree((s) => s.invalidate);
  const seconds = ribbonSeconds(phone);
  const marks = useRibbonMarks();

  // The phase (tone 2's lead over tone 1, in cycles) lives outside React: it moves every frame.
  const phase = useRef(0);
  const lastFrame = useRef(0);
  const live = useRef({ harmonics, gap, seconds });
  live.current = { harmonics, gap, seconds };

  const draw = useCallback(() => {
    const { harmonics: h, gap: g, seconds: s } = live.current;
    marks.draw(ribbonCurves(h, g, phase.current, s), beatPeaks(g, phase.current, s), s);
    invalidate();
  }, [marks, invalidate]);

  // Both tones start in step: restart the phase whenever playing starts.
  useEffect(() => {
    if (!playing) return;
    phase.current = 0;
    lastFrame.current = performance.now();
    draw();
  }, [playing, draw]);

  useEffect(draw, [draw, harmonics, gap, seconds]);

  useFrame(() => {
    if (!playing) return;
    const now = performance.now();
    phase.current = advancePhase(phase.current, live.current.gap, (now - lastFrame.current) / 1000);
    lastFrame.current = now;
    draw();
  });

  // Ink drawing (design-system README): tone 1 ink, tone 2 teal, the sum ink over a soft-gold fill.
  marks.color(colors.ink, colors.accent, colors.ink, colors.fill, colors.ink);

  const baselines = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(LANES) as LaneId[]).map((id) => {
          const { y, z } = LANES[id];
          return [id, [[-HALF, y, z], [HALF, y, z]] as Vec3[]];
        }),
      ) as Record<LaneId, Vec3[]>,
    [],
  );
  const nowLine = useMemo<Vec3[]>(
    () => [
      [HALF, LANES.sum.y - LANES.sum.height - 0.2, LANES.sum.z],
      [HALF, LANES.tone1.y + LANES.tone1.height + 0.2, LANES.tone1.z],
    ],
    [],
  );
  const timeY = LANES.sum.y - LANES.sum.height - 0.38;

  return (
    <>
      {(Object.keys(LANES) as LaneId[]).map((id) => (
        <group key={id}>
          <InkLine points={baselines[id]} color={colors.guide} />
          <SceneLabel
            position={[-HALF - 0.6, LANES[id].y, LANES[id].z]}
            text={text.lanes[id]}
            tone="small"
          />
        </group>
      ))}
      <InkLine points={nowLine} color={colors.guide} />
      <SceneLabel position={[HALF, timeY, LANES.sum.z]} text={text.now} tone="small" />
      <SceneLabel position={[-HALF, timeY, LANES.sum.z]} text={text.ago(String(seconds))} tone="small" />
      <primitive object={marks.group} />
    </>
  );
}

/** The moving marks: three wave lines, the sum's hatched fill and the in-step markers. */
function useRibbonMarks() {
  const marks = useMemo(() => {
    const line = () => {
      const geometry = new BufferGeometry();
      geometry.setAttribute(
        'position',
        new BufferAttribute(new Float32Array(CAPACITY * 3), 3).setUsage(DynamicDrawUsage),
      );
      const object = new Line(geometry, new LineBasicMaterial());
      object.frustumCulled = false;
      return object;
    };
    const tone1 = line();
    const tone2 = line();
    const sum = line();
    const hatchGeometry = new BufferGeometry();
    hatchGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(Math.ceil(CAPACITY / HATCH_EVERY) * 6), 3).setUsage(DynamicDrawUsage),
    );
    const hatch = new LineSegments(hatchGeometry, new LineBasicMaterial({ transparent: true, opacity: 0.9 }));
    hatch.frustumCulled = false;
    const dotGeometry = new SphereGeometry(0.065, 16, 12);
    const dotMaterial = new MeshBasicMaterial();
    const dots = Array.from({ length: MAX_SWELLS }, () => {
      const dot = new Mesh(dotGeometry, dotMaterial);
      dot.visible = false;
      return dot;
    });
    const group = new Group();
    group.add(tone1, tone2, sum, hatch, ...dots);
    return { group, tone1, tone2, sum, hatch, dots, dotGeometry, dotMaterial };
  }, []);

  useEffect(
    () => () => {
      for (const object of [marks.tone1, marks.tone2, marks.sum, marks.hatch]) {
        object.geometry.dispose();
        (object.material as LineBasicMaterial).dispose();
      }
      marks.dotGeometry.dispose();
      marks.dotMaterial.dispose();
    },
    [marks],
  );

  return useMemo(
    () => ({
      group: marks.group,
      color(tone1: string, tone2: string, sum: string, hatch: string, swell: string) {
        (marks.tone1.material as LineBasicMaterial).color.set(tone1);
        (marks.tone2.material as LineBasicMaterial).color.set(tone2);
        (marks.sum.material as LineBasicMaterial).color.set(sum);
        (marks.hatch.material as LineBasicMaterial).color.set(hatch);
        marks.dotMaterial.color.set(swell);
      },
      draw(curves: RibbonCurves, swells: readonly number[], seconds: number) {
        const count = Math.min(curves.times.length, CAPACITY);
        const write = (object: Line, lane: LaneId, values: readonly number[]) => {
          const { y, z, height } = LANES[lane];
          const position = object.geometry.getAttribute('position') as BufferAttribute;
          for (let i = 0; i < count; i++) position.setXYZ(i, x(curves.times[i]!, seconds), y + height * values[i]!, z);
          position.needsUpdate = true;
          object.geometry.setDrawRange(0, count);
        };
        write(marks.tone1, 'tone1', curves.tone1);
        write(marks.tone2, 'tone2', curves.tone2);
        write(marks.sum, 'sum', curves.sum);

        const { y, z, height } = LANES.sum;
        const hatch = marks.hatch.geometry.getAttribute('position') as BufferAttribute;
        let v = 0;
        for (let i = 0; i < count; i += HATCH_EVERY) {
          const px = x(curves.times[i]!, seconds);
          hatch.setXYZ(v++, px, y, z);
          hatch.setXYZ(v++, px, y + height * curves.sum[i]!, z);
        }
        hatch.needsUpdate = true;
        marks.hatch.geometry.setDrawRange(0, v);

        marks.dots.forEach((dot, i) => {
          const t = swells[i];
          dot.visible = t !== undefined;
          if (t !== undefined) dot.position.set(x(t, seconds), y + height + 0.14, z);
        });
      },
    }),
    [marks],
  );
}

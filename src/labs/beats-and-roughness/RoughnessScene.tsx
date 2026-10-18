import { type ThreeEvent, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
} from 'three';
import type { RoughnessLandscape } from '../../core';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { copy } from '../../copy/en';
import { InkDot, InkLine, Scene3D, SceneLabel, type SceneView, type Vec3, useSceneColors } from '../../scene3d/scene';
import { LANDSCAPE_HEIGHT, LANDSCAPE_SIZE, type StackedIntervals, chordAt, scenePoint } from './landscape';
import type { PlayedChord } from './roughnessState';

const text = copy.roughnessLab;
const HALF = LANDSCAPE_SIZE / 2;
/** A pointer that moved further than this (px) between down and up was a drag, not a click. */
const TAP_SLOP = 6;

/**
 * Seen from low above the (1200¢, 1200¢) side: the narrow-interval walls stand at the back,
 * and the pins' staggered stems stand apart on screen.
 */
const VIEWS: Record<'desktop' | 'phone', SceneView> = {
  desktop: { position: [6.6, 4.4, 6.6], target: [-0.3, 0.8, -0.3] },
  phone: { position: [7.4, 7.2, 10.2], target: [0, 0.4, 0] },
};

/** One pin on the landscape: a pure chord, or a 12-EDO version joined to its pure pin. */
export interface ScenePin extends StackedIntervals {
  readonly name: string;
  readonly version: 'pure' | 'edo12';
  /** Relative roughness, 0–1. */
  readonly height: number;
  /** How tall the pin's stem is, and which side its label reaches, so neighbouring labels stand apart. */
  readonly stem: number;
  readonly side: 'left' | 'right';
  /** For a 12-EDO version: its pure pin's name. */
  readonly pureName?: string;
}

export interface RoughnessSceneProps {
  landscape: RoughnessLandscape;
  pins: readonly ScenePin[];
  /** The last chord played and its relative roughness, marked on the surface. */
  played: (PlayedChord & { height: number }) | null;
  phone: boolean;
  onPlay: (chord: PlayedChord) => void;
}

/**
 * The 3D roughness landscape (issue #29): every three-note chord on the bottom note, lower ×
 * upper interval, height = relative roughness; the chord types pinned at pure tuning. Click
 * anywhere to hear that chord. Loaded lazily (with three.js) by RoughnessVisual.
 */
export default function RoughnessScene(props: RoughnessSceneProps) {
  return (
    <Scene3D label={text.sceneLabel} view={props.phone ? VIEWS.phone : VIEWS.desktop} className="br-scene">
      <LandscapeContent {...props} />
    </Scene3D>
  );
}

function LandscapeContent({ landscape, pins, played, phone, onPlay }: RoughnessSceneProps) {
  const colors = useSceneColors();
  const surface = useSurface(landscape, phone);
  const element = useThree((s) => s.gl.domElement);

  surface.fill.material.color.set(colors.background);
  surface.wire.material.color.set(colors.systems[0]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > TAP_SLOP) return;
    onPlay({ name: null, ...chordAt(e.point.x, e.point.z) });
  };

  const top = (pin: ScenePin): Vec3 => {
    const [x, y, z] = scenePoint(pin.lower, pin.upper, Math.min(1, pin.height));
    return [x, y + pin.stem, z];
  };
  const pureTops = new Map(pins.filter((p) => p.version === 'pure').map((p) => [p.name, top(p)]));

  return (
    <>
      <Axes phone={phone} />
      <primitive
        object={surface.fill}
        onClick={onClick}
        onPointerOver={() => (element.style.cursor = 'pointer')}
        onPointerOut={() => (element.style.cursor = '')}
      />
      <primitive object={surface.wire} />
      {pins.map((pin) => {
        const color = pin.version === 'pure' ? colors.ink : colors.systems[1];
        const base = scenePoint(pin.lower, pin.upper, Math.min(1, pin.height));
        const head = top(pin);
        const named = played?.name === pin.name;
        const showLabel = named || (!phone && pin.version === 'pure');
        const pureTop = pin.pureName ? pureTops.get(pin.pureName) : undefined;
        return (
          <group key={pin.name}>
            <Stem from={base} to={head} color={color} />
            {pureTop && <Stem from={head} to={pureTop} color={color} opacity={0.6} />}
            <InkDot
              position={head}
              color={color}
              size={0.07}
              onSelect={() => onPlay({ name: pin.name, lower: pin.lower, upper: pin.upper })}
            />
            {showLabel && <PinLabel position={head} text={pin.name} side={pin.side} accent={named} />}
          </group>
        );
      })}
      {played && (
        <InkDot
          position={scenePoint(played.lower, played.upper, Math.min(1, played.height))}
          color={colors.systems[3]}
          size={0.08}
        />
      )}
    </>
  );
}

const shift = ([x, y, z]: Vec3, [dx, dy, dz]: Vec3): Vec3 => [x + dx, y + dy, z + dz];

/**
 * A pin's name chip, beside its head rather than centred on it (like SceneLabel otherwise),
 * so the labels of pins standing close together reach away from each other.
 */
function PinLabel({ position, text, side, accent }: { position: Vec3; text: string; side: 'left' | 'right'; accent: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const object = useMemo(() => new CSS2DObject(document.createElement('div')), []);
  useEffect(() => {
    object.element.className = `scene3d-label scene3d-label-${accent ? 'accent' : 'small'}`;
    object.element.textContent = text;
    // CSS2DObject.center: which point of the chip sits on the pin (0 = left edge, 1 = right).
    object.center.set(side === 'right' ? -0.08 : 1.08, 0.5);
    invalidate();
  }, [object, text, side, accent, invalidate]);
  return <primitive object={object} position={[...position]} />;
}

/** A straight ink line between two points (a stable array while they don't move). */
function Stem({ from, to, color, opacity }: { from: Vec3; to: Vec3; color: string; opacity?: number }) {
  const key = [...from, ...to].join(',');
  const points = useMemo(() => key.split(',').map(Number), [key]);
  const ends = useMemo<Vec3[]>(
    () => [
      [points[0]!, points[1]!, points[2]!],
      [points[3]!, points[4]!, points[5]!],
    ],
    [points],
  );
  return <InkLine points={ends} color={color} opacity={opacity} />;
}

/** The floor's edges, tick labels and the height axis. */
function Axes({ phone }: { phone: boolean }) {
  const { guide } = useSceneColors();
  const lines = useMemo(() => {
    const y = 0;
    return {
      floor: [
        [-HALF, y, HALF],
        [HALF, y, HALF],
        [HALF, y, -HALF],
        [-HALF, y, -HALF],
        [-HALF, y, HALF],
      ] as Vec3[],
      height: [
        [HALF, 0, -HALF],
        [HALF, LANDSCAPE_HEIGHT, -HALF],
      ] as Vec3[],
    };
  }, []);
  const ticks = phone ? [0, 1200] : [0, 600, 1200];
  // Lower-interval ticks run along the front edge, upper-interval ticks along the right edge;
  // they share the 1200¢ corner, labelled once.
  return (
    <>
      <InkLine points={lines.floor} color={guide} />
      <InkLine points={lines.height} color={guide} />
      {ticks.map((c) => (
        <group key={c}>
          <SceneLabel position={shift(scenePoint(c, 1200, 0), [0, 0, 0.35])} text={`${c}¢`} tone="small" />
          {c < 1200 && <SceneLabel position={shift(scenePoint(1200, c, 0), [0.45, 0, 0])} text={`${c}¢`} tone="small" />}
        </group>
      ))}
      <SceneLabel position={[0, 0, HALF + 0.8]} text={text.axes.lower} tone="small" />
      <SceneLabel position={[HALF + 1.1, 0, 0]} text={text.axes.upper} tone="small" />
      <SceneLabel position={[HALF, LANDSCAPE_HEIGHT + 0.25, -HALF]} text={phone ? '1' : `${text.axes.height} 1`} tone="small" />
    </>
  );
}

/** Grid lines every this many points: 30¢ on desktop, 60¢ on phones. */
const wireEvery = (phone: boolean) => (phone ? 3 : 5);

/** The surface: a hidden-line fill (the canvas colour, hiding what is behind) and its ink grid. */
function useSurface(landscape: RoughnessLandscape, phone: boolean) {
  const surface = useMemo(() => {
    const { cents, heights } = landscape;
    const n = cents.length;
    const positions = new Float32Array(n * n * 3);
    for (let l = 0; l < n; l++) {
      for (let u = 0; u < n; u++) {
        const [x, y, z] = scenePoint(cents[l]!, cents[u]!, heights[l * n + u]!);
        positions.set([x, y, z], (l * n + u) * 3);
      }
    }
    const index = new Uint32Array((n - 1) * (n - 1) * 6);
    let k = 0;
    for (let l = 0; l < n - 1; l++) {
      for (let u = 0; u < n - 1; u++) {
        const a = l * n + u;
        index.set([a, a + n, a + 1, a + 1, a + n, a + n + 1], k);
        k += 6;
      }
    }
    const fillGeometry = new BufferGeometry();
    fillGeometry.setAttribute('position', new BufferAttribute(positions, 3));
    fillGeometry.setIndex(new BufferAttribute(index, 1));
    fillGeometry.computeBoundingSphere();
    const fill = new Mesh(
      fillGeometry,
      new MeshBasicMaterial({ side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    );

    // Grid lines along both axes, every few points.
    const every = wireEvery(phone);
    const segments: number[] = [];
    const vertex = (l: number, u: number) => segments.push(...positions.subarray((l * n + u) * 3, (l * n + u) * 3 + 3));
    for (let line = 0; line < n; line += every) {
      for (let i = 0; i < n - 1; i++) {
        vertex(line, i);
        vertex(line, i + 1);
        vertex(i, line);
        vertex(i + 1, line);
      }
    }
    const wireGeometry = new BufferGeometry();
    wireGeometry.setAttribute('position', new BufferAttribute(new Float32Array(segments), 3));
    const wire = new LineSegments(wireGeometry, new LineBasicMaterial({ transparent: true, opacity: 0.55 }));
    wire.raycast = () => {};
    return { fill, wire };
  }, [landscape, phone]);

  useEffect(
    () => () => {
      surface.fill.geometry.dispose();
      surface.fill.material.dispose();
      surface.wire.geometry.dispose();
      surface.wire.material.dispose();
    },
    [surface],
  );
  return surface;
}

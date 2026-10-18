import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  type Group,
  LineBasicMaterial,
  LineSegments,
  Quaternion,
  Vector3,
} from 'three';
import { type LatticeNode, latticeNoteName } from '../../core';
import { copy } from '../../copy/en';
import { InkDot, InkLine, Scene3D, SceneLabel, type SceneView, useSceneColors } from '../../scene3d/scene';
import { TONIC_TRIAD, type Limit, sameNode } from './chord';
import {
  type EdgeKind,
  REVEAL_ROTATION,
  type Vec3,
  chordFaces,
  latticeEdges,
  latticeGrid,
  latticeView,
  nodePosition,
} from './geometry';
import { nodeRatioText } from './pumpState';

const text = copy.latticeLab;

/** How long the turn to (or from) the 7-limit takes, in seconds. */
const TURN_SECONDS = 0.8;

export interface LatticeSceneProps {
  limit: Limit;
  chord: readonly LatticeNode[];
  tonic: number;
  phone: boolean;
  onToggle: (node: LatticeNode) => void;
  /** Comma explorer (#31): the roots so far, drawn as a teal path; their nodes are drawn too. */
  path?: readonly LatticeNode[];
  /** Overrides the view the chord would get (the comma explorer frames its loop). */
  view?: SceneView;
}

/**
 * The just-intonation lattice in 3D (issue #30): flat at 5-limit, turned to reveal the ×7
 * layer at 7-limit; the chord's notes are larger dots and its shape is filled in soft gold.
 * The comma explorer adds the path of its roots in link teal (issue #31).
 * Loaded lazily (with three.js) by LatticeVisual.
 */
export default function LatticeScene(props: LatticeSceneProps) {
  const { phone, limit, chord, view } = props;
  return (
    <Scene3D label={text.sceneLabel} view={view ?? latticeView({ phone, limit }, chord)} className="jl-scene">
      <LatticeContent {...props} />
    </Scene3D>
  );
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Turns the group towards `limit` (7 = fully turned), easing over TURN_SECONDS; snaps with reduced motion. */
function useTurn(limit: Limit) {
  const group = useRef<Group>(null);
  const turn = useRef(limit === 7 ? 1 : 0);
  const invalidate = useThree((s) => s.invalidate);
  const goal = limit === 7 ? 1 : 0;

  useEffect(() => {
    if (prefersReducedMotion()) turn.current = goal;
    invalidate();
  }, [goal, invalidate]);

  useFrame((_, delta) => {
    const t = turn.current;
    if (t !== goal) {
      const step = Math.min(delta, 0.05) / TURN_SECONDS;
      turn.current = goal > t ? Math.min(goal, t + step) : Math.max(goal, t - step);
      invalidate();
    }
    // Ease in and out.
    const eased = turn.current * turn.current * (3 - 2 * turn.current);
    group.current?.rotation.set(REVEAL_ROTATION.x * eased, REVEAL_ROTATION.y * eased, 0);
  });
  return group;
}

function LatticeContent({ limit, chord, tonic, phone, onToggle, path }: LatticeSceneProps) {
  const colors = useSceneColors();
  const group = useTurn(limit);
  const nodes = useMemo(() => latticeGrid({ phone, limit }, [...chord, ...(path ?? [])]), [phone, limit, chord, path]);
  const pathPoints = useMemo(() => path?.map(nodePosition) ?? [], [path]);
  const edges = useMemo(() => latticeEdges(nodes), [nodes]);
  const inChord = (n: LatticeNode) => chord.some((m) => sameNode(m, n));
  // Phones keep only the essential labels: the Tonic's major triad and the chord (decision #17).
  // A long comma pump draws nodes beyond the grid: only the chord's are labelled there.
  const grid = useMemo(() => latticeGrid({ phone, limit }), [phone, limit]);
  const labelled = (n: LatticeNode) =>
    inChord(n) ||
    (grid.some((m) => sameNode(m, n)) && (!phone || TONIC_TRIAD.some((m) => sameNode(m, n))));

  return (
    <group ref={group}>
      <Edges edges={edges} kinds={['three', 'five', 'seven']} color={colors.ink} opacity={0.4} />
      <Edges edges={edges} kinds={['diagonal']} color={colors.ink} opacity={0.15} />
      <ChordShape chord={chord} />
      {pathPoints.length > 1 && <PathTube points={pathPoints} color={colors.accent} />}
      {nodes.map((n) => {
        const position = nodePosition(n);
        const picked = inChord(n);
        return (
          <group key={`${n.three}.${n.five}.${n.seven}`}>
            <InkDot position={position} color={colors.ink} size={picked ? 0.13 : 0.075} onSelect={() => onToggle(n)} />
            {labelled(n) && (
              <SceneLabel
                position={[position[0], position[1] - 0.3, position[2]]}
                text={text.nodeLabel(latticeNoteName(tonic, n), nodeRatioText(n))}
                tone={picked ? 'plain' : 'small'}
              />
            )}
          </group>
        );
      })}
      {!phone && <AxisLabels limit={limit} />}
    </group>
  );
}

/** The direction names, at the edges of the desktop grid. */
function AxisLabels({ limit }: { limit: Limit }) {
  return (
    <>
      <SceneLabel position={[2.4, -2.8, 0]} text={text.axes.three} tone="small" />
      <SceneLabel position={[-4.3, 1.4, 0]} text={text.axes.five} tone="small" />
      {limit === 7 && <SceneLabel position={[-2.6, 1.7, 2.6]} text={text.axes.seven} tone="small" />}
    </>
  );
}

const PATH_RADIUS = 0.035;
const UP = new Vector3(0, 1, 0);

/**
 * The comma pump's path (issue #31) in link teal: a thin tube along each step, so it reads
 * above the 1px lattice edges. It ignores clicks, so the nodes under it stay clickable.
 */
function PathTube({ points, color }: { points: readonly Vec3[]; color: string }) {
  const geometry = useMemo(() => new CylinderGeometry(PATH_RADIUS, PATH_RADIUS, 1, 8), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const segments = useMemo(
    () =>
      points.slice(1).map((p, i) => {
        const from = new Vector3(...points[i]!);
        const along = new Vector3(...p).sub(from);
        return {
          position: from.clone().addScaledVector(along, 0.5),
          quaternion: new Quaternion().setFromUnitVectors(UP, along.clone().normalize()),
          length: along.length(),
        };
      }),
    [points],
  );
  return (
    <>
      {segments.map((s, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={s.position}
          quaternion={s.quaternion}
          scale={[1, s.length, 1]}
          raycast={() => null}
        >
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

/** All edges of the given kinds as one set of thin line segments. */
function Edges({
  edges,
  kinds,
  color,
  opacity,
}: {
  edges: ReturnType<typeof latticeEdges>;
  kinds: readonly EdgeKind[];
  color: string;
  opacity: number;
}) {
  const kindsKey = kinds.join(',');
  const segments = useMemo(() => {
    const points: Vector3[] = [];
    for (const e of edges) {
      if (!kindsKey.split(',').includes(e.kind)) continue;
      points.push(new Vector3(...nodePosition(e.from)), new Vector3(...nodePosition(e.to)));
    }
    return new LineSegments(new BufferGeometry().setFromPoints(points), new LineBasicMaterial());
  }, [edges, kindsKey]);
  useEffect(
    () => () => {
      segments.geometry.dispose();
      segments.material.dispose();
    },
    [segments],
  );
  segments.material.color.set(color);
  segments.material.transparent = opacity < 1;
  segments.material.opacity = opacity;
  return <primitive object={segments} />;
}

/** The chord's shape: soft-gold faces with ink edges between neighbouring notes, or an ink line. */
function ChordShape({ chord }: { chord: readonly LatticeNode[] }) {
  const colors = useSceneColors();
  const points = useMemo(() => chord.map(nodePosition), [chord]);
  const faces = useMemo(() => chordFaces(points), [points]);
  const fill = useMemo(() => {
    const geometry = new BufferGeometry().setFromPoints(faces.flat().map((p) => new Vector3(...p)));
    geometry.computeVertexNormals();
    return geometry;
  }, [faces]);
  useEffect(() => () => fill.dispose(), [fill]);
  const outline = useMemo(() => (faces.length === 0 ? lineThrough(points) : neighbourEdges(chord)), [faces, points, chord]);

  return (
    <>
      {faces.length > 0 && (
        <mesh geometry={fill} raycast={() => null} renderOrder={-1}>
          <meshBasicMaterial color={colors.fill} side={DoubleSide} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
      {outline.map((line, i) => (
        <InkLine key={i} points={line} color={colors.ink} />
      ))}
    </>
  );
}

/** For notes in a line (or two notes): one segment from end to end. */
function lineThrough(points: readonly Vec3[]): Vec3[][] {
  if (points.length < 2) return [];
  const first = points[0]!;
  const far = points.reduce((a, p) => (distance(p, first) > distance(a, first) ? p : a), first);
  const ends = points.reduce((a, p) => (distance(p, far) > distance(a, far) ? p : a), far);
  return [[far, ends]];
}

const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** The lattice edges between notes of the chord, drawn in ink over the fill. */
function neighbourEdges(chord: readonly LatticeNode[]): Vec3[][] {
  return latticeEdges(chord).map((e) => [nodePosition(e.from), nodePosition(e.to)]);
}

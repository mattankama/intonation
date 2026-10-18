import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, DoubleSide, type Group, LineBasicMaterial, LineSegments, Vector3 } from 'three';
import { type LatticeNode, latticeNoteName, ratioOfNode } from '../../core';
import { copy } from '../../copy/en';
import { formatRatio } from '../../format/numbers';
import { InkDot, InkLine, Scene3D, SceneLabel, useSceneColors } from '../../scene3d/scene';
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

const text = copy.latticeLab;

/** How long the turn to (or from) the 7-limit takes, in seconds. */
const TURN_SECONDS = 0.8;

export interface LatticeSceneProps {
  limit: Limit;
  chord: readonly LatticeNode[];
  tonic: number;
  phone: boolean;
  onToggle: (node: LatticeNode) => void;
}

/**
 * The just-intonation lattice in 3D (issue #30): flat at 5-limit, turned to reveal the ×7
 * layer at 7-limit; the chord's notes are larger dots and its shape is filled in soft gold.
 * Loaded lazily (with three.js) by LatticeVisual.
 */
export default function LatticeScene(props: LatticeSceneProps) {
  const { phone, limit, chord } = props;
  return (
    <Scene3D label={text.sceneLabel} view={latticeView({ phone, limit }, chord)} className="jl-scene">
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

function LatticeContent({ limit, chord, tonic, phone, onToggle }: LatticeSceneProps) {
  const colors = useSceneColors();
  const group = useTurn(limit);
  const nodes = useMemo(() => latticeGrid({ phone, limit }, chord), [phone, limit, chord]);
  const edges = useMemo(() => latticeEdges(nodes), [nodes]);
  const inChord = (n: LatticeNode) => chord.some((m) => sameNode(m, n));
  // Phones keep only the essential labels: the Tonic's major triad and the chord (decision #17).
  const labelled = (n: LatticeNode) => !phone || inChord(n) || TONIC_TRIAD.some((m) => sameNode(m, n));

  return (
    <group ref={group}>
      <Edges edges={edges} kinds={['three', 'five', 'seven']} color={colors.ink} opacity={0.4} />
      <Edges edges={edges} kinds={['diagonal']} color={colors.ink} opacity={0.15} />
      <ChordShape chord={chord} />
      {nodes.map((n) => {
        const position = nodePosition(n);
        const picked = inChord(n);
        return (
          <group key={`${n.three}.${n.five}.${n.seven}`}>
            <InkDot position={position} color={colors.ink} size={picked ? 0.13 : 0.075} onSelect={() => onToggle(n)} />
            {labelled(n) && (
              <SceneLabel
                position={[position[0], position[1] - 0.3, position[2]]}
                text={text.nodeLabel(latticeNoteName(tonic, n), formatRatio(ratioOfNode(n)))}
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

/**
 * Ink-style drawing primitives for <Scene3D> (decision #13, style A): thin unlit lines,
 * small flat dots, ink rings for pure targets and label chips. No lights, no shading.
 * Colours are CSS colour strings; take them from useSceneColors().
 */
import { type ThreeEvent, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Line, LineBasicMaterial, type Mesh, Vector3 } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Vec3 } from './Scene3D';
import { useSceneColors } from './Scene3D';

/** A pointer that moved further than this (px) between down and up was a drag, not a tap. */
const TAP_SLOP = 6;

/** A thin polyline through the points. */
export function InkLine({
  points,
  color,
  opacity = 1,
}: {
  points: readonly Vec3[];
  color: string;
  opacity?: number;
}) {
  const line = useMemo(
    () => new Line(new BufferGeometry().setFromPoints(points.map((p) => new Vector3(...p))), new LineBasicMaterial()),
    [points],
  );
  useEffect(() => () => line.geometry.dispose(), [line]);
  useEffect(() => () => line.material.dispose(), [line]);
  line.material.color.set(color);
  line.material.transparent = opacity < 1;
  line.material.opacity = opacity;
  return <primitive object={line} />;
}

export interface InkDotProps {
  position: Vec3;
  color: string;
  /** Radius in scene units (default 0.085). */
  size?: number;
  /** Called on a click or tap (not at the end of a drag). Makes the dot pickable. */
  onSelect?: () => void;
}

/** A small flat dot; with onSelect it gets a larger invisible hit area for fingers. */
export function InkDot({ position, color, size = 0.085, onSelect }: InkDotProps) {
  const element = useThree((s) => s.gl.domElement);
  const select = onSelect
    ? {
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta <= TAP_SLOP) onSelect();
        },
        onPointerOver: () => (element.style.cursor = 'pointer'),
        onPointerOut: () => (element.style.cursor = ''),
      }
    : {};
  return (
    <group position={[...position]}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[size, 16, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {onSelect && (
        <mesh {...select}>
          <sphereGeometry args={[Math.max(size * 2.4, 0.18), 8, 6]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  );
}

/** An uncoloured ink ring around a pure target, facing away from `facing` (default: the y axis). */
export function InkRing({ position, radius = 0.2, facing }: { position: Vec3; radius?: number; facing?: Vec3 }) {
  const ring = useRef<Mesh>(null);
  const { ink } = useSceneColors();
  useLayoutEffect(() => {
    const [x, y, z] = position;
    const [fx, fy, fz] = facing ?? [0, y, 0];
    // Face outward: the ring's axis points from `facing` through the ring's centre.
    ring.current?.lookAt(new Vector3(2 * x - fx, 2 * y - fy, 2 * z - fz));
  }, [position, facing]);
  return (
    <mesh ref={ring} position={[...position]} raycast={() => null}>
      <torusGeometry args={[radius, 0.014, 8, 40]} />
      <meshBasicMaterial color={ink} />
    </mesh>
  );
}

export type LabelTone = 'plain' | 'small' | 'accent';

/** A label chip (Source Sans on translucent white) pinned to a point in the scene. */
export function SceneLabel({ position, text, tone = 'plain' }: { position: Vec3; text: string; tone?: LabelTone }) {
  const invalidate = useThree((s) => s.invalidate);
  const object = useMemo(() => new CSS2DObject(document.createElement('div')), []);
  useEffect(() => {
    object.element.className = `scene3d-label scene3d-label-${tone}`;
    object.element.textContent = text;
    invalidate();
  }, [object, text, tone, invalidate]);
  return <primitive object={object} position={[...position]} />;
}

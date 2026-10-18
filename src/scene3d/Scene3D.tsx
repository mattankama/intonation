/**
 * THE SHARED 3D SCENE (issue #26; decisions #13 and #17). Every 3D Lab draws inside one of
 * these: a box on the warm canvas holding a react-three-fiber Canvas that
 * - draws in the ink style: unlit lines, small flat dots and label chips, no lights;
 * - redraws only when something changes (frameloop "demand": rotation, new props);
 * - rotates on drag / one-finger drag and zooms on wheel / pinch inside the box only
 *   (outside it the page scrolls), with a ⟲ Reset view button in the corner;
 * - shows a notice instead when the browser has no 3D graphics (WebGL).
 * Draw with the primitives in ./ink.tsx; they read the token colours from context.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Component,
  type ReactNode,
  type RefObject,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { copy } from '../copy/en';
import { type SceneColors, readSceneColors } from './colors';
import { hasWebGL } from './environment';

export type Vec3 = readonly [number, number, number];

/** Where the camera starts, looking at `target`; Reset view returns here. */
export interface SceneView {
  readonly position: Vec3;
  readonly target: Vec3;
  /** Vertical field of view in degrees (default 40). */
  readonly fov?: number;
}

export interface Scene3DProps {
  /** Accessible name of the scene box, e.g. "Pitch spiral". */
  label: string;
  /** The starting view. Passing a different view re-frames the scene (e.g. auto-framing). */
  view: SceneView;
  /** Scene content, drawn with the ink primitives. */
  children: ReactNode;
  className?: string;
}

const SceneColorsContext = createContext<SceneColors>(readSceneColors());

/** The token colours inside a scene. */
export const useSceneColors = () => useContext(SceneColorsContext);

/** A scene box: the 3D canvas, its label layer and the Reset view button. */
export function Scene3D({ label, view, children, className }: Scene3DProps) {
  const box = useRef<HTMLDivElement>(null);
  const controls = useRef<OrbitControls | null>(null);
  const [failed, setFailed] = useState(() => !hasWebGL());
  const colors = useMemo(readSceneColors, []);
  const text = copy.scene3d;

  return (
    <div ref={box} className={`scene3d ${className ?? ''}`} role="group" aria-label={label}>
      {failed ? (
        <p className="scene3d-notice">{text.unavailable}</p>
      ) : (
        <>
          <SceneErrorBoundary onError={() => setFailed(true)}>
            <Canvas
              className="scene3d-canvas"
              frameloop="demand"
              flat
              dpr={[1, 2]}
              camera={{ fov: view.fov ?? 40, near: 0.1, far: 200, position: [...view.position] }}
              gl={{ antialias: true }}
            >
              <SceneColorsContext value={colors}>
                <color attach="background" args={[colors.background]} />
                <ViewControls view={view} controls={controls} />
                <LabelLayer box={box} />
                {children}
              </SceneColorsContext>
            </Canvas>
          </SceneErrorBoundary>
          <button
            type="button"
            className="scene3d-reset button-tertiary ml-focusable"
            aria-label={text.resetView}
            title={text.resetView}
            onClick={() => controls.current?.reset()}
          >
            <span aria-hidden="true">⟲</span>
            <span className="scene3d-reset-text">{text.resetViewShort}</span>
          </button>
          <p className="scene3d-hint">{text.hint}</p>
        </>
      )}
    </div>
  );
}

/** Orbit controls around the view's target: rotate and zoom, no pan; no damping, so no
 * frames are drawn after the hand stops. */
function ViewControls({ view, controls }: { view: SceneView; controls: RefObject<OrbitControls | null> }) {
  const camera = useThree((s) => s.camera);
  const element = useThree((s) => s.gl.domElement);
  const invalidate = useThree((s) => s.invalidate);
  const key = JSON.stringify(view);

  useEffect(() => {
    const { position, target, fov = 40 } = JSON.parse(key) as SceneView;
    camera.position.set(...position);
    if ('fov' in camera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    const orbit = new OrbitControls(camera, element);
    orbit.target.set(...target);
    orbit.enablePan = false;
    orbit.enableDamping = false;
    const distance = camera.position.distanceTo(orbit.target);
    orbit.minDistance = distance * 0.3;
    orbit.maxDistance = distance * 2.5;
    orbit.update();
    orbit.saveState();
    const redraw = () => invalidate();
    orbit.addEventListener('change', redraw);
    controls.current = orbit;
    invalidate();
    return () => {
      orbit.removeEventListener('change', redraw);
      orbit.dispose();
      controls.current = null;
    };
  }, [camera, element, invalidate, key, controls]);
  return null;
}

/** HTML labels (CSS2DRenderer) over the canvas, drawn in the same frame as the scene. */
function LabelLayer({ box }: { box: RefObject<HTMLDivElement | null> }) {
  const labels = useMemo(() => new CSS2DRenderer(), []);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const layer = labels.domElement;
    layer.className = 'scene3d-labels';
    layer.removeAttribute('style');
    box.current?.appendChild(layer);
    return () => layer.remove();
  }, [labels, box]);
  useEffect(() => labels.setSize(size.width, size.height), [labels, size]);

  // Priority 1 takes over rendering: draw the scene, then place the labels.
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    labels.render(scene, camera);
  }, 1);
  return null;
}

/** Falls back to the notice if the 3D canvas cannot start (e.g. WebGL context lost). */
class SceneErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { error: boolean }> {
  override state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.error ? null : this.props.children;
  }
}

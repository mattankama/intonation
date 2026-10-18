/**
 * The shared 3D scene's HEAVY half (three.js + react-three-fiber): the <Scene3D> box and
 * the ink primitives. Import this ONLY from a Lab's scene file, which the Lab loads with
 * lazyScene() from './index', so three.js stays out of the main bundle (no 3D on the home
 * page or in 2D Labs).
 */
export { Scene3D, type Scene3DProps, type SceneView, type Vec3, useSceneColors } from './Scene3D';
export { InkDot, type InkDotProps, InkLine, InkRing, type LabelTone, SceneLabel } from './ink';

/**
 * The shared 3D scene for every 3D Lab (issue #26), LIGHT half: safe to import anywhere,
 * never pulls in three.js. The scene itself (<Scene3D>, ink primitives) is in './scene';
 * a Lab puts its scene in its own file importing from there and loads it with lazyScene().
 */
export { lazyScene } from './lazy';
export { type SceneColors, SYSTEM_COLOR_TOKENS, readSceneColors, systemColorVar } from './colors';
export { hasWebGL, usePhoneLayout } from './environment';

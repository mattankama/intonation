import { useSyncExternalStore } from 'react';

/**
 * Whether this browser can draw 3D graphics (WebGL). Checked once; when it can't, the
 * scene box shows a notice instead (decision #17) and the rest of the Lab keeps working.
 */
let webgl: boolean | undefined;
export function hasWebGL(): boolean {
  if (webgl === undefined) {
    try {
      const canvas = document.createElement('canvas');
      webgl = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/** The phone layout's breakpoint (decision #12): the same 700px, no device detection. */
const PHONE_QUERY = '(max-width: 699.98px)';

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Whether the phone layout is showing. Scenes use it for their simplified phone version
 * (decision #17: fewer octaves, a smaller grid, a coarser surface).
 */
export function usePhoneLayout(): boolean {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches);
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Whether the person has asked for reduced motion (read at the moment of calling). */
export const prefersReducedMotion = (): boolean => window.matchMedia(REDUCED_MOTION_QUERY).matches;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Whether the person has asked for reduced motion, kept up to date. 3D scenes hold still
 * under it: a transition snaps to its end, a running animation shows one held frame.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion);
}

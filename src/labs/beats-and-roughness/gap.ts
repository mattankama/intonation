/**
 * The beats section's URL state: the gap in Hz between the two tones, `?gap=4.5`
 * (0 to 30 Hz in steps of 0.1 Hz; the default is left out).
 */
export const GAP_KEY = 'gap';
export const GAP_MIN = 0;
/** A little past the ~20 Hz where beats stop being countable and turn into roughness. */
export const GAP_MAX = 30;
export const GAP_STEP = 0.1;
export const DEFAULT_GAP = 3;

/** A gap rounded to the slider's 0.1 Hz steps. */
const toStep = (hz: number) => Math.round(hz * 10) / 10;

/** The gap from the URL, or the default when it is missing or invalid. */
export function readGap(params: URLSearchParams): number {
  const raw = params.get(GAP_KEY);
  if (raw === null || raw.trim() === '') return DEFAULT_GAP;
  const hz = Number(raw);
  if (!Number.isFinite(hz) || hz < GAP_MIN || hz > GAP_MAX) return DEFAULT_GAP;
  return toStep(hz);
}

/** A copy of params with the gap written in; other parameters are kept. */
export function writeGap(params: URLSearchParams, gap: number): URLSearchParams {
  const next = new URLSearchParams(params);
  const hz = toStep(gap);
  if (hz === DEFAULT_GAP) next.delete(GAP_KEY);
  else next.set(GAP_KEY, String(hz));
  return next;
}

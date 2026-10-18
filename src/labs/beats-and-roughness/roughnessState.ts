/**
 * The roughness section's state, shared by its Visual, Controls and Math:
 * - the bottom note and "Show 12-EDO versions", in the URL;
 * - the landscape for the current bottom note, Timbre and grid size (cached: it takes
 *   ~0.1 s to compute the full grid, and three parts read it);
 * - the last chord played, kept for the visit only.
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { playChord } from '../../audio/chords';
import { type Harmonics, type RoughnessLandscape, roughnessLandscape, stackedChord, timbreHarmonics } from '../../core';
import { copy } from '../../copy/en';
import { usePhoneLayout } from '../../scene3d';
import type { Settings } from '../../state/settings';
import { hrefFor, navigate, useLocation } from '../../state/location';
import {
  type BottomNote,
  type LandscapePin,
  type StackedIntervals,
  bottomFrequency,
  landscapePins,
  landscapePoints,
  readBottom,
  readShowEdo12,
  writeBottom,
  writeShowEdo12,
} from './landscape';

const text = copy.roughnessLab;

/** A Lab URL value and a setter that writes it (replaceState). */
function useUrlValue<T>(read: (p: URLSearchParams) => T, write: (p: URLSearchParams, v: T) => URLSearchParams) {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const value = useMemo(() => read(new URLSearchParams(query)), [read, query]);
  const update = useCallback(
    (next: T) => navigate(hrefFor(pathname, write(new URLSearchParams(query), next)), { replace: true }),
    [pathname, query, write],
  );
  return [value, update] as const;
}

export const useBottom = () => useUrlValue<BottomNote>(readBottom, writeBottom);
export const useShowEdo12 = () => useUrlValue<boolean>(readShowEdo12, writeShowEdo12);

/** The nine pinned chords (fixed). */
export const PINS: readonly LandscapePin[] = landscapePins();

/** "major 4:5:6" / "12-EDO major". */
export function pinName(pin: LandscapePin, version: 'pure' | 'edo12'): string {
  const type = copy.chords.types[pin.type].toLowerCase();
  return version === 'pure'
    ? text.pinName(type, pin.proportion.join(':'), pin.withoutFifth)
    : text.edo12Name(type);
}

/** The few most recent landscapes, so Visual, Controls and Math share one computation. */
const cache = new Map<string, RoughnessLandscape>();
function cachedLandscape(bottomHz: number, harmonics: Harmonics, points: number): RoughnessLandscape {
  const key = `${bottomHz}|${points}|${harmonics.join(',')}`;
  let land = cache.get(key);
  if (!land) {
    land = roughnessLandscape(bottomHz, harmonics, points);
    cache.set(key, land);
    if (cache.size > 4) cache.delete(cache.keys().next().value!);
  }
  return land;
}

export interface LandscapeView {
  bottom: BottomNote;
  bottomHz: number;
  harmonics: Harmonics;
  /** Grid points per axis: fewer on phones. */
  points: number;
  landscape: RoughnessLandscape;
  phone: boolean;
}

/** The landscape for the current settings, bottom note and screen. */
export function useLandscape(settings: Settings): LandscapeView {
  const [bottom] = useBottom();
  const phone = usePhoneLayout();
  const points = landscapePoints(phone);
  const bottomHz = bottomFrequency(bottom, settings.referencePitch);
  const key = timbreHarmonics(settings.timbre, settings.brightness).join(',');
  const harmonics = useMemo(() => key.split(',').map(Number), [key]);
  const landscape = useMemo(() => cachedLandscape(bottomHz, harmonics, points), [bottomHz, harmonics, points]);
  return { bottom, bottomHz, harmonics, points, landscape, phone };
}

/** A chord played from the landscape: a pin (pure or 12-EDO) or any point. */
export interface PlayedChord extends StackedIntervals {
  /** "major 4:5:6", "12-EDO major", or null for a point picked on the surface. */
  readonly name: string | null;
}

let played: PlayedChord | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The last chord played here, or null. */
export const usePlayedChord = () => useSyncExternalStore(subscribe, () => played);

/** Plays a chord stacked on the bottom note and remembers it (call from a click). */
export function playStacked(bottomHz: number, chord: PlayedChord): void {
  playChord(stackedChord(bottomHz, chord.lower, chord.upper));
  played = chord;
  listeners.forEach((l) => l());
}

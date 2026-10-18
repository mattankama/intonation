/**
 * The beats section's state, shared by its Visual, Controls and Math:
 * - the gap between the two tones, in the URL (?gap=…);
 * - whether the two tones are playing, kept for the visit only.
 */
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { audioEngine } from '../../audio/engine';
import { beatRate, centsBetween } from '../../core';
import type { Settings } from '../../state/settings';
import { hrefFor, navigate, useLocation } from '../../state/location';
import { readGap, writeGap } from './gap';

/** The gap in Hz and a setter that writes it to the URL. */
export function useGap(): [number, (gap: number) => void] {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const gap = useMemo(() => readGap(new URLSearchParams(query)), [query]);
  const update = useCallback(
    (next: number) => navigate(hrefFor(pathname, writeGap(new URLSearchParams(query), next)), { replace: true }),
    [pathname, query],
  );
  return [gap, update];
}

export interface TwoTones {
  /** Tone 1: A4 at the Reference pitch (Hz). */
  f1: number;
  /** Tone 2: the gap above tone 1 (Hz). */
  f2: number;
  /** Beats per second. */
  rate: number;
  /** The gap as an interval, in cents. */
  cents: number;
}

/** The two tones for the current Reference pitch and gap. */
export function twoTones(settings: Settings, gap: number): TwoTones {
  const f1 = settings.referencePitch;
  const f2 = f1 + gap;
  return { f1, f2, rate: beatRate(f1, f2), cents: centsBetween(f1, f2) };
}

const TONE_1 = 'beats:tone-1';
const TONE_2 = 'beats:tone-2';

let playing = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const setPlaying = (next: boolean) => {
  playing = next;
  listeners.forEach((l) => l());
};

/** Starts both tones together, in step (call from a click: it may start the audio). */
export function startTones({ f1, f2 }: TwoTones): void {
  audioEngine.noteOn(TONE_1, f1);
  audioEngine.noteOn(TONE_2, f2);
  setPlaying(true);
}

export function stopTones(): void {
  if (!playing) return;
  audioEngine.noteOff(TONE_1);
  audioEngine.noteOff(TONE_2);
  setPlaying(false);
}

/** Whether the two tones are sounding. */
export const usePlaying = () => useSyncExternalStore(subscribe, () => playing);

/**
 * Keeps the sounding tones on the current frequencies (gap slider, Reference pitch)
 * without restarting them, and stops them when the Lab is left. Use once, in the Visual.
 */
export function useToneSync({ f1, f2 }: TwoTones): void {
  const sounding = usePlaying();
  useEffect(() => {
    if (!sounding) return;
    audioEngine.setFrequency(TONE_1, f1);
    audioEngine.setFrequency(TONE_2, f2);
  }, [sounding, f1, f2]);
  useEffect(() => stopTones, []);
}

/**
 * The Tuning systems Lab's state, shared by its Visual, Controls and Math:
 * - the compared systems, in the URL (?systems=…);
 * - the picked notes, kept for the visit only and forgotten when the systems or Tonic change.
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { audioEngine } from '../../audio/engine';
import { type TuningSystemId, type TuningTableRow, resolvePitch } from '../../core';
import type { Settings } from '../../state/settings';
import { hrefFor, navigate, useLocation } from '../../state/location';
import { type Pick, pickNote } from './spiral';
import { readSystems, writeSystems } from './systems';

/** The compared systems and a setter that writes them to the URL. */
export function useComparedSystems(): [
  readonly TuningSystemId[],
  (systems: readonly TuningSystemId[]) => void,
] {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const systems = useMemo(() => readSystems(new URLSearchParams(query)), [query]);
  const update = useCallback(
    (next: readonly TuningSystemId[]) =>
      navigate(hrefFor(pathname, writeSystems(new URLSearchParams(query), next)), { replace: true }),
    [pathname, query],
  );
  return [systems, update];
}

let store: { context: string; picks: readonly Pick[] } = { context: '', picks: [] };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const voiceId = (pick: Pick) => `tuning-systems:${pick.system}:${pick.note.pitchClass}:${pick.note.octave}`;

/**
 * The picked notes (none, one, or two for an interval) and the pick handler, which plays
 * the note, or both notes of an interval together.
 */
export function usePicks(
  systems: readonly TuningSystemId[],
  settings: Settings,
): [readonly Pick[], (pick: Pick) => void] {
  const context = `${systems.join(',')}|${settings.tonic}`;
  const current = useSyncExternalStore(subscribe, () => store);
  const picks = current.context === context ? current.picks : [];
  const { tonic, referencePitch } = settings;

  const onPick = useCallback(
    (pick: Pick) => {
      const next = pickNote(store.context === context ? store.picks : [], pick);
      store = { context, picks: next };
      listeners.forEach((l) => l());
      // An interval rings a little longer, so any beats can be heard.
      const seconds = next.length === 2 ? 1.6 : 0.8;
      for (const p of next) {
        const hz = resolvePitch({ system: p.system, tonic }, p.note, referencePitch).frequency;
        audioEngine.pluck(voiceId(p), hz, seconds);
      }
    },
    [context, tonic, referencePitch],
  );
  return [picks, onPick];
}

/** The pick for a table row, `octave` octaves above the table's own octave. */
export const rowPick = (system: TuningSystemId, row: TuningTableRow, octave = 0): Pick => ({
  system,
  note: { pitchClass: row.note.pitchClass, octave: row.note.octave + octave },
  spelling: row.spelling,
  cents: row.cents + 1200 * octave,
});

/** Whether a table row's note (in any octave) is picked. */
export const isPicked = (picks: readonly Pick[], system: TuningSystemId, row: TuningTableRow) =>
  picks.some((p) => p.system === system && p.note.pitchClass === row.note.pitchClass);

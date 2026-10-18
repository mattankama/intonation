/**
 * The EDO explorer's own state (issue #27): the N being explored, `?n=31`. Labs are
 * independent and only the shared settings carry over, so N is the Lab's alone: the
 * Lab's own scale and chord buttons play the N-EDO, while the shared keyboard keeps
 * playing the shared tuning system (until "Use N-EDO as the tuning system").
 * Default: the shared system's N if it is an EDO, else 12; the default is left out.
 */
import { useCallback, useMemo } from 'react';
import {
  CHORD_ROOT_OCTAVE,
  CHORD_TYPES,
  type ChordChoice,
  EDO_MAX,
  EDO_MIN,
  type TuningSystemChoice,
  type TuningSystemId,
  edoDivisions,
  edoSystem,
  resolvePitch,
  tuneChord,
} from '../../core';
import { hrefFor, navigate, useLocation } from '../../state/location';
import { type Settings, writeSettings } from '../../state/settings';

export const N_KEY = 'n';

/** The N shown while the shared tuning system isn't an EDO. */
export const FALLBACK_EDO = 12;

/** The EDOs that dip lowest on the error chart, offered as quick picks. */
export const STANDOUT_EDOS = [12, 19, 31, 53] as const;

/** N when the URL names none: the shared system's N if it is an EDO, else 12. */
export const defaultEdo = (shared: TuningSystemId): number => edoDivisions(shared) ?? FALLBACK_EDO;

/** The N from the URL: a whole number from 5 to 72, else the default. */
export function readExploredEdo(params: URLSearchParams, shared: TuningSystemId): number {
  const raw = params.get(N_KEY);
  if (raw === null || !/^\d+$/.test(raw)) return defaultEdo(shared);
  const n = Number(raw);
  return n >= EDO_MIN && n <= EDO_MAX ? n : defaultEdo(shared);
}

/** A copy of params with N written in (left out when it is the default); others kept. */
export function writeExploredEdo(params: URLSearchParams, n: number, shared: TuningSystemId): URLSearchParams {
  const next = new URLSearchParams(params);
  if (n === defaultEdo(shared)) next.delete(N_KEY);
  else next.set(N_KEY, String(n));
  return next;
}

/**
 * The N being explored, a setter for it, and `makeTuningSystem`, which makes the explored
 * N-EDO the shared tuning system (so the keyboard plays it too).
 */
export function useExploredEdo(settings: Settings) {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const shared = settings.tuningSystem;
  const n = useMemo(() => readExploredEdo(new URLSearchParams(query), shared), [query, shared]);
  const choose = useCallback(
    (next: number) =>
      navigate(hrefFor(pathname, writeExploredEdo(new URLSearchParams(query), next, shared)), { replace: true }),
    [pathname, query, shared],
  );
  const makeTuningSystem = useCallback(() => {
    const system = edoSystem(n);
    const withSystem = writeSettings(new URLSearchParams(query), { ...settings, tuningSystem: system });
    navigate(hrefFor(pathname, writeExploredEdo(withSystem, n, system)), { replace: true });
  }, [n, pathname, query, settings]);
  return { n, choose, makeTuningSystem };
}

/** The explored N-EDO as a tuning system choice (EDOs ignore the Tonic). */
export const edoSystemChoice = (n: number, settings: Settings): TuningSystemChoice => ({
  system: edoSystem(n),
  tonic: settings.tonic,
});

/** The scale: every step from step 0 of octave 4 up to the octave above, as frequencies. */
export function edoScale(n: number, settings: Settings): readonly number[] {
  const systemChoice = edoSystemChoice(n, settings);
  return Array.from(
    { length: n + 1 },
    (_, k) =>
      resolvePitch(systemChoice, { pitchClass: k % n, octave: CHORD_ROOT_OCTAVE + Math.floor(k / n) }, settings.referencePitch)
        .frequency,
  );
}

/** The chords offered: every type on step 0 (the Root C), plus the harmonic 7th 4:5:6:7. */
export const EDO_CHORDS: readonly ChordChoice[] = CHORD_TYPES.flatMap((type) => {
  const chord: ChordChoice = { root: 0, type, inversion: 0, pure: '5-limit' };
  return type === 'dominant-7th' ? [chord, { ...chord, pure: 'alternative' as const }] : [chord];
});

/** A chord as the N-EDO plays it: its steps above step 0, and the tuned chord. */
export function edoChord(n: number, chord: ChordChoice, settings: Settings) {
  const tuned = tuneChord(edoSystemChoice(n, settings), chord, settings.referencePitch);
  const steps = tuned.notes.map((note) => (note.note.octave - CHORD_ROOT_OCTAVE) * n + note.note.pitchClass);
  return { steps, tuned };
}

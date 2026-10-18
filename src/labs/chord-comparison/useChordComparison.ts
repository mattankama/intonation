import { useCallback, useMemo } from 'react';
import {
  type NotePairBeats,
  type TunedChord,
  type Tuning,
  type TuningSystemId,
  chordBeats,
  timbreHarmonics,
  tuneChord,
} from '../../core';
import { hrefFor, navigate, useLocation } from '../../state/location';
import type { Settings } from '../../state/settings';
import {
  type ChordComparisonState,
  comparedSystems,
  readChordState,
  writeChordState,
} from './chordState';

/** Chord comparison's state from the URL, and a way to change it (replacing the entry). */
export function useChordComparison(): [ChordComparisonState, (change: Partial<ChordComparisonState>) => void] {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const state = useMemo(() => readChordState(new URLSearchParams(query)), [query]);
  const update = useCallback(
    (change: Partial<ChordComparisonState>) => {
      const next = writeChordState(new URLSearchParams(query), { ...state, ...change });
      navigate(hrefFor(pathname, next), { replace: true });
    },
    [pathname, query, state],
  );
  return [state, update];
}

/** One column: a tuning system's version of the chord, with its beats. */
export interface SystemColumn {
  readonly system: TuningSystemId;
  readonly tuning: Tuning;
  readonly tuned: TunedChord;
  readonly beats: readonly NotePairBeats[];
}

export interface ChordColumns {
  /** The pure chord on 12-EDO's root, as the shared baseline column. */
  readonly pure: { readonly frequencies: readonly number[]; readonly beats: readonly NotePairBeats[] };
  /** The 12-EDO version, whose root the pure column is built on. */
  readonly pureRoot: TunedChord;
  readonly systems: readonly SystemColumn[];
}

/** Every column the Lab shows, from its state and the shared settings. */
export function chordColumns(state: ChordComparisonState, settings: Settings): ChordColumns {
  const harmonics = timbreHarmonics(settings.timbre, settings.brightness);
  const tune = (tuning: Tuning) => tuneChord(tuning, state.chord, settings.referencePitch);
  const pureRoot = tune({ system: '12-edo', tonic: settings.tonic });
  const pureFrequencies = pureRoot.notes.map((n) => n.pureFrequency);
  return {
    pure: { frequencies: pureFrequencies, beats: chordBeats(pureFrequencies, harmonics) },
    pureRoot,
    systems: comparedSystems(state.systems, settings).map((system) => {
      const tuning = { system, tonic: settings.tonic };
      const tuned = tune(tuning);
      return { system, tuning, tuned, beats: chordBeats(tuned.notes.map((n) => n.frequency), harmonics) };
    }),
  };
}

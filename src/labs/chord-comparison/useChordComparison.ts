import { useCallback, useMemo } from 'react';
import {
  type NotePairBeats,
  type TunedChord,
  type TuningSystemChoice,
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
  readonly systemChoice: TuningSystemChoice;
  readonly tuned: TunedChord;
  readonly beats: readonly NotePairBeats[];
  /**
   * The pure chord this column's cents off pure are measured from: built on the root this
   * system produces (decision #7), bass first.
   */
  readonly pureFrequencies: readonly number[];
}

export interface ChordColumns {
  /**
   * The pure chord column: the pure chord on the FIRST compared system's root, the same
   * target that column (and The math) measures against. Every column has its own in
   * `pureFrequencies`, since each system produces its own root.
   */
  readonly pure: {
    readonly anchor: SystemColumn;
    readonly frequencies: readonly number[];
    readonly beats: readonly NotePairBeats[];
  };
  readonly systems: readonly SystemColumn[];
}

/** Every column the Lab shows, from its state and the shared settings. */
export function chordColumns(state: ChordComparisonState, settings: Settings): ChordColumns {
  const harmonics = timbreHarmonics(settings.timbre, settings.brightness);
  const column = (system: TuningSystemId): SystemColumn => {
    const systemChoice = { system, tonic: settings.tonic };
    const tuned = tuneChord(systemChoice, state.chord, settings.referencePitch);
    return {
      system,
      systemChoice,
      tuned,
      beats: chordBeats(tuned.notes.map((n) => n.frequency), harmonics),
      pureFrequencies: tuned.notes.map((n) => n.pureFrequency),
    };
  };
  const systems = comparedSystems(state.systems, settings).map(column);
  const anchor = systems[0] ?? column('12-edo');
  return {
    pure: { anchor, frequencies: anchor.pureFrequencies, beats: chordBeats(anchor.pureFrequencies, harmonics) },
    systems,
  };
}

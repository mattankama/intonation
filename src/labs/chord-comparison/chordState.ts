/**
 * Chord comparison's own state, kept in the URL beside the shared settings:
 * `root` (C, D-flat … B), `chord` (type), `inv` (inversion), `pure` (alternative) and
 * `compare` (up to four tuning systems, e.g. `12-edo.meantone.31-edo`). Defaults are left
 * out; invalid values fall back to them.
 */
import {
  CHORD_TYPES,
  type ChordChoice,
  type TuningSystemId,
  chordSize,
  hasAlternativePureChord,
  parseTuningSystem,
  tonicSpelling,
} from '../../core';
import type { Settings } from '../../state/settings';

export interface ChordComparisonState {
  chord: ChordChoice;
  /** The tuning systems chosen for the columns; null until chosen (see comparedSystems). */
  systems: readonly TuningSystemId[] | null;
}

/** At most four tuning systems are compared, beside the pure chord. */
export const MAX_SYSTEMS = 4;

const KEYS = { root: 'root', type: 'chord', inversion: 'inv', pure: 'pure', systems: 'compare' };
const SYSTEM_SEPARATOR = '.';

export const DEFAULT_CHORD: ChordChoice = { root: 0, type: 'major', inversion: 0, pure: '5-limit' };

/** A Root in the URL: its familiar name in ASCII, as the Tonic is written ("A-flat"). */
const rootSlug = (pitchClass: number) =>
  tonicSpelling(pitchClass).replace('♭', '-flat').replace('♯', '-sharp');
const ROOT_SLUGS = Array.from({ length: 12 }, (_, pc) => rootSlug(pc));

/** The systems compared before any are chosen: the shared one, then three familiar ones. */
const STARTING_SYSTEMS: readonly TuningSystemId[] = ['12-edo', 'meantone', 'just'];

/** The columns: the chosen systems, or the shared tuning system and the starting three. */
export function comparedSystems(
  systems: readonly TuningSystemId[] | null,
  settings: Settings,
): readonly TuningSystemId[] {
  return systems ?? [...new Set([settings.tuningSystem, ...STARTING_SYSTEMS])].slice(0, MAX_SYSTEMS);
}

export function readChordState(params: URLSearchParams): ChordComparisonState {
  const rootIndex = ROOT_SLUGS.indexOf(params.get(KEYS.root) ?? '');
  const type = CHORD_TYPES.find((t) => t === params.get(KEYS.type)) ?? DEFAULT_CHORD.type;
  const rawInversion = params.get(KEYS.inversion) ?? '';
  const inversion = /^[1-3]$/.test(rawInversion) ? Number(rawInversion) : 0;
  const alternative = params.get(KEYS.pure) === 'alternative' && hasAlternativePureChord(type);
  const systems = [
    ...new Set(
      (params.get(KEYS.systems) ?? '')
        .split(SYSTEM_SEPARATOR)
        .map(parseTuningSystem)
        .filter((s) => s !== undefined),
    ),
  ].slice(0, MAX_SYSTEMS);
  return {
    chord: {
      root: rootIndex === -1 ? DEFAULT_CHORD.root : rootIndex,
      type,
      inversion: inversion < chordSize(type) ? inversion : 0,
      pure: alternative ? 'alternative' : '5-limit',
    },
    systems: systems.length > 0 ? systems : null,
  };
}

/** A copy of params with the state written in; other parameters are kept. */
export function writeChordState(params: URLSearchParams, state: ChordComparisonState): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (key: string, value: string | null) =>
    value === null ? next.delete(key) : next.set(key, value);
  const { root, type, inversion, pure } = state.chord;
  set(KEYS.root, root === DEFAULT_CHORD.root ? null : rootSlug(root));
  set(KEYS.type, type === DEFAULT_CHORD.type ? null : type);
  set(KEYS.inversion, inversion === 0 ? null : String(inversion));
  set(KEYS.pure, pure === '5-limit' ? null : pure);
  set(KEYS.systems, state.systems ? state.systems.join(SYSTEM_SEPARATOR) : null);
  return next;
}

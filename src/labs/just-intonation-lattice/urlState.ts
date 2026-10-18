/**
 * The Just-intonation lattice Lab's URL bindings: each hook reads its part of the Lab's
 * state from the address bar and returns a setter that writes it back (replaceState).
 * The pure read/write rules are in ./latticeState.ts and ./pumpState.ts.
 */
import { useCallback, useMemo } from 'react';
import { hrefFor, navigate, useLocation } from '../../state/location';
import { type LatticeState, readLattice, writeLattice } from './latticeState';
import { type PumpState, readPump, writePump } from './pumpState';

function useUrlState<T>(
  read: (params: URLSearchParams) => T,
  write: (params: URLSearchParams, next: T) => URLSearchParams,
): [T, (next: T) => void] {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const state = useMemo(() => read(new URLSearchParams(query)), [read, query]);
  const update = useCallback(
    (next: T) => navigate(hrefFor(pathname, write(new URLSearchParams(query), next)), { replace: true }),
    [write, pathname, query],
  );
  return [state, update];
}

/** The chord and the limit. */
export const useLattice = (): [LatticeState, (next: LatticeState) => void] => useUrlState(readLattice, writeLattice);

/** The comma explorer (null: building a chord). */
export const usePump = (): [PumpState | null, (next: PumpState | null) => void] => useUrlState(readPump, writePump);

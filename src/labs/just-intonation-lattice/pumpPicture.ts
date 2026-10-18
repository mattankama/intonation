/**
 * What the lattice shows for the comma explorer (issue #31): the steps so far, the teal
 * path of roots, the current chord and the loop to frame. Pure, from the URL's pump state.
 */
import { useMemo } from 'react';
import { type CommaPumpId, type LatticeNode, type PumpStep, commaPumpLength, nodeOfFactors, runCommaPump } from '../../core';
import type { LatticeLayout } from './geometry';
import { type PumpState, maxPumpStep, pumpLimit } from './pumpState';

export interface PumpPicture {
  readonly id: CommaPumpId;
  /** Every step so far, the current one last. */
  readonly run: readonly PumpStep[];
  readonly current: PumpStep;
  /** The roots so far, in order: the teal path. */
  readonly path: readonly LatticeNode[];
  /** The current chord's notes. */
  readonly chord: readonly LatticeNode[];
  /** Every node of the loop on screen (home belongs to the loop just finished), for framing the desktop view. */
  readonly frame: readonly LatticeNode[];
  readonly limit: LatticeLayout['limit'];
  /** Whether Next can step on. */
  readonly canStep: boolean;
}

const chordNodes = (s: PumpStep) => s.notes.map((n) => nodeOfFactors(n.pitch));

export function pumpPicture({ id, step }: PumpState): PumpPicture {
  const length = commaPumpLength(id);
  const current = runCommaPump(id, step);
  // The loop on screen: arriving home still shows the loop just finished.
  const last = current.at(-1)!;
  const loopStart = (last.position === 0 && last.loop > 0 ? last.loop - 1 : last.loop) * length;
  const loop = runCommaPump(id, loopStart + length).slice(loopStart);
  return {
    id,
    run: current,
    current: last,
    path: current.map((s) => nodeOfFactors(s.root)),
    chord: chordNodes(last),
    frame: loop.flatMap((s) => [nodeOfFactors(s.root), ...chordNodes(s)]),
    limit: pumpLimit(id),
    canStep: step < maxPumpStep(id),
  };
}

/** The picture for the URL's pump, recomputed only when it changes. */
export function usePumpPicture(state: PumpState | null): PumpPicture | null {
  const id = state?.id;
  const step = state?.step;
  return useMemo(() => (id === undefined ? null : pumpPicture({ id, step: step! })), [id, step]);
}

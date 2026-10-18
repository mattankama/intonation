/**
 * The comma explorer's state in the URL (issue #31), beside the chord (./chord.ts):
 * - `?pump=syntonic`: the comma explorer is on, with this preset (absent: build a chord);
 * - `?step=6`: the steps taken so far, loops included (default 0, the starting chord).
 */
import { COMMA_PUMP_IDS, type CommaPumpId, commaPumpLength, runCommaPump } from '../../core';
import type { Limit } from './chord';

export const PUMP_KEY = 'pump';
export const STEP_KEY = 'step';

/** Loops repeat until Reset, up to this many. */
export const MAX_LOOPS = 12;

export interface PumpState {
  readonly id: CommaPumpId;
  readonly step: number;
}

/** The last step: MAX_LOOPS loops, back home. */
export const maxPumpStep = (id: CommaPumpId) => commaPumpLength(id) * MAX_LOOPS;

const isPumpId = (raw: string | null): raw is CommaPumpId => COMMA_PUMP_IDS.includes(raw as CommaPumpId);

/** The comma explorer from the URL, or null when the lattice is building a chord. */
export function readPump(params: URLSearchParams): PumpState | null {
  const id = params.get(PUMP_KEY);
  if (!isPumpId(id)) return null;
  const raw = params.get(STEP_KEY);
  const step = raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0;
  return { id, step: step <= maxPumpStep(id) ? step : 0 };
}

/** A copy of params with the comma explorer written in (null turns it off); other parameters kept. */
export function writePump(params: URLSearchParams, state: PumpState | null): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(PUMP_KEY);
  next.delete(STEP_KEY);
  if (state) {
    next.set(PUMP_KEY, state.id);
    if (state.step > 0) next.set(STEP_KEY, String(state.step));
  }
  return next;
}

/** A pump that steps into ×7 shows the lattice turned to the 7-limit. */
export function pumpLimit(id: CommaPumpId): Limit {
  const usesSeven = runCommaPump(id, commaPumpLength(id)).some((s) => s.notes.some((n) => n.pitch.seven !== 0));
  return usesSeven ? 7 : 5;
}

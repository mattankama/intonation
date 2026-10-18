/**
 * The comma explorer's state in the URL (issue #31), beside the chord (./latticeState.ts):
 * - `?pump=syntonic`: the comma explorer is on, with this preset (absent: build a chord);
 * - `?step=6`: the steps taken so far, loops included (default 0, the starting chord).
 *   Loops repeat and drift accumulates until Reset (issue #31): pitches are exact prime
 *   exponents, so there is no musical limit, only MAX_PUMP_STEP against hand-edited URLs.
 */
import { COMMA_PUMP_IDS, type CommaPumpId, commaPumpLength, runCommaPump } from '../../core';
import type { Limit } from './latticeState';

export const PUMP_KEY = 'pump';
export const STEP_KEY = 'step';

/**
 * The furthest step a URL may ask for: ten thousand clicks of Next (hundreds of loops), so
 * nobody meets it by playing, but a hand-edited `?step=` cannot ask for millions of chords.
 */
export const MAX_PUMP_STEP = 10_000;

export interface PumpState {
  readonly id: CommaPumpId;
  readonly step: number;
}

const isPumpId = (raw: string | null): raw is CommaPumpId => COMMA_PUMP_IDS.includes(raw as CommaPumpId);

/** The comma explorer from the URL, or null when the lattice is building a chord. */
export function readPump(params: URLSearchParams): PumpState | null {
  const id = params.get(PUMP_KEY);
  if (!isPumpId(id)) return null;
  const raw = params.get(STEP_KEY);
  const step = raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0;
  return { id, step: step <= MAX_PUMP_STEP ? step : 0 };
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

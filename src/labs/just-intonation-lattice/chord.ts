/**
 * The Just-intonation lattice Lab's own state, kept in the URL so a link shares it:
 * - `?chord=1/1,5/4,3/2`: the chord built on the lattice, as ratios above the Tonic in the
 *   order the notes were added (default: the major triad on the Tonic; `chord=` is empty);
 * - `?limit=7`: the lattice turned to show the ×7 direction (default: flat, 5-limit).
 */
import { type LatticeNode, nodeOfRatio, ratio, ratioOfNode } from '../../core';
import { formatRatio } from '../../format/numbers';

export type Limit = 5 | 7;

export interface LatticeState {
  readonly limit: Limit;
  readonly chord: readonly LatticeNode[];
}

export const CHORD_KEY = 'chord';
export const LIMIT_KEY = 'limit';
export const MAX_CHORD_NOTES = 6;

const node = (three: number, five = 0, seven = 0): LatticeNode => ({ three, five, seven });

/** The major triad on the Tonic, 1/1 · 5/4 · 3/2 (4:5:6). */
export const TONIC_TRIAD: readonly LatticeNode[] = [node(0), node(0, 1), node(1)];

export const sameNode = (a: LatticeNode, b: LatticeNode) =>
  a.three === b.three && a.five === b.five && a.seven === b.seven;

const usesSeven = (chord: readonly LatticeNode[]) => chord.some((n) => n.seven !== 0);

function parseNode(raw: string): LatticeNode | null {
  const match = /^(\d+)\/(\d+)$/.exec(raw.trim());
  if (!match) return null;
  const num = Number(match[1]);
  const den = Number(match[2]);
  if (num === 0 || den === 0 || !Number.isSafeInteger(num) || !Number.isSafeInteger(den)) return null;
  return nodeOfRatio(ratio(num, den));
}

/** The state in the URL: valid, distinct notes, at most six; a chord using ×7 shows the 7-limit. */
export function readLattice(params: URLSearchParams): LatticeState {
  const raw = params.get(CHORD_KEY);
  let chord: readonly LatticeNode[] = TONIC_TRIAD;
  if (raw !== null) {
    const notes: LatticeNode[] = [];
    for (const part of raw.split(',')) {
      const n = parseNode(part);
      if (n && !notes.some((m) => sameNode(m, n)) && notes.length < MAX_CHORD_NOTES) notes.push(n);
    }
    chord = notes;
  }
  const limit: Limit = params.get(LIMIT_KEY) === '7' || usesSeven(chord) ? 7 : 5;
  return { limit, chord };
}

const isTonicTriad = (chord: readonly LatticeNode[]) =>
  chord.length === TONIC_TRIAD.length && chord.every((n, i) => sameNode(n, TONIC_TRIAD[i]!));

/** A copy of params with the state written in; defaults are left out, other parameters kept. */
export function writeLattice(params: URLSearchParams, state: LatticeState): URLSearchParams {
  const next = new URLSearchParams(params);
  if (isTonicTriad(state.chord)) next.delete(CHORD_KEY);
  else next.set(CHORD_KEY, state.chord.map((n) => formatRatio(ratioOfNode(n))).join(','));
  if (state.limit === 7) next.set(LIMIT_KEY, '7');
  else next.delete(LIMIT_KEY);
  return next;
}

/** Adds the node to the chord, or removes it if it is there; a full chord drops its oldest note. */
export function toggleNode(chord: readonly LatticeNode[], n: LatticeNode): readonly LatticeNode[] {
  if (chord.some((m) => sameNode(m, n))) return chord.filter((m) => !sameNode(m, n));
  const kept = chord.length >= MAX_CHORD_NOTES ? chord.slice(chord.length - MAX_CHORD_NOTES + 1) : chord;
  return [...kept, n];
}

/** Switches the limit; going back to 5-limit drops the chord's ×7 notes. */
export function setLimit(state: LatticeState, limit: Limit): LatticeState {
  return { limit, chord: limit === 5 ? state.chord.filter((n) => n.seven === 0) : state.chord };
}

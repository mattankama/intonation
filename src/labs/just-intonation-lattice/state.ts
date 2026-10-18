/**
 * The Just-intonation lattice Lab's state, shared by its Visual, Controls and Math: the
 * chord and the limit, both in the URL (see ./chord.ts). Also how the chord sounds.
 */
import { useCallback, useMemo } from 'react';
import { audioEngine } from '../../audio/engine';
import {
  type LatticeNode,
  type Ratio,
  chordProportion,
  edo12Frequency,
  latticeNoteName,
  ratioOfNode,
  ratioValue,
} from '../../core';
import { formatRatio } from '../../format/numbers';
import { hrefFor, navigate, useLocation } from '../../state/location';
import type { Settings } from '../../state/settings';
import { type LatticeState, readLattice, writeLattice } from './chord';

/** The lattice state from the URL and a setter that writes it back (replaceState). */
export function useLattice(): [LatticeState, (next: LatticeState) => void] {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const state = useMemo(() => readLattice(new URLSearchParams(query)), [query]);
  const update = useCallback(
    (next: LatticeState) =>
      navigate(hrefFor(pathname, writeLattice(new URLSearchParams(query), next)), { replace: true }),
    [pathname, query],
  );
  return [state, update];
}

/** The Tonic's pitch in octave 4: its 12-EDO frequency from the Reference pitch. 1/1 sounds here. */
export const tonicFrequency = (settings: Settings) =>
  edo12Frequency({ pitchClass: settings.tonic, octave: 4 }, settings.referencePitch);

/** One note of the chord, with everything shown about it. */
export interface ChordNote {
  readonly node: LatticeNode;
  readonly ratio: Ratio;
  readonly name: string;
  /** "E 5/4": the node's label everywhere. */
  readonly label: string;
}

export function chordNote(node: LatticeNode, tonic: number): ChordNote {
  const r = ratioOfNode(node);
  const name = latticeNoteName(tonic, node);
  return { node, ratio: r, name, label: `${name} ${formatRatio(r)}` };
}

/** The chord's notes, lowest first. */
export function chordNotes(chord: readonly LatticeNode[], tonic: number): ChordNote[] {
  return chord
    .map((n) => chordNote(n, tonic))
    .sort((a, b) => ratioValue(a.ratio) - ratioValue(b.ratio));
}

/** "4:5:6", or null for fewer than two notes. */
export function proportionText(notes: readonly ChordNote[]): string | null {
  return notes.length < 2 ? null : chordProportion(notes.map((n) => n.ratio)).join(':');
}

const voiceId = (n: LatticeNode) => `lattice:${n.three}.${n.five}.${n.seven}`;

/** Plays the chord: every note at once, each at the Tonic's pitch times its ratio. */
export function playChord(chord: readonly LatticeNode[], settings: Settings) {
  const tonic = tonicFrequency(settings);
  for (const n of chord) audioEngine.pluck(voiceId(n), tonic * ratioValue(ratioOfNode(n)), 1.6);
}

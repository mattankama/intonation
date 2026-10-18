/**
 * How the Just-intonation lattice Lab names what it shows: node labels ("E 5/4"), the
 * chord's notes and proportion, and the comma pumps' chord symbols and descriptions.
 */
import {
  type CommaPumpId,
  type LatticeNode,
  type PrimeFactors,
  type PumpStep,
  type Ratio,
  chordProportion,
  commaPumpComma,
  commaPumpLength,
  factorsCents,
  latticeNoteName,
  nodeOfFactors,
  octaveReduceFactors,
  ratioOfNode,
  ratioValue,
  runCommaPump,
} from '../../core';
import { copy } from '../../copy/en';
import { formatPitchRatio, formatRatio } from '../../format/numbers';

const pumpText = copy.latticeLab.pump;

// --- Nodes and the chord ------------------------------------------------------------------

/** "5/4": a node's ratio, octave-reduced, exact however far a comma pump has gone ("3¹²⁰⁰/2¹⁹⁰¹"). */
export const nodeRatioText = (n: LatticeNode) => formatPitchRatio(octaveReduceFactors({ two: 0, ...n }));

/** "E 5/4": a pitch's name and ratio, as the lattice labels its node. */
export const pitchLabel = (tonic: number, pitch: PrimeFactors) => {
  const n = nodeOfFactors(pitch);
  return `${latticeNoteName(tonic, n)} ${nodeRatioText(n)}`;
};

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

// --- Comma pumps --------------------------------------------------------------------------

/** "Am": the chord symbol of a step, spelled from its root's node. */
export const stepSymbol = (tonic: number, step: PumpStep) =>
  pumpText.symbol(latticeNoteName(tonic, nodeOfFactors(step.root)), step.chord.type);

/** "C–Am–Dm–G–C": one loop's chords, spelled from the Tonic. */
export function loopSymbols(tonic: number, id: CommaPumpId): string {
  return runCommaPump(id, commaPumpLength(id))
    .map((s) => stepSymbol(tonic, s))
    .join('–');
}

/** "C–Am–Dm–G–C: home comes back 21.5¢ flat (80/81)." */
export function pumpDescription(tonic: number, id: CommaPumpId, formatSize: (cents: number) => string): string {
  const comma = commaPumpComma(id);
  const drift = factorsCents(comma);
  return pumpText.description(
    loopSymbols(tonic, id),
    formatSize(Math.abs(drift)),
    drift > 0,
    formatPitchRatio(comma),
  );
}

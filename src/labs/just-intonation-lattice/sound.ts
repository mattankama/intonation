/**
 * How the Just-intonation lattice sounds: 1/1 is the Tonic's 12-EDO pitch in octave 4,
 * and every other note is that pitch times its exact ratio. One-shot sounds only; the
 * comma explorer's stepping and drone are in ./pumpPlayback.ts.
 */
import { playChord as playFrequencies } from '../../audio/chords';
import { audioEngine } from '../../audio/engine';
import {
  type LatticeNode,
  type PrimeFactors,
  type PumpStep,
  edo12Frequency,
  factorsCents,
  octaveReduceFactors,
  ratioOfNode,
  ratioValue,
} from '../../core';
import type { Settings } from '../../state/settings';

/** The Tonic's pitch in octave 4: its 12-EDO frequency from the Reference pitch. 1/1 sounds here. */
export const tonicFrequency = (settings: Settings) =>
  edo12Frequency({ pitchClass: settings.tonic, octave: 4 }, settings.referencePitch);

const voiceId = (n: LatticeNode) => `lattice:${n.three}.${n.five}.${n.seven}`;

/** Plays the chord: every note at once, each at the Tonic's pitch times its ratio. */
export function playChord(chord: readonly LatticeNode[], settings: Settings) {
  const tonic = tonicFrequency(settings);
  for (const n of chord) audioEngine.pluck(voiceId(n), tonic * ratioValue(ratioOfNode(n)), 1.6);
}

/** A pitch above the starting Tonic, in Hz: 1/1 is the Tonic's 12-EDO pitch in octave 4. */
export const pitchFrequency = (settings: Settings, pitch: PrimeFactors) =>
  tonicFrequency(settings) * 2 ** (factorsCents(pitch) / 1200);

/** Plays one comma-pump step's chord, replacing the chord before. */
export function playStep(step: PumpStep, settings: Settings): void {
  playFrequencies(step.notes.map((n) => pitchFrequency(settings, n.pitch)));
}

/** Plays a node tapped on the lattice in the comma explorer, in the octave above 1/1. */
export function playNode(node: LatticeNode, settings: Settings): void {
  audioEngine.pluck('comma:node', pitchFrequency(settings, octaveReduceFactors({ two: 0, ...node })), 1.6);
}

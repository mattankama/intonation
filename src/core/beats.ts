/**
 * Beats between the notes of a chord (decision #5 Audible beats, research/audible-beats.md).
 *
 * Harmonic i of the lower note and harmonic j of the upper note beat at
 * Δf = |i·f_A − j·f_B|. A pair counts as a beat while Δf is at most 20 Hz (faster than
 * that it is heard as roughness), checked for harmonics 1–8. Each beat is weighted by the
 * weaker of its two partials, min(aᵢ, aⱼ), which sets how deep the wobble is; beats below
 * −20 dB of the strongest partial are hidden, and each note pair keeps its top two.
 */
import type { Harmonics } from './timbre';

/** Harmonics 1–8 are checked for beats; higher ones are left to roughness. */
export const BEAT_HARMONICS = 8;
/** Differences up to 20 Hz are heard as countable beats. */
export const BEAT_MAX_HZ = 20;
/** Beats weaker than 0.1 × the strongest partial (−20 dB) are hidden. */
export const BEAT_FLOOR = 0.1;
/** Each note pair shows at most this many beats, strongest first. */
export const BEATS_PER_PAIR = 2;
/** Partials closer than this coincide: they don't beat at all. */
const COINCIDENT_HZ = 1e-6;

export interface Beat {
  /** [i, j]: harmonic i of the lower note against harmonic j of the upper note. */
  readonly harmonics: readonly [number, number];
  /** Beats per second, Δf = |i·f_A − j·f_B|. */
  readonly rate: number;
  /** min(aᵢ, aⱼ): the weaker partial's amplitude. */
  readonly weight: number;
}

export interface NotePairBeats {
  /** Indices of the two notes in the frequencies given, lower index first. */
  readonly lower: number;
  readonly upper: number;
  /** Strongest first; empty when no partials are close enough to beat. */
  readonly beats: readonly Beat[];
}

/** The audible beats between every pair of notes of a chord, all played with one Timbre. */
export function chordBeats(frequencies: readonly number[], harmonics: Harmonics): NotePairBeats[] {
  const amplitudes = harmonics.slice(0, BEAT_HARMONICS);
  const floor = BEAT_FLOOR * Math.max(0, ...harmonics);
  const pairs: NotePairBeats[] = [];
  frequencies.forEach((fA, lower) => {
    frequencies.forEach((fB, upper) => {
      if (upper <= lower) return;
      const beats: Beat[] = [];
      amplitudes.forEach((aI, i) => {
        amplitudes.forEach((aJ, j) => {
          const rate = Math.abs((i + 1) * fA - (j + 1) * fB);
          const weight = Math.min(aI, aJ);
          if (rate < COINCIDENT_HZ || rate > BEAT_MAX_HZ || weight <= 0 || weight < floor) return;
          beats.push({ harmonics: [i + 1, j + 1], rate, weight });
        });
      });
      beats.sort((a, b) => b.weight - a.weight || a.rate - b.rate);
      pairs.push({ lower, upper, beats: beats.slice(0, BEATS_PER_PAIR) });
    });
  });
  return pairs;
}

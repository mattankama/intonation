/**
 * Roughness (decision #4 Roughness model, research/roughness-model.md): Sethares'
 * parameterisation of the Plomp–Levelt curve, 2nd-edition form (Tuning, Timbre, Spectrum,
 * Scale, App. E).
 *
 * Two sine partials f₁ < f₂ with amplitudes a₁, a₂ are as rough as
 *   d = min(a₁, a₂) · [e^(−b₁·s·Δf) − e^(−b₂·s·Δf)],  s = x* / (s₁·f₁ + s₂),
 * and a chord is as rough as the sum of d over EVERY unordered pair of partials of all its
 * notes pooled together (TTSS eq. E.6), intra-note pairs included, coinciding partials not
 * merged. Values are in arbitrary units: compare them, don't read them absolutely.
 */
import type { Harmonics } from './timbre';

/** The model's constants (TTSS App. E eqs. E.1–E.4; s₁, s₂ from Sethares' dissmeasure.m). */
export const ROUGHNESS_CONSTANTS = {
  /** How fast roughness rises with the gap. */
  b1: 3.5,
  /** How fast it falls again. */
  b2: 5.75,
  /** Scales the gap of greatest roughness. */
  xStar: 0.24,
  /** Register dependence: slope … */
  s1: 0.0207,
  /** … and offset (Hz). */
  s2: 18.96,
} as const;

const { b1: B1, b2: B2, xStar: X_STAR, s1: S1, s2: S2 } = ROUGHNESS_CONSTANTS;
/** Past s·Δf = 2.5 a pair is below 0.1% of its peak: skipped (research §2, optional cutoff). */
const CUTOFF = 2.5;

/** s = x* / (s₁·f + s₂): stretches the curve to the register of the lower partial f (Hz). */
export function roughnessScale(f: number): number {
  return X_STAR / (S1 * f + S2);
}

/** The roughness of two sine partials (either order). */
export function partialRoughness(f1: number, f2: number, a1: number, a2: number): number {
  const s = roughnessScale(Math.min(f1, f2));
  const x = s * Math.abs(f2 - f1);
  return Math.min(a1, a2) * (Math.exp(-B1 * x) - Math.exp(-B2 * x));
}

/**
 * A reusable roughness meter for chords of up to `maxNotes` notes in one Timbre: it keeps
 * its partial buffers, so a landscape of thousands of chords allocates nothing per chord.
 */
function roughnessMeter(harmonics: Harmonics, maxNotes: number) {
  const numbers: number[] = [];
  const amplitudes: number[] = [];
  harmonics.forEach((a, i) => {
    if (a > 0) {
      numbers.push(i + 1);
      amplitudes.push(a);
    }
  });
  const size = numbers.length * maxNotes;
  const freq = new Float64Array(size);
  const amp = new Float64Array(size);
  const order = new Uint16Array(size);
  const sortedFreq = new Float64Array(size);
  const sortedAmp = new Float64Array(size);

  return (frequencies: readonly number[]): number => {
    let n = 0;
    for (const f of frequencies) {
      for (let h = 0; h < numbers.length; h++) {
        freq[n] = numbers[h]! * f;
        amp[n] = amplitudes[h]!;
        order[n] = n;
        n++;
      }
    }
    // Sort by frequency (insertion sort: each note's partials are already in order).
    for (let i = 1; i < n; i++) {
      const k = order[i]!;
      let j = i - 1;
      while (j >= 0 && freq[order[j]!]! > freq[k]!) {
        order[j + 1] = order[j]!;
        j--;
      }
      order[j + 1] = k;
    }
    for (let i = 0; i < n; i++) {
      sortedFreq[i] = freq[order[i]!]!;
      sortedAmp[i] = amp[order[i]!]!;
    }
    let total = 0;
    for (let i = 0; i < n; i++) {
      const fi = sortedFreq[i]!;
      const ai = sortedAmp[i]!;
      const s = roughnessScale(fi);
      for (let j = i + 1; j < n; j++) {
        const x = s * (sortedFreq[j]! - fi);
        if (x > CUTOFF) break;
        total += Math.min(ai, sortedAmp[j]!) * (Math.exp(-B1 * x) - Math.exp(-B2 * x));
      }
    }
    return total;
  };
}

/** The roughness of notes sounding together, every note with the same Timbre. */
export function chordRoughness(frequencies: readonly number[], harmonics: Harmonics): number {
  return roughnessMeter(harmonics, frequencies.length)(frequencies);
}

/** A three-note chord stacked on the bottom note: bottom, +lower interval, +upper interval (¢). */
export function stackedChord(bottomHz: number, lowerCents: number, upperCents: number): [number, number, number] {
  const middle = bottomHz * 2 ** (lowerCents / 1200);
  return [bottomHz, middle, middle * 2 ** (upperCents / 1200)];
}

/** The largest interval on either axis of the landscape: an octave. */
export const LANDSCAPE_MAX_CENTS = 1200;

/** How rough every three-note chord on one bottom note is, in one Timbre (decision #15). */
export interface RoughnessLandscape {
  /** The grid's interval values in cents, 0 to 1200, shared by both axes. */
  readonly cents: readonly number[];
  /** Relative roughness 0–1 at [lowerIndex · cents.length + upperIndex]; the roughest point is 1. */
  readonly heights: Float32Array;
  /** The roughest grid point's roughness (model units): the scale for this Timbre and bottom note. */
  readonly max: number;
  /** Any chord's roughness on the landscape's scale (may pass 1 between grid points). */
  relative(frequencies: readonly number[]): number;
}

/**
 * The roughness landscape: a points × points grid of stacked three-note chords, lower
 * interval × upper interval, each 0–1200¢, scaled so its roughest point is 1.
 */
export function roughnessLandscape(bottomHz: number, harmonics: Harmonics, points: number): RoughnessLandscape {
  const meter = roughnessMeter(harmonics, 3);
  const cents = Array.from({ length: points }, (_, i) => (i * LANDSCAPE_MAX_CENTS) / (points - 1));
  const ratios = cents.map((c) => 2 ** (c / 1200));
  const raw = new Float64Array(points * points);
  const chord = [bottomHz, 0, 0];
  let max = 0;
  for (let l = 0; l < points; l++) {
    chord[1] = bottomHz * ratios[l]!;
    for (let u = 0; u < points; u++) {
      chord[2] = chord[1]! * ratios[u]!;
      const r = meter(chord);
      raw[l * points + u] = r;
      if (r > max) max = r;
    }
  }
  const scale = max > 0 ? 1 / max : 0;
  const heights = Float32Array.from(raw, (r) => r * scale);
  return { cents, heights, max, relative: (frequencies) => meter(frequencies) * scale };
}

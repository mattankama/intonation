/**
 * Timbre: the strengths of a note's harmonics (decision: Timbre preset recipes, issue #14).
 *
 * A Timbre is a list of harmonic amplitudes a₁, a₂, … aₙ, all in sine phase, so its
 * waveform is Σ aₙ·sin(nθ). Presets are given for harmonics 1–16 with the strongest at 1.
 */

/** Harmonic amplitudes a₁, a₂, …; index 0 is the fundamental. */
export type Harmonics = readonly number[];

export const TIMBRE_PRESET_IDS = ['sine', 'organ', 'string', 'brass', 'voice'] as const;
export type TimbrePresetId = (typeof TIMBRE_PRESET_IDS)[number];

/** The exact recipes chosen by listening (issue #14). */
const RECIPES: Record<TimbrePresetId, Harmonics> = {
  sine: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Drawbar mix: 8′ + 4′ + 2⅔′ + 2′ + higher.
  organ: [1, 0.8, 0.6, 0.5, 0, 0.4, 0, 0.3, 0, 0, 0, 0, 0, 0, 0, 0],
  // Bowed with body: 1/n × (1 + 1.2·e^(−(n−4.5)²/4)), scaled to a peak of 1.
  string: [
    1, 0.593, 0.531, 0.504, 0.403, 0.266, 0.169, 0.125, 0.106, 0.095, 0.086, 0.079, 0.073, 0.068,
    0.063, 0.059,
  ],
  // Horn, peak at harmonic 2.
  brass: [0.8, 1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.09, 0.05, 0.03, 0.02, 0.01, 0, 0, 0, 0],
  // "Ah": formant peaks near harmonics 3, 5 and 10 at C4 (the vowel drifts with register).
  voice: [
    0.384, 0.737, 1, 0.73, 0.647, 0.25, 0.072, 0.096, 0.19, 0.249, 0.184, 0.083, 0.034, 0.023,
    0.02, 0.019,
  ],
};

/** Brightness b runs from −1 (dark) to +1 (bright); 0 is the recipe as drawn. */
export const BRIGHTNESS_MIN = -1;
export const BRIGHTNESS_MAX = 1;

/** Reweights the harmonics as aₙ × n^b. */
export function withBrightness(harmonics: Harmonics, brightness: number): Harmonics {
  if (brightness === 0) return harmonics;
  return harmonics.map((a, i) => a * Math.pow(i + 1, brightness));
}

/**
 * A preset's harmonics with brightness applied. Sine has nothing to reweight, so
 * brightness leaves it alone.
 */
export function presetHarmonics(id: TimbrePresetId, brightness = 0): Harmonics {
  const recipe = RECIPES[id];
  return id === 'sine' ? recipe : withBrightness(recipe, brightness);
}

/** Σ aₙ², the sum of the squared amplitudes. */
export function sumOfSquares(harmonics: Harmonics): number {
  return harmonics.reduce((sum, a) => sum + a * a, 0);
}

/** RMS of the waveform Σ aₙ·sin(nθ): √(Σ aₙ² / 2). */
export function timbreRms(harmonics: Harmonics): number {
  return Math.sqrt(sumOfSquares(harmonics) / 2);
}

/** The waveform Σ aₙ·sin(nθ) at phase θ (radians; one period is 2π). */
export function waveValue(harmonics: Harmonics, theta: number): number {
  let value = 0;
  harmonics.forEach((a, i) => {
    value += a * Math.sin((i + 1) * theta);
  });
  return value;
}

/** Samples per period when searching for the peak; ample for 16 harmonics. */
const PEAK_SAMPLES = 4096;

/** Largest |Σ aₙ·sin(nθ)| over one period, found by sampling. */
export function wavePeak(harmonics: Harmonics): number {
  let peak = 0;
  for (let s = 0; s < PEAK_SAMPLES; s++) {
    peak = Math.max(peak, Math.abs(waveValue(harmonics, (2 * Math.PI * s) / PEAK_SAMPLES)));
  }
  return peak;
}

/* ---------- Custom Timbre (decision: Custom Timbre, issue #10) ---------- */

/** Harmonics 1–16: the presets' length and the Custom Timbre's editable range. */
export const HARMONIC_COUNT = 16;
/** Custom levels are whole percentages from 0 to LEVEL_MAX. */
export const LEVEL_MAX = 100;

/**
 * The one user-built Timbre: a level per harmonic (whole %, 0–100) and a mute per
 * harmonic, kept apart so unmuting restores the level. `from` is the Timbre preset it
 * was made from, for its label and "Reset to preset".
 */
export interface CustomTimbre {
  from: TimbrePresetId;
  levels: readonly number[];
  muted: readonly boolean[];
}

/** The shared Timbre setting: a Timbre preset or the Custom Timbre. */
export type TimbreChoice = TimbrePresetId | CustomTimbre;

export function isCustomTimbre(timbre: TimbreChoice): timbre is CustomTimbre {
  return typeof timbre !== 'string';
}

/**
 * A Custom Timbre that starts as the preset sounds (brightness included), rescaled so
 * its strongest harmonic is 100 % and rounded to 1 % steps.
 */
export function customTimbreFrom(id: TimbrePresetId, brightness: number): CustomTimbre {
  const harmonics = presetHarmonics(id, brightness);
  const strongest = Math.max(...harmonics);
  return {
    from: id,
    levels: harmonics.map((a) => Math.round((a / strongest) * LEVEL_MAX)),
    muted: harmonics.map(() => false),
  };
}

/**
 * Moves harmonic n's slider or mute (decision #10). A preset first becomes the Custom
 * Timbre made from it (as heard, brightness included); a Custom Timbre is changed in place.
 */
export function editHarmonic(
  timbre: TimbreChoice,
  brightness: number,
  n: number,
  change: { level?: number; muted?: boolean },
): CustomTimbre {
  const base = isCustomTimbre(timbre) ? timbre : customTimbreFrom(timbre, brightness);
  const i = n - 1;
  return {
    from: base.from,
    levels: base.levels.map((level, j) => (j === i && change.level !== undefined ? change.level : level)),
    muted: base.muted.map((m, j) => (j === i && change.muted !== undefined ? change.muted : m)),
  };
}

/** The amplitudes a Custom Timbre plays: level / 100, or 0 while muted. */
export function customHarmonics({ levels, muted }: CustomTimbre): Harmonics {
  return levels.map((level, i) => (muted[i] ? 0 : level / LEVEL_MAX));
}

/** The harmonics of the shared Timbre setting. Brightness applies to presets only. */
export function timbreHarmonics(timbre: TimbreChoice, brightness: number): Harmonics {
  return isCustomTimbre(timbre) ? customHarmonics(timbre) : presetHarmonics(timbre, brightness);
}

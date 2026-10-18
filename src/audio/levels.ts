/**
 * Voice levels (decisions: Synthesis approach #6, Timbre preset recipes #14).
 *
 * Pure functions, so the engine's gain structure can be unit-tested without audio.
 *
 * - Loudness: every Timbre is scaled to the same RMS (VOICE_RMS), so switching preset
 *   or brightness doesn't change how loud a note is.
 * - Headroom, not a compressor: VOICE_RMS is chosen so the spikiest preset waveform
 *   (string-like at brightness +1, crest factor ≈ 3.87) peaks at about 0.19, so a
 *   3-note chord at full volume peaks around 0.6. A Timbre spikier than any preset is
 *   turned down further so one voice never peaks above VOICE_PEAK_MAX.
 */
import { type Harmonics, timbreRms, wavePeak } from '../core';

/** RMS of one sounding note at full volume. */
export const VOICE_RMS = 0.05;
/** No single voice may peak above this (3 voices ≤ 0.6). */
export const VOICE_PEAK_MAX = 0.2;

/** The amplitudes a voice actually plays: the Timbre scaled to VOICE_RMS, capped by peak. */
export function voiceAmplitudes(harmonics: Harmonics): Harmonics {
  const rms = timbreRms(harmonics);
  if (rms === 0) return harmonics.map(() => 0);
  const scale = Math.min(VOICE_RMS / rms, VOICE_PEAK_MAX / wavePeak(harmonics));
  return harmonics.map((a) => a * scale);
}

/** Master gain for a volume of 0–100 %, on a squared taper so the slider feels even. */
export function volumeGain(volumePercent: number): number {
  const v = volumePercent / 100;
  return v * v;
}

/**
 * The first time at or after `earliest` that lies a whole number of periods after
 * `noteStart`. An oscillator started then is in phase with one started at `noteStart`
 * at the same frequency, so the two can be crossfaded without a click.
 */
export function phaseAlignedStart(noteStart: number, frequency: number, earliest: number): number {
  const periods = Math.ceil((earliest - noteStart) * frequency);
  return noteStart + Math.max(0, periods) / frequency;
}

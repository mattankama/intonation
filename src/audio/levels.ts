/**
 * Voice levels (decisions: Synthesis approach #6, Timbre preset recipes #14).
 *
 * Pure functions, so the engine's gain structure can be unit-tested without audio.
 *
 * - Loudness: every Timbre is scaled to the same RMS (VOICE_RMS), so switching preset
 *   or brightness doesn't change how loud a note is.
 * - Headroom, not a compressor, from a worst-case peak bound: at most MAX_VOICES voices
 *   sound or ring out at once (./voicePool.ts), and a voice handed over to a new note
 *   fades at least as fast as the new one rises, so the two never sum above one voice.
 *   No voice peaks above VOICE_PEAK_MAX, so even every voice peaking together at full
 *   volume stays under the safety net's threshold, which therefore never engages.
 * - VOICE_RMS is chosen so the spikiest preset waveform (string-like at brightness +1,
 *   crest factor ≈ 3.87) peaks just under VOICE_PEAK_MAX; a Timbre spikier than any
 *   preset (a Custom Timbre) is turned down further. A note's level depends on its
 *   Timbre only, never on how many others sound.
 */
import { type Harmonics, timbreRms, wavePeak } from '../core';

/** The safety-net compressor's threshold (decision #6: −1 dBFS, knee 0, ratio 20). */
export const SAFETY_NET_THRESHOLD_DB = -1;
/**
 * Most voices sounding or ringing out at once: the biggest chord (a 6-note lattice chord)
 * plus two more (the comma pump's drone and a tapped node, or keys played over a chord).
 * Past it the engine hands the oldest voice over to the new one.
 */
export const MAX_VOICES = 8;
/** No single voice may peak above this: MAX_VOICES of them stay under −1 dBFS (0.891). */
export const VOICE_PEAK_MAX = 0.11;
/** RMS of one sounding note at full volume. */
export const VOICE_RMS = 0.028;

/** Envelope time constants in seconds; ≈ 5 time constants to settle (~40 ms / ~120 ms). */
export const ATTACK_SECONDS = 0.008;
export const RELEASE_SECONDS = 0.024;
/** A voice handed over to a new note fades with this time constant: never slower than the attack. */
export const HANDOVER_SECONDS = ATTACK_SECONDS;

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

/**
 * A note that began at `noteStart` at frequency `from` and moved to `to` at time `at`:
 * the start time it would have had at `to` all along to be in the same phase now. Pass it
 * to phaseAlignedStart afterwards so Timbre crossfades stay in phase.
 */
export function retimedStart(noteStart: number, from: number, to: number, at: number): number {
  return at - ((at - noteStart) * from) / to;
}

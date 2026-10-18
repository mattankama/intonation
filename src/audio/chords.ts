/**
 * Playing whole chords: every note starts together and is released after a fixed time.
 * A new chord replaces the one before, so chords never pile up. Callers pass the
 * frequencies (from the acoustics core); this never computes pitch.
 */
import { audioEngine } from './engine';

/** How long a chord sounds, in seconds. */
export const CHORD_SECONDS = 1.6;

const voiceId = (i: number) => `chord:${i}`;
let sounding = 0;

/** Plays a chord for CHORD_SECONDS, replacing any chord played here before. */
export function playChord(frequencies: readonly number[], seconds = CHORD_SECONDS): void {
  for (let i = frequencies.length; i < sounding; i++) audioEngine.noteOff(voiceId(i));
  frequencies.forEach((hz, i) => audioEngine.pluck(voiceId(i), hz, seconds));
  sounding = frequencies.length;
}

/** Releases the chord now. */
export function stopChord(): void {
  for (let i = 0; i < sounding; i++) audioEngine.noteOff(voiceId(i));
  sounding = 0;
}

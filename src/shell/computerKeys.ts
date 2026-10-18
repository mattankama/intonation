import type { Note } from '../core';

/**
 * Computer-keyboard shortcuts for the on-screen keyboard (desktop): the home row
 * A S D F … plays the white keys from C4, the row above plays the black keys.
 * Keys are matched by physical position (KeyboardEvent.code), so other layouts get
 * the same piano shape; `label` is the key's name on a US layout.
 */
const KEYS: readonly { code: string; label: string; note: Note }[] = [
  ['KeyA', 'A'],
  ['KeyW', 'W'],
  ['KeyS', 'S'],
  ['KeyE', 'E'],
  ['KeyD', 'D'],
  ['KeyF', 'F'],
  ['KeyT', 'T'],
  ['KeyG', 'G'],
  ['KeyY', 'Y'],
  ['KeyH', 'H'],
  ['KeyU', 'U'],
  ['KeyJ', 'J'],
  ['KeyK', 'K'],
  ['KeyO', 'O'],
  ['KeyL', 'L'],
  ['KeyP', 'P'],
  ['Semicolon', ';'],
  ['Quote', "'"],
].map(([code, label], i) => ({
  code: code!,
  label: label!,
  note: { pitchClass: i % 12, octave: 4 + Math.floor(i / 12) },
}));

export function noteForKeyCode(code: string): Note | undefined {
  return KEYS.find((k) => k.code === code)?.note;
}

/** The computer key that plays a note, if any. */
export function computerKeyFor(note: Note): string | undefined {
  return KEYS.find((k) => k.note.pitchClass === note.pitchClass && k.note.octave === note.octave)
    ?.label;
}

/**
 * In an N-EDO other than 12-EDO (decision #8) the same two rows play consecutive steps,
 * zigzagging up: A, W, S, E, D, R … so each key is one step above the last. The keys play
 * a range of the keyboard that ← → shift one step at a time.
 */
const STEP_KEYS: readonly { code: string; label: string }[] = [
  ['KeyA', 'A'],
  ['KeyW', 'W'],
  ['KeyS', 'S'],
  ['KeyE', 'E'],
  ['KeyD', 'D'],
  ['KeyR', 'R'],
  ['KeyF', 'F'],
  ['KeyT', 'T'],
  ['KeyG', 'G'],
  ['KeyY', 'Y'],
  ['KeyH', 'H'],
  ['KeyU', 'U'],
  ['KeyJ', 'J'],
  ['KeyI', 'I'],
  ['KeyK', 'K'],
  ['KeyO', 'O'],
  ['KeyL', 'L'],
  ['KeyP', 'P'],
  ['Semicolon', ';'],
  ['BracketLeft', '['],
  ['Quote', "'"],
  ['BracketRight', ']'],
].map(([code, label]) => ({ code: code!, label: label! }));

/** How many consecutive steps the computer keys reach at once. */
export const STEP_RANGE_SIZE = STEP_KEYS.length;

/** The place in the range (0 = its lowest step) a computer key plays, if any. */
export function stepOffsetForKeyCode(code: string): number | undefined {
  const i = STEP_KEYS.findIndex((k) => k.code === code);
  return i === -1 ? undefined : i;
}

/** The computer key for a place in the range, if any. */
export function stepShortcutFor(offset: number): string | undefined {
  return STEP_KEYS[offset]?.label;
}

/** Moves the range's first key by `by` steps, keeping the range on a keyboard of `total` keys. */
export function shiftStepRange(start: number, by: number, total: number): number {
  const last = Math.max(0, total - STEP_RANGE_SIZE);
  return Math.min(last, Math.max(0, start + by));
}

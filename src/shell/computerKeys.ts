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

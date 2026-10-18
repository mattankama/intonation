import { describe, expect, it } from 'vitest';
import { computerKeyFor, noteForKeyCode } from './computerKeys';

/** Names notes by pitch class (0 = C) so the test doesn't depend on spellings. */
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const name = (code: string) => {
  const note = noteForKeyCode(code);
  return note && `${NAMES[note.pitchClass]}${note.octave}`;
};

describe('Computer keys play the keyboard from C4', () => {
  it('the home row plays the white keys', () => {
    expect(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ'].map(name)).toEqual([
      'C4',
      'D4',
      'E4',
      'F4',
      'G4',
      'A4',
      'B4',
    ]);
  });

  it('the row above plays the black keys', () => {
    expect(['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'].map(name)).toEqual([
      'C#4',
      'D#4',
      'F#4',
      'G#4',
      'A#4',
    ]);
  });

  it('continues into the next octave', () => {
    expect(['KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon', 'Quote'].map(name)).toEqual([
      'C5',
      'C#5',
      'D5',
      'D#5',
      'E5',
      'F5',
    ]);
  });

  it('other keys play nothing', () => {
    for (const code of ['KeyQ', 'KeyR', 'KeyI', 'KeyZ', 'Space', 'Enter', 'Digit1']) {
      expect(noteForKeyCode(code), code).toBeUndefined();
    }
  });

  it('names the shortcut for a note, and none for notes out of reach', () => {
    expect(computerKeyFor({ pitchClass: 0, octave: 4 })).toBe('A');
    expect(computerKeyFor({ pitchClass: 1, octave: 4 })).toBe('W');
    expect(computerKeyFor({ pitchClass: 4, octave: 5 })).toBe(';');
    expect(computerKeyFor({ pitchClass: 11, octave: 5 })).toBeUndefined();
  });
});

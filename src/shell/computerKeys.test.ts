import { describe, expect, it } from 'vitest';
import {
  computerKeyFor,
  noteForKeyCode,
  shiftStepRange,
  stepOffsetForKeyCode,
  stepShortcutFor,
} from './computerKeys';

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

describe('In an N-EDO, computer keys play consecutive steps', () => {
  it('zigzags between the home row and the row above, one step per key', () => {
    const codes = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyR', 'KeyF', 'KeyT', 'KeyG', 'KeyY'];
    expect(codes.map(stepOffsetForKeyCode)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(['KeyH', 'KeyU', 'KeyJ', 'KeyI', 'KeyK', 'KeyO', 'KeyL', 'KeyP'].map(stepOffsetForKeyCode)).toEqual([
      10, 11, 12, 13, 14, 15, 16, 17,
    ]);
    expect(['Semicolon', 'BracketLeft', 'Quote', 'BracketRight'].map(stepOffsetForKeyCode)).toEqual([
      18, 19, 20, 21,
    ]);
  });

  it('other keys play nothing', () => {
    for (const code of ['KeyQ', 'KeyZ', 'Space', 'Digit1', 'ArrowLeft']) {
      expect(stepOffsetForKeyCode(code), code).toBeUndefined();
    }
  });

  it('names the shortcut for each place in the range', () => {
    expect(stepShortcutFor(0)).toBe('A');
    expect(stepShortcutFor(5)).toBe('R');
    expect(stepShortcutFor(21)).toBe(']');
    expect(stepShortcutFor(22)).toBeUndefined();
    expect(stepShortcutFor(-1)).toBeUndefined();
  });

  it('← → shift the range one step, staying on the keyboard', () => {
    // 31-EDO over two octaves: 62 keys, so the 22-key range can start at 0…40.
    expect(shiftStepRange(0, 1, 62)).toBe(1);
    expect(shiftStepRange(0, -1, 62)).toBe(0);
    expect(shiftStepRange(40, 1, 62)).toBe(40);
    // 5-EDO has fewer keys than the range: it cannot move.
    expect(shiftStepRange(0, 1, 10)).toBe(0);
  });
});

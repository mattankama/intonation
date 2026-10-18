import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type Note, type Tuning, edo12NoteName, keySpelling, noteName } from '../core';
import { copy } from '../copy/en';
import { computerKeyFor, noteForKeyCode } from './computerKeys';

/** Black keys by pitch class, with the white key (index in octave) they sit after. */
const BLACK_KEYS = [
  { pitchClass: 1, after: 0 },
  { pitchClass: 3, after: 1 },
  { pitchClass: 6, after: 3 },
  { pitchClass: 8, after: 4 },
  { pitchClass: 10, after: 5 },
];
/** The keyboard spans these octaves; phones show only the first. */
const OCTAVES = [4, 5];

export interface KeyboardProps {
  /** Names each key by this tuning system's spelling. */
  tuning: Tuning;
  /** Start a held note (pointer down). */
  onNoteOn(note: Note): void;
  /** Release a held note (pointer up / leave). */
  onNoteOff(note: Note): void;
  /** A short note from the computer keyboard (Enter or Space on a focused key). */
  onPluck(note: Note): void;
}

/** Typing in these doesn't play notes. */
const isTextEntry = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));

const noteKey = (note: Note) => `${note.pitchClass}:${note.octave}`;

/**
 * Computer keys (A S D F … and the row above) hold notes while pressed. Returns the
 * notes currently held this way, so their on-screen keys can show it.
 */
function useComputerKeys(onNoteOn: (note: Note) => void, onNoteOff: (note: Note) => void) {
  const [held, setHeld] = useState<ReadonlySet<string>>(new Set());
  const handlers = useRef({ onNoteOn, onNoteOff });
  handlers.current = { onNoteOn, onNoteOff };

  useEffect(() => {
    const down = new Map<string, Note>();
    const sync = () => setHeld(new Set([...down.values()].map(noteKey)));
    const release = (code: string) => {
      const note = down.get(code);
      if (!note) return;
      down.delete(code);
      handlers.current.onNoteOff(note);
      sync();
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTextEntry(e.target)) return;
      const note = noteForKeyCode(e.code);
      if (!note || down.has(e.code)) return;
      e.preventDefault();
      down.set(e.code, note);
      handlers.current.onNoteOn(note);
      sync();
    };
    const onKeyUp = (e: globalThis.KeyboardEvent) => release(e.code);
    const releaseAll = () => [...down.keys()].forEach(release);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
      releaseAll();
    };
  }, []);

  return held;
}

/** The on-screen keyboard, two octaves from C4. */
export function Keyboard({ tuning, onNoteOn, onNoteOff, onPluck }: KeyboardProps) {
  const held = useComputerKeys(onNoteOn, onNoteOff);
  const key = (note: Note, colour: 'white' | 'black', style?: CSSProperties) => {
    const name = noteName(tuning, note);
    const shortcut = computerKeyFor(note);
    const down = (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.dataset.down = 'true';
      onNoteOn(note);
    };
    const up = (e: PointerEvent<HTMLButtonElement>) => {
      if (e.currentTarget.dataset.down !== 'true') return;
      delete e.currentTarget.dataset.down;
      onNoteOff(note);
    };
    const keyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
        e.preventDefault();
        onPluck(note);
      }
    };
    return (
      <button
        key={edo12NoteName(note)}
        type="button"
        className={`key key-${colour} ml-focusable`}
        style={style}
        aria-label={name}
        aria-keyshortcuts={shortcut}
        data-held={held.has(noteKey(note)) || undefined}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={up}
        onKeyDown={keyDown}
      >
        {shortcut && (
          <span className="key-shortcut" aria-hidden="true">
            {shortcut}
          </span>
        )}
        {/* Black keys are narrow: they show the spelling alone (e.g. "G♯"). */}
        <span className="key-label">
          {colour === 'white' ? name : keySpelling(tuning, note.pitchClass)}
        </span>
      </button>
    );
  };

  return (
    <div className="keyboard" role="group" aria-label={copy.shell.keyboardLabel}>
      {OCTAVES.map((octave) => (
        <div key={octave} className="keyboard-octave" data-octave={octave}>
          {/* Chromatic DOM order, so Tab walks the keys in pitch order. */}
          {Array.from({ length: 12 }, (_, pitchClass) => {
            const black = BLACK_KEYS.find((b) => b.pitchClass === pitchClass);
            return black
              ? key({ pitchClass, octave }, 'black', {
                  left: `calc(${((black.after + 1) / 7) * 100}% - var(--black-key-width) / 2)`,
                })
              : key({ pitchClass, octave }, 'white');
          })}
        </div>
      ))}
    </div>
  );
}

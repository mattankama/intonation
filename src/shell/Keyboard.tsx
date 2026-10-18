import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type Note,
  type TuningSystemChoice,
  centsAboveTonic,
  edo12NoteName,
  edoLandmarks,
  keySpelling,
  noteName,
  stepEdo,
} from '../core';
import { copy } from '../copy/en';
import { formatCents } from '../format/numbers';
import {
  STEP_RANGE_SIZE,
  computerKeyFor,
  noteForKeyCode,
  shiftStepRange,
  stepOffsetForKeyCode,
  stepShortcutFor,
} from './computerKeys';

/** Black keys by pitch class, with the white key (index in octave) they sit after. */
const BLACK_KEYS = [
  { pitchClass: 1, after: 0 },
  { pitchClass: 3, after: 1 },
  { pitchClass: 6, after: 3 },
  { pitchClass: 8, after: 4 },
  { pitchClass: 10, after: 5 },
];
/** The keyboard spans these octaves; the piano shows only the first on phones. */
const OCTAVES = [4, 5];

export interface KeyboardProps {
  /** Names each key by this tuning system's spelling, or by step in an N-EDO. */
  systemChoice: TuningSystemChoice;
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
 * Computer keys hold notes while pressed; `noteForCode` says which note a key plays now.
 * Returns the notes currently held this way, so their on-screen keys can show it.
 */
function useComputerKeys(
  noteForCode: (code: string) => Note | undefined,
  onNoteOn: (note: Note) => void,
  onNoteOff: (note: Note) => void,
) {
  const [held, setHeld] = useState<ReadonlySet<string>>(new Set());
  const handlers = useRef({ noteForCode, onNoteOn, onNoteOff });
  handlers.current = { noteForCode, onNoteOn, onNoteOff };

  useEffect(() => {
    // Each pressed key keeps the note it started, even if the range moves meanwhile.
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
      const note = handlers.current.noteForCode(e.code);
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

interface KeyButtonProps extends Omit<KeyboardProps, 'systemChoice'> {
  note: Note;
  /** The accessible name, e.g. "G♯4" or "step 10 of 31, octave 4". */
  name: string;
  className: string;
  style?: CSSProperties;
  shortcut: string | undefined;
  held: boolean;
  /** Shown on hover and read as the key's description (an N-EDO step's cents). */
  description?: string;
  children: ReactNode;
}

/** One key: pointer holds the note, Enter or Space plucks it. */
function KeyButton({
  note,
  name,
  className,
  style,
  shortcut,
  held,
  description,
  onNoteOn,
  onNoteOff,
  onPluck,
  children,
}: KeyButtonProps) {
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
      type="button"
      className={`key ${className} ml-focusable`}
      style={style}
      aria-label={name}
      title={description}
      aria-keyshortcuts={shortcut}
      data-held={held || undefined}
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
      {children}
    </button>
  );
}

/**
 * The on-screen keyboard: a piano for 12-EDO and the 12-note systems, a single row of
 * N equal steps per octave for any other N-EDO (decision #8). Both span two octaves from
 * C4 (in an N-EDO, from step 0 of octave 4, the step nearest C4).
 */
export function Keyboard(props: KeyboardProps) {
  const n = stepEdo(props.systemChoice.system);
  // A new N starts a new keyboard, with the computer-key range back at its start.
  return n === null ? <PianoKeyboard {...props} /> : <StepKeyboard key={n} n={n} {...props} />;
}

/** Two octaves of piano keys from C4. */
function PianoKeyboard({ systemChoice, ...handlers }: KeyboardProps) {
  const held = useComputerKeys(noteForKeyCode, handlers.onNoteOn, handlers.onNoteOff);
  const key = (note: Note, colour: 'white' | 'black', style?: CSSProperties) => {
    const name = noteName(systemChoice, note);
    return (
      <KeyButton
        key={edo12NoteName(note)}
        {...handlers}
        note={note}
        name={name}
        className={`key-${colour}`}
        style={style}
        shortcut={computerKeyFor(note)}
        held={held.has(noteKey(note))}
      >
        {/* Black keys are narrow: they show the spelling alone (e.g. "G♯"). */}
        <span className="key-label">
          {colour === 'white' ? name : keySpelling(systemChoice, note.pitchClass)}
        </span>
      </KeyButton>
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

const EDO12 = { system: '12-edo', tonic: 0 } as const;
const NATURALS = new Set([0, 2, 4, 5, 7, 9, 11]);

/**
 * The familiar notes each step is nearest (its landmarks), indexed by step. B can be
 * nearest the next octave's step 0, so step 0 lists it first (the B below that C).
 */
function landmarksByStep(n: number) {
  const byStep = Array.from({ length: n }, () => ({ names: [] as string[], natural: false }));
  edoLandmarks(n).forEach((step, pitchClass) => {
    const landmark = byStep[step % n]!;
    const name = keySpelling(EDO12, pitchClass);
    if (step >= n) landmark.names.unshift(name);
    else landmark.names.push(name);
    if (NATURALS.has(pitchClass)) landmark.natural = true;
  });
  return byStep;
}

/** Arrow keys don't move the range while a tab list or a form control has them. */
const ownsArrows = (target: EventTarget | null) =>
  isTextEntry(target) || (target instanceof Element && target.closest('[role="tablist"]') !== null);

/**
 * An N-EDO keyboard: two octaves of N equal keys in one row, labelled by step, with
 * landmarks on the steps nearest the 12 familiar notes. Computer keys play a range of
 * consecutive steps, which ← → shift one step at a time.
 */
function StepKeyboard({ n, systemChoice, ...handlers }: KeyboardProps & { n: number }) {
  const total = OCTAVES.length * n;
  const noteAt = (index: number): Note => ({
    pitchClass: index % n,
    octave: OCTAVES[0]! + Math.floor(index / n),
  });
  const [start, setStart] = useState(0);
  const held = useComputerKeys(
    (code) => {
      const offset = stepOffsetForKeyCode(code);
      const index = offset === undefined ? total : start + offset;
      return index < total ? noteAt(index) : undefined;
    },
    handlers.onNoteOn,
    handlers.onNoteOff,
  );

  // ← → shift the range; the keyboard scrolls to keep its leading edge in view.
  const container = useRef<HTMLDivElement>(null);
  const edge = useRef<number | null>(null);
  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || ownsArrows(e.target)) return;
      const by = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      if (by === 0) return;
      e.preventDefault();
      const next = shiftStepRange(startRef.current, by, total);
      edge.current = Math.min(by > 0 ? next + STEP_RANGE_SIZE - 1 : next, total - 1);
      setStart(next);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [total]);
  useEffect(() => {
    if (edge.current === null) return;
    container.current?.children[edge.current]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    edge.current = null;
  }, [start]);

  const landmarks = landmarksByStep(n);
  return (
    <div
      ref={container}
      className="keyboard keyboard-steps"
      role="group"
      aria-label={copy.shell.keyboardLabel}
      data-dense={n > 36 || undefined}
    >
      {Array.from({ length: total }, (_, index) => {
        const note = noteAt(index);
        const step = note.pitchClass;
        const landmark = landmarks[step]!;
        const kind = landmark.names.length === 0 ? undefined : landmark.natural ? 'natural' : 'other';
        return (
          <KeyButton
            key={index}
            {...handlers}
            note={note}
            name={noteName(systemChoice, note)}
            className="key-step"
            shortcut={stepShortcutFor(index - start)}
            held={held.has(noteKey(note))}
            description={formatCents(centsAboveTonic(systemChoice, step), 'controls')}
          >
            {kind && (
              <span className="key-landmark" data-kind={kind} aria-hidden="true">
                {landmark.names.join(' ')}
              </span>
            )}
            <span className="key-label">{step}</span>
          </KeyButton>
        );
      })}
    </div>
  );
}

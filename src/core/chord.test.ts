import { describe, expect, it } from 'vitest';
import {
  CHORD_TYPES,
  type ChordChoice,
  EDO_MAX,
  EDO_MIN,
  TUNING_SYSTEM_IDS,
  chordSize,
  edoSystem,
  pureChord,
  resolvePitch,
  tuneChord,
} from './index';

const chord = (change: Partial<ChordChoice>): ChordChoice => ({
  root: 0,
  type: 'major',
  inversion: 0,
  pure: '5-limit',
  ...change,
});

describe('pure chords: 5-limit stacked thirds (decision #7)', () => {
  const table: [ChordChoice['type'], string][] = [
    ['major', '4:5:6'],
    ['minor', '10:12:15'],
    ['diminished', '25:30:36'],
    ['augmented', '16:20:25'],
    ['dominant-7th', '20:25:30:36'],
    ['major-7th', '8:10:12:15'],
    ['minor-7th', '10:12:15:18'],
    ['sus2', '8:9:12'],
    ['sus4', '6:8:9'],
  ];
  it.each(table)('%s is %s', (type, proportion) => {
    expect(pureChord(chord({ type })).proportion.join(':')).toBe(proportion);
  });

  it('covers the nine chord types', () => {
    expect([...CHORD_TYPES].sort()).toEqual(table.map(([type]) => type).sort());
  });

  it('gives the notes above the root as exact ratios', () => {
    expect(pureChord(chord({ type: 'dominant-7th' })).ratios).toEqual([
      { num: 1, den: 1 },
      { num: 5, den: 4 },
      { num: 3, den: 2 },
      { num: 9, den: 5 },
    ]);
  });

  it('offers exactly two alternative pure chords: Harmonic 7th 4:5:6:7 and Septimal 5:6:7', () => {
    expect(pureChord(chord({ type: 'dominant-7th', pure: 'alternative' })).proportion.join(':')).toBe(
      '4:5:6:7',
    );
    expect(pureChord(chord({ type: 'diminished', pure: 'alternative' })).proportion.join(':')).toBe(
      '5:6:7',
    );
    // Any other type has no alternative, so asking for one gives the 5-limit chord.
    expect(pureChord(chord({ type: 'major', pure: 'alternative' })).proportion.join(':')).toBe('4:5:6');
  });

  it('inverts by raising the bass an octave: 4:5:6 → 5:6:8 → 3:4:5', () => {
    expect(pureChord(chord({ inversion: 1 })).proportion.join(':')).toBe('5:6:8');
    expect(pureChord(chord({ inversion: 2 })).proportion.join(':')).toBe('3:4:5');
    expect(pureChord(chord({ type: 'dominant-7th', inversion: 3 })).proportion.join(':')).toBe(
      '18:20:25:30',
    );
  });
});

const C = 0;
const F_SHARP = 6;
const A_FLAT = 8;
const meantoneIn = (tonic: number) => ({ system: 'meantone' as const, tonic });

describe('a chord in a 12-note tuning system', () => {
  it('12-EDO C major from C4: the third is 13.686¢ above pure, the fifth 1.955¢ below', () => {
    const tuned = tuneChord({ system: '12-edo', tonic: C }, chord({}), 440);
    expect(tuned.notes.map((n) => n.name)).toEqual(['C4', 'E4', 'G4']);
    expect(tuned.notes[0]!.frequency).toBeCloseTo(261.626, 3);
    expect(tuned.notes[1]!.pureFrequency).toBeCloseTo(327.032, 3);
    const off = tuned.notes.map((n) => n.centsOffPure);
    expect(off[0]).toBe(0);
    expect(off[1]).toBeCloseTo(13.686, 3);
    expect(off[2]).toBeCloseTo(-1.955, 3);
  });

  it('stays anchored to the Tonic: F♯ major in meantone on C has a 427¢ wolf third', () => {
    const tuned = tuneChord(meantoneIn(C), chord({ root: F_SHARP }), 440);
    // F♯–B♭ is a diminished fourth, 41.059¢ (128/125) wider than a pure third.
    expect(tuned.notes[1]!.centsOffPure).toBeCloseTo(41.059, 3);
    expect(tuned.notes[2]!.centsOffPure).toBeCloseTo(-5.377, 3);
  });

  it('is never retuned to the Root: the same chord in meantone on F♯ has a pure third', () => {
    const tuned = tuneChord(meantoneIn(F_SHARP), chord({ root: F_SHARP }), 440);
    expect(tuned.notes[1]!.centsOffPure).toBeCloseTo(0, 3);
  });

  it('plays A♭ major in meantone on C with the G♯ key, and says so', () => {
    const tuned = tuneChord(meantoneIn(C), chord({ root: A_FLAT }), 440);
    expect(tuned.notes.map((n) => n.name)).toEqual(['G♯4', 'C5', 'E♭5']);
    // The fifth G♯–E♭ is the wolf, 35.682¢ wider than pure.
    expect(tuned.notes[2]!.centsOffPure).toBeCloseTo(35.682, 3);
    expect(tuned.remarks).toEqual([{ kind: 'borrowed', key: 'G♯', as: 'A♭' }]);
  });

  it('notes every borrowed key: F♯ major in meantone on C uses B♭ as A♯', () => {
    const tuned = tuneChord(meantoneIn(C), chord({ root: F_SHARP }), 440);
    expect(tuned.remarks).toEqual([{ kind: 'borrowed', key: 'B♭', as: 'A♯' }]);
  });

  it('spells a C♯/D♭ Root as the system does: C♯ major in meantone on C uses F as E♯', () => {
    const tuned = tuneChord(meantoneIn(C), chord({ root: 1 }), 440);
    expect(tuned.remarks).toEqual([{ kind: 'borrowed', key: 'F', as: 'E♯' }]);
  });

  it('borrows nothing in 12-EDO, whose spellings are only familiar names', () => {
    const tuned = tuneChord(
      { system: '12-edo', tonic: C },
      chord({ root: A_FLAT, type: 'augmented' }),
      440,
    );
    expect(tuned.remarks).toEqual([]);
  });

  it('keeps the root at 0¢ off pure in an inversion, where it is raised an octave', () => {
    const tuned = tuneChord(meantoneIn(C), chord({ root: A_FLAT, inversion: 1 }), 440);
    expect(tuned.notes.map((n) => n.name)).toEqual(['C5', 'E♭5', 'G♯5']);
    expect(tuned.notes[2]!.centsOffPure).toBeCloseTo(0, 9);
  });

  it('builds every note from the 12 keys, never an invented note', () => {
    const tuning = meantoneIn(C);
    const keys = Array.from({ length: 36 }, (_, i) =>
      resolvePitch(tuning, { pitchClass: i % 12, octave: 4 + Math.floor(i / 12) }, 440).frequency,
    );
    const tuned = tuneChord(tuning, chord({ root: 11, type: 'dominant-7th', inversion: 2 }), 440);
    for (const note of tuned.notes) expect(keys).toContain(note.frequency);
  });

  it('follows the Reference pitch', () => {
    const tuned = tuneChord({ system: '12-edo', tonic: C }, chord({ root: 9 }), 415);
    expect(tuned.notes[0]!.frequency).toBe(415);
    expect(tuned.notes[1]!.pureFrequency).toBeCloseTo(518.75, 9);
  });
});

describe('every chord type and inversion in every tuning system', () => {
  const twelveNote = [...TUNING_SYSTEM_IDS];
  const edos = Array.from({ length: EDO_MAX - EDO_MIN + 1 }, (_, i) => edoSystem(EDO_MIN + i));
  const choices = CHORD_TYPES.flatMap((type) =>
    (['5-limit', 'alternative'] as const).flatMap((pure) =>
      Array.from({ length: chordSize(type) }, (_, inversion) =>
        Array.from({ length: 12 }, (_, root) => chord({ root, type, inversion, pure })),
      ).flat(),
    ),
  );

  it.each([...twelveNote, ...edos])('%s: root pure, notes rising, the bass first', (system) => {
    for (const tonic of [C, F_SHARP]) {
      for (const choice of choices) {
        const tuned = tuneChord({ system, tonic }, choice, 440);
        const label = `${choice.type} ${choice.pure} inversion ${choice.inversion} on ${choice.root}`;
        expect(tuned.notes, label).toHaveLength(chordSize(choice.type));
        const root = tuned.notes.find((n) => n.interval === 'unison')!;
        expect(root.centsOffPure, label).toBe(0);
        // The bass is the root in root position, else the chord's (inversion+1)th note.
        expect(tuned.notes[0]!.interval === 'unison', label).toBe(choice.inversion === 0);
        tuned.notes.slice(1).forEach((note, i) => {
          expect(note.frequency, label).toBeGreaterThanOrEqual(tuned.notes[i]!.frequency);
          expect(Number.isFinite(note.centsOffPure), label).toBe(true);
          // A 12-note system plays the key the chord names, so it is never a whole
          // semitone away from the pure note (the worst is a wolf-sized ~60¢).
          if (!system.endsWith('-edo') || system === '12-edo') {
            expect(Math.abs(note.centsOffPure), label).toBeLessThan(100);
          }
        });
      }
    }
  });
});

const edo = (n: number) => ({ system: `${n}-edo` as const, tonic: C });

describe('a chord in an N-EDO, built from the EDO mapping (decision #8)', () => {
  it('31-EDO: the major third is 10 steps, 387.097¢, 0.783¢ above pure', () => {
    const tuned = tuneChord(edo(31), chord({}), 440);
    expect(tuned.notes.map((n) => n.note.pitchClass)).toEqual([0, 10, 18]);
    expect(tuned.notes[1]!.name).toBe('step 10 of 31, octave 4');
    expect(tuned.notes[1]!.centsOffPure).toBeCloseTo(0.783, 3);
    expect(tuned.remarks).toEqual([]);
  });

  it('puts a Root chosen by letter on the step nearest it: D in 31-EDO is step 5', () => {
    const tuned = tuneChord(edo(31), chord({ root: 2 }), 440);
    expect(tuned.notes[0]!.name).toBe('step 5 of 31, octave 4');
  });

  it('17-EDO: the minor third is the fifth minus the major third (5 steps), not the nearest 4', () => {
    const tuned = tuneChord(edo(17), chord({ type: 'minor' }), 440);
    expect(tuned.notes.map((n) => n.note.pitchClass)).toEqual([0, 5, 10]);
    expect(tuned.remarks).toEqual([
      {
        kind: 'mapping',
        edo: 17,
        interval: 'minor-third',
        nearest: 4,
        mapped: 5,
        builtFrom: ['fifth', 'major-third'],
      },
    ]);
  });

  it('6-EDO: the dominant 7th’s seventh maps onto the octave, and plays there', () => {
    const tuned = tuneChord(edo(6), chord({ type: 'dominant-7th' }), 440);
    expect(tuned.notes[3]!.note).toEqual({ pitchClass: 0, octave: 5 });
    expect(tuned.remarks).toContainEqual({
      kind: 'no-step',
      edo: 6,
      interval: 'minor-seventh',
      mapsTo: 'octave',
    });
  });

  it('differs from note-by-note nearest steps in 57 of the 68 EDOs from 5 to 72', () => {
    const differs = (n: number) =>
      CHORD_TYPES.some((type) =>
        (['5-limit', 'alternative'] as const).some((pure) =>
          tuneChord(edo(n), chord({ type, pure }), 440).remarks.some((r) => r.kind === 'mapping'),
        ),
      );
    const edos = Array.from({ length: 68 }, (_, i) => i + 5);
    expect(edos.filter(differs)).toHaveLength(57);
    for (const n of [12, 15, 19, 22, 31, 41, 53, 72]) expect(differs(n), `${n}-EDO`).toBe(false);
  });

  it('6-EDO has no step for any 7th but the harmonic one; 5- and 8-EDO none for the major 7th', () => {
    const noStep = (n: number, type: ChordChoice['type'], pure: ChordChoice['pure'] = '5-limit') =>
      tuneChord(edo(n), chord({ type, pure }), 440).remarks.some((r) => r.kind === 'no-step');
    expect(noStep(6, 'dominant-7th')).toBe(true);
    expect(noStep(6, 'major-7th')).toBe(true);
    expect(noStep(6, 'minor-7th')).toBe(true);
    expect(noStep(6, 'dominant-7th', 'alternative')).toBe(false);
    expect(noStep(5, 'major-7th')).toBe(true);
    expect(noStep(8, 'major-7th')).toBe(true);
    expect(noStep(7, 'major-7th')).toBe(false);
  });

  it('inverts by raising the bass N steps: 31-EDO first-inversion C major', () => {
    const tuned = tuneChord(edo(31), chord({ inversion: 1 }), 440);
    expect(tuned.notes.map((n) => n.note)).toEqual([
      { pitchClass: 10, octave: 4 },
      { pitchClass: 18, octave: 4 },
      { pitchClass: 0, octave: 5 },
    ]);
  });
});

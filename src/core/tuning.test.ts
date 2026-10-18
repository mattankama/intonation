import { describe, expect, it } from 'vitest';
import {
  cents,
  centsAboveTonic,
  commaRatio,
  chainOfFifths,
  keyConstruction,
  keySpelling,
  noteName,
  resolvePitch,
} from './index';

const C = 0;

/** Cents of the 12 keys C, C♯ … B above the Tonic, from research/historical-tunings.md. */
function expectTable(system: Parameters<typeof centsAboveTonic>[0]['system'], table: number[]) {
  for (const [pitchClass, expected] of table.entries()) {
    expect(centsAboveTonic({ system, tonic: C }, pitchClass), `pitch class ${pitchClass}`).toBeCloseTo(
      expected,
      3,
    );
  }
}

describe('12-note tuning systems in C match the published tables (3 decimals)', () => {
  it('Pythagorean, chain E♭…G♯', () => {
    expectTable('pythagorean', [
      0, 113.685, 203.91, 294.135, 407.82, 498.045, 611.73, 701.955, 815.64, 905.865, 996.09,
      1109.775,
    ]);
  });

  it('¼-comma meantone (Aron 1523), chain E♭…G♯', () => {
    expectTable('meantone', [
      0, 76.049, 193.157, 310.265, 386.314, 503.422, 579.471, 696.578, 772.627, 889.735, 1006.843,
      1082.892,
    ]);
  });

  it('Werckmeister III (1691): C–G, G–D, D–A and B–F♯ narrowed by ¼ Pythagorean comma', () => {
    expectTable('werckmeister-iii', [
      0, 90.225, 192.18, 294.135, 390.225, 498.045, 588.27, 696.09, 792.18, 888.27, 996.09,
      1092.18,
    ]);
  });

  it('Vallotti (modern standard): F–C–G–D–A–E–B narrowed by 1/6 Pythagorean comma', () => {
    expectTable('vallotti', [
      0, 94.135, 196.09, 298.045, 392.18, 501.955, 592.18, 698.045, 796.09, 894.135, 1000,
      1090.225,
    ]);
  });

  it('Kirnberger III: C–G–D–A–E narrowed by ¼ syntonic comma, schisma on F♯–D♭', () => {
    expectTable('kirnberger-iii', [
      0, 90.225, 193.157, 294.135, 386.314, 498.045, 590.224, 696.578, 792.18, 889.735, 996.09,
      1088.269,
    ]);
  });

  it('5-limit just intonation, the asymmetric set 1, 16/15, 9/8 … 15/8', () => {
    expectTable('just', [
      0, 111.731, 203.91, 315.641, 386.314, 498.045, 590.224, 701.955, 813.686, 884.359, 1017.596,
      1088.269,
    ]);
  });
});

describe('changing the Tonic transposes the whole pattern', () => {
  const D = 2;

  it('Pythagorean on D: D–E is a 9/8 and D–C is the 16/9 that C–B♭ is in C', () => {
    const onD = { system: 'pythagorean', tonic: D } as const;
    expect(centsAboveTonic(onD, D)).toBe(0);
    expect(centsAboveTonic(onD, 4)).toBeCloseTo(203.91, 3);
    expect(centsAboveTonic(onD, 0)).toBeCloseTo(996.09, 3);
    // The wolf moves with the chain: D–A♯ is now the Pythagorean 6561/4096 (815.640¢).
    expect(centsAboveTonic(onD, 10)).toBeCloseTo(815.64, 3);
  });

  it('meantone: the A♭–C third is 427¢ (G♯–C) on C, but a pure 5/4 on A♭', () => {
    expect(1200 - centsAboveTonic({ system: 'meantone', tonic: 0 }, 8)).toBeCloseTo(427.373, 3);
    expect(centsAboveTonic({ system: 'meantone', tonic: 8 }, 0)).toBeCloseTo(386.314, 3);
  });

  it('every Tonic gives the same 12 cents above the Tonic as C does', () => {
    for (let tonic = 0; tonic < 12; tonic++) {
      expect(centsAboveTonic({ system: 'kirnberger-iii', tonic }, (tonic + 6) % 12)).toBeCloseTo(
        590.224,
        3,
      );
    }
  });
});

describe('historical spellings of the 12 keys', () => {
  const spellings = (system: Parameters<typeof keySpelling>[0]['system'], tonic = C) =>
    Array.from({ length: 12 }, (_, pc) => keySpelling({ system, tonic }, pc)).join(' ');

  it('meantone and Pythagorean in C have C♯ and G♯ but no D♭ or A♭', () => {
    expect(spellings('meantone')).toBe('C C♯ D E♭ E F F♯ G G♯ A B♭ B');
    expect(spellings('pythagorean')).toBe('C C♯ D E♭ E F F♯ G G♯ A B♭ B');
  });

  it('Werckmeister III spells its flat side: D♭, G♭ and A♭', () => {
    expect(spellings('werckmeister-iii')).toBe('C D♭ D E♭ E F G♭ G A♭ A B♭ B');
  });

  it('Vallotti, Kirnberger III and 5-limit just intonation follow their tables', () => {
    expect(spellings('vallotti')).toBe('C C♯ D E♭ E F F♯ G G♯ A B♭ B');
    expect(spellings('kirnberger-iii')).toBe('C D♭ D E♭ E F F♯ G A♭ A B♭ B');
    expect(spellings('just')).toBe('C D♭ D E♭ E F F♯ G A♭ A B♭ B');
  });

  it('12-EDO uses the familiar names', () => {
    expect(spellings('12-edo')).toBe('C C♯ D E♭ E F F♯ G A♭ A B♭ B');
  });

  it('the spellings move with the Tonic: Pythagorean on D runs F…A♯', () => {
    expect(spellings('pythagorean', 2)).toBe('C C♯ D D♯ E F F♯ G G♯ A A♯ B');
    expect(spellings('meantone', 3)).toBe('C D♭ D E♭ E F G♭ G A♭ A B♭ B');
  });

  it('a Tonic on a black key is spelled as in its key signature (D♭, not C♯)', () => {
    expect(spellings('meantone', 1)).toBe('C D♭ D E♭ F♭ F G♭ G A♭ A B♭ C♭');
    expect(spellings('pythagorean', 6)).toBe('B♯ C♯ C𝄪 D♯ E E♯ F♯ F𝄪 G♯ A A♯ B');
  });
});

describe('how each key is built (its construction)', () => {
  const build = (system: Parameters<typeof keyConstruction>[0]['system'], pc: number, tonic = C) => {
    const result = keyConstruction({ system, tonic }, pc);
    if (!result) throw new Error('expected a construction');
    return result;
  };

  it('a key reached by pure fifths is a Pythagorean ratio', () => {
    expect(build('pythagorean', 1)).toMatchObject({
      spelling: 'C♯',
      fifths: 7,
      pythagorean: { num: 2187, den: 2048 },
      commaFraction: { num: 0, den: 1 },
      ratio: { num: 2187, den: 2048 },
    });
    expect(build('werckmeister-iii', 1).ratio).toEqual({ num: 256, den: 243 });
  });

  it('a whole number of syntonic commas gives a 5-limit ratio', () => {
    expect(build('meantone', 4).ratio).toEqual({ num: 5, den: 4 });
    expect(build('kirnberger-iii', 6).ratio).toEqual({ num: 45, den: 32 });
    expect(build('just', 1).ratio).toEqual({ num: 16, den: 15 });
    expect(build('just', 8).ratio).toEqual({ num: 8, den: 5 });
    expect(build('just', 10).ratio).toEqual({ num: 9, den: 5 });
  });

  it('a fraction of a comma gives no ratio, only the Pythagorean ratio and the fraction', () => {
    expect(build('meantone', 2)).toMatchObject({
      spelling: 'D',
      pythagorean: { num: 9, den: 8 },
      comma: 'syntonic',
      commaFraction: { num: 1, den: 2 },
      ratio: null,
    });
    expect(build('meantone', 2).cents).toBeCloseTo(193.157, 3);
    expect(build('werckmeister-iii', 4)).toMatchObject({
      pythagorean: { num: 81, den: 64 },
      comma: 'pythagorean',
      commaFraction: { num: 3, den: 4 },
      ratio: null,
    });
  });

  it('a key below the Tonic in fifths is raised by its narrowed fifths', () => {
    expect(build('vallotti', 5)).toMatchObject({
      spelling: 'F',
      fifths: -1,
      pythagorean: { num: 4, den: 3 },
      commaFraction: { num: -1, den: 6 },
    });
    expect(build('vallotti', 5).cents).toBeCloseTo(501.955, 3);
  });

  it('follows the Tonic: Pythagorean on D builds E as a 9/8', () => {
    expect(build('pythagorean', 4, 2)).toMatchObject({ spelling: 'E', ratio: { num: 9, den: 8 } });
  });

  it('12-EDO keys are not built from fifths', () => {
    expect(keyConstruction({ system: '12-edo', tonic: C }, 4)).toBeNull();
  });
});

describe('note names with their octave (scientific pitch notation)', () => {
  it('name each key by its spelling', () => {
    expect(noteName({ system: 'meantone', tonic: C }, { pitchClass: 8, octave: 4 })).toBe('G♯4');
    expect(noteName({ system: 'werckmeister-iii', tonic: C }, { pitchClass: 8, octave: 4 })).toBe(
      'A♭4',
    );
    expect(noteName({ system: '12-edo', tonic: C }, { pitchClass: 1, octave: 4 })).toBe('C♯4');
  });

  it('keep the octave number with the letter: the C5 key spelled B♯ is B♯4', () => {
    expect(noteName({ system: 'meantone', tonic: 11 }, { pitchClass: 0, octave: 5 })).toBe('B♯4');
    expect(noteName({ system: 'meantone', tonic: 1 }, { pitchClass: 11, octave: 4 })).toBe('C♭5');
  });
});

describe('the chain of fifths and where it closes', () => {
  const chain = (system: Parameters<typeof chainOfFifths>[0]['system'], tonic = C) => {
    const result = chainOfFifths({ system, tonic });
    if (!result) throw new Error('expected a chain');
    return { ...result, notes: result.notes.join(' ') };
  };

  it('Pythagorean in C runs E♭…G♯ with the wolf G♯–E♭ a Pythagorean comma narrow', () => {
    const { notes, closingFifth, wolf } = chain('pythagorean');
    expect(notes).toBe('E♭ B♭ F C G D A E B F♯ C♯ G♯');
    expect(closingFifth.from).toBe('G♯');
    expect(closingFifth.to).toBe('E♭');
    expect(closingFifth.cents).toBeCloseTo(678.495, 3);
    expect(wolf).toBe(true);
  });

  it('Pythagorean on D runs F…A♯, wolf A♯–F', () => {
    const { notes, closingFifth } = chain('pythagorean', 2);
    expect(notes).toBe('F C G D A E B F♯ C♯ G♯ D♯ A♯');
    expect([closingFifth.from, closingFifth.to]).toEqual(['A♯', 'F']);
    expect(closingFifth.cents).toBeCloseTo(678.495, 3);
  });

  it('the meantone wolf G♯–E♭ is 737.637¢', () => {
    const { closingFifth, wolf } = chain('meantone');
    expect(closingFifth.cents).toBeCloseTo(737.637, 3);
    expect(wolf).toBe(true);
  });

  it('5-limit just intonation closes on a wide F♯–D♭ of 1024/675 (721.508¢)', () => {
    const { notes, closingFifth, wolf } = chain('just');
    expect(notes).toBe('D♭ A♭ E♭ B♭ F C G D A E B F♯');
    expect(closingFifth.cents).toBeCloseTo(721.508, 3);
    expect(wolf).toBe(true);
  });

  it('the well-temperaments have no wolf', () => {
    expect(chain('werckmeister-iii').closingFifth).toMatchObject({ from: 'B', to: 'G♭' });
    expect(chain('werckmeister-iii').closingFifth.cents).toBeCloseTo(696.09, 3);
    expect(chain('kirnberger-iii').closingFifth).toMatchObject({ from: 'F♯', to: 'D♭' });
    expect(chain('kirnberger-iii').closingFifth.cents).toBeCloseTo(700.001, 3);
    expect(chain('vallotti').closingFifth.cents).toBeCloseTo(701.955, 3);
    for (const system of ['werckmeister-iii', 'vallotti', 'kirnberger-iii'] as const) {
      expect(chain(system).wolf).toBe(false);
    }
  });

  it('12-EDO is not built as a chain', () => {
    expect(chainOfFifths({ system: '12-edo', tonic: C })).toBeNull();
  });
});

describe('pitch resolution: a key’s frequency from the Reference pitch', () => {
  const note = (pitchClass: number, octave: number) => ({ pitchClass, octave });
  const A4 = note(9, 4);

  it('A4 sounds at the Reference pitch in every system and on every Tonic', () => {
    for (const system of ['12-edo', 'pythagorean', 'meantone', 'just'] as const) {
      for (const tonic of [0, 2, 8]) {
        expect(resolvePitch({ system, tonic }, A4, 415).frequency).toBeCloseTo(415, 9);
      }
    }
  });

  it('12-EDO keeps middle C at 261.63 Hz', () => {
    expect(resolvePitch({ system: '12-edo', tonic: C }, note(0, 4), 440).frequency).toBeCloseTo(
      261.6256,
      4,
    );
  });

  it('Pythagorean in C: A4 is a 27/16 above C4, so C4 = 260.74 Hz and C5 = 521.48 Hz', () => {
    const pythagorean = { system: 'pythagorean', tonic: C } as const;
    expect(resolvePitch(pythagorean, note(0, 4), 440).frequency).toBeCloseTo(260.7407, 4);
    expect(resolvePitch(pythagorean, note(0, 5), 440).frequency).toBeCloseTo(521.4815, 4);
  });

  it('meantone in C puts C4 at 263.18 Hz, 889.735¢ below A4', () => {
    const pitch = resolvePitch({ system: 'meantone', tonic: C }, note(0, 4), 440);
    expect(pitch.frequency).toBeCloseTo(263.1814, 4);
    expect(pitch.centsFromA4).toBeCloseTo(-889.735, 3);
    expect(pitch.centsAboveTonic).toBe(0);
  });

  it('Pythagorean on D: D4 is a pure fifth below A4 (293.33 Hz)', () => {
    const pitch = resolvePitch({ system: 'pythagorean', tonic: 2 }, note(2, 4), 440);
    expect(pitch.frequency).toBeCloseTo(293.3333, 4);
  });

  it('meantone on B: the C5 key is B♯, a 76.049¢ semitone above B4, not below it', () => {
    const onB = { system: 'meantone', tonic: 11 } as const;
    expect(keySpelling(onB, 0)).toBe('B♯');
    expect(resolvePitch(onB, note(11, 4), 440).frequency).toBeCloseTo(491.935, 3);
    expect(resolvePitch(onB, note(0, 5), 440).frequency).toBeCloseTo(514.0261, 3);
  });
});

describe('commas', () => {
  it('the Pythagorean comma is 23.460¢ and the syntonic comma 21.506¢', () => {
    expect(cents(commaRatio('pythagorean'))).toBeCloseTo(23.46, 3);
    expect(cents(commaRatio('syntonic'))).toBeCloseTo(21.506, 3);
  });
});

describe('12-EDO as a tuning system', () => {
  it('puts every key a whole number of hundred cents above C', () => {
    const table = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100];
    for (const [pc, expected] of table.entries()) {
      expect(centsAboveTonic({ system: '12-edo', tonic: C }, pc)).toBeCloseTo(expected, 9);
    }
  });
});

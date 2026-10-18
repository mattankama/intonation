import { describe, expect, it } from 'vitest';
import {
  COMMA_PUMP_IDS,
  type CommaPumpId,
  commaPumpComma,
  commaPumpDrift,
  commaPumpLength,
  factorsCents,
  factorsFraction,
  nodeOfFactors,
  octaveReduceFactors,
  primeFactors,
  ratio,
  runCommaPump,
  tunePumpChord,
} from './index';

describe('comma pumps: one loop comes home a comma off (decision #11)', () => {
  it.each([
    ['syntonic', -21.506, 80, 81],
    ['pythagorean', 23.46, 531441, 524288],
    ['lesser-diesis', -41.059, 125, 128],
    ['greater-diesis', 62.565, 648, 625],
    ['septimal', 27.264, 64, 63],
  ] as const)('%s drifts %s¢ (%s/%s)', (id, drift, num, den) => {
    const comma = commaPumpComma(id);
    expect(factorsCents(comma)).toBeCloseTo(drift, 3);
    expect(comma).toEqual(primeFactors(ratio(num, den)));
  });

  it('offers the five presets, syntonic first (the default)', () => {
    expect(COMMA_PUMP_IDS).toEqual(['syntonic', 'pythagorean', 'lesser-diesis', 'greater-diesis', 'septimal']);
  });
});

const node = (three: number, five = 0, seven = 0) => ({ three, five, seven });
const pitch = (num: number, den: number) => primeFactors(ratio(num, den))!;
const rootNodes = (id: CommaPumpId, steps: number) => runCommaPump(id, steps).map((s) => nodeOfFactors(s.root));

describe('stepping through a comma pump', () => {
  it('starts on the pure chord on 1/1, in root position', () => {
    expect(runCommaPump('syntonic', 0)[0]!.notes.map((n) => n.pitch)).toEqual([pitch(1, 1), pitch(5, 4), pitch(3, 2)]);
    expect(runCommaPump('greater-diesis', 0)[0]!.notes.map((n) => n.pitch)).toEqual([
      pitch(1, 1),
      pitch(6, 5),
      pitch(3, 2),
    ]);
  });

  it('syntonic: C–Am–Dm–G–C walks the lattice and comes home on 80/81, then keeps going', () => {
    expect(rootNodes('syntonic', 8)).toEqual([
      node(0),
      node(-1, 1),
      node(-2, 1),
      node(-3, 1),
      node(-4, 1),
      node(-5, 2),
      node(-6, 2),
      node(-7, 2),
      node(-8, 2),
    ]);
  });

  it('Dm holds A at 5/3 from Am, so its D is 10/9', () => {
    const dm = runCommaPump('syntonic', 2)[2]!;
    expect(dm.held?.pitch).toEqual(pitch(5, 3));
    expect(dm.notes.map((n) => n.pitch)).toEqual([pitch(10, 9), pitch(4, 3), pitch(5, 3)]);
  });

  it('septimal: G7 holds F (4/3) as its harmonic seventh, so G is 32/21 and home is 64/63', () => {
    const [, , g7, home] = runCommaPump('septimal', 3);
    expect(g7!.held).toEqual({ interval: 'harmonic-seventh', pitch: pitch(4, 3) });
    expect(nodeOfFactors(g7!.root)).toEqual(node(-1, 0, -1));
    expect(g7!.notes.map((n) => n.pitch)).toEqual([pitch(20, 21), pitch(8, 7), pitch(4, 3), pitch(32, 21)]);
    expect(home!.notes.map((n) => n.pitch)).toEqual([pitch(64, 63), pitch(80, 63), pitch(32, 21)]);
  });

  it.each(COMMA_PUMP_IDS)('%s: every step holds a note of the previous chord at its exact pitch', (id) => {
    const run = runCommaPump(id, 3 * commaPumpLength(id));
    run.slice(1).forEach((step, i) => {
      expect(step.held).not.toBeNull();
      expect(run[i]!.notes.map((n) => n.pitch)).toContainEqual(step.held!.pitch);
    });
  });

  it('counts loops: each return home starts the next loop', () => {
    const run = runCommaPump('lesser-diesis', 7);
    expect(run.map((s) => [s.loop, s.position])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
    ]);
  });

  it('drift accumulates: three syntonic loops are 64.519¢ flat', () => {
    expect(factorsCents(commaPumpDrift('syntonic', 3))).toBeCloseTo(-64.519, 3);
    expect(factorsCents(runCommaPump('syntonic', 12).at(-1)!.root)).toBeCloseTo(-64.519, 3);
  });

  it('with no shared note, the root moves by the simplest pure interval', () => {
    const c = tunePumpChord(null, { root: 0, type: 'major', pure: '5-limit' });
    const d = tunePumpChord(c, { root: 2, type: 'major', pure: '5-limit' });
    expect(d.held).toBeNull();
    expect(d.root).toEqual(pitch(9, 8));
  });
});

describe('exact pitches as prime exponents', () => {
  it('keeps long pumps exact: three Pythagorean commas', () => {
    expect(factorsFraction(commaPumpDrift('pythagorean', 3))).toEqual({
      num: 150094635296999121n,
      den: 144115188075855872n,
    });
  });

  it('keeps every chord in one register however far it drifts: 100 loops on, notes stay within −300¢ … 900¢', () => {
    for (const id of COMMA_PUMP_IDS) {
      const run = runCommaPump(id, 100 * commaPumpLength(id));
      const home = run.at(-1)!;
      expect(home.loop).toBe(100);
      // The root really has drifted by 100 commas on the lattice …
      expect(nodeOfFactors(home.root)).toEqual(nodeOfFactors(commaPumpDrift(id, 100)));
      // … but what sounds is voiced within one octave from 300¢ below the Tonic.
      for (const step of run.slice(-commaPumpLength(id))) {
        for (const note of step.notes) {
          expect(factorsCents(note.pitch)).toBeGreaterThanOrEqual(-300);
          expect(factorsCents(note.pitch)).toBeLessThan(900);
        }
      }
    }
  });

  it('octave-reduces like ratios do: 80/81 → 160/81', () => {
    expect(octaveReduceFactors(pitch(80, 81))).toEqual(pitch(160, 81));
  });
});

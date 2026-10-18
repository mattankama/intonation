import { describe, expect, it } from 'vitest';
import { MAX_LOOPS, maxPumpStep, pumpLimit, readPump, writePump } from './pumpState';

const read = (query: string) => readPump(new URLSearchParams(query));
const write = (query: string, state: Parameters<typeof writePump>[1]) =>
  writePump(new URLSearchParams(query), state).toString();

describe('the comma explorer in the URL (?pump= and ?step=)', () => {
  it('is off by default: the lattice builds chords', () => {
    expect(read('')).toBeNull();
    expect(read('pump=nonsense')).toBeNull();
  });

  it('reads the preset and the step reached', () => {
    expect(read('pump=syntonic')).toEqual({ id: 'syntonic', step: 0 });
    expect(read('pump=septimal&step=5')).toEqual({ id: 'septimal', step: 5 });
  });

  it('ignores a step that is not a whole number in range', () => {
    expect(read('pump=syntonic&step=-1')).toEqual({ id: 'syntonic', step: 0 });
    expect(read('pump=syntonic&step=2.5')).toEqual({ id: 'syntonic', step: 0 });
    expect(read('pump=syntonic&step=x')).toEqual({ id: 'syntonic', step: 0 });
    expect(read(`pump=syntonic&step=${maxPumpStep('syntonic') + 1}`)).toEqual({ id: 'syntonic', step: 0 });
  });

  it(`stops after ${MAX_LOOPS} loops`, () => {
    expect(maxPumpStep('syntonic')).toBe(4 * MAX_LOOPS);
    expect(maxPumpStep('pythagorean')).toBe(12 * MAX_LOOPS);
  });

  it('writes the preset always and the step unless 0, keeping other parameters', () => {
    expect(write('chord=1/1&tonic=D', { id: 'syntonic', step: 0 })).toBe('chord=1%2F1&tonic=D&pump=syntonic');
    expect(write('', { id: 'lesser-diesis', step: 3 })).toBe('pump=lesser-diesis&step=3');
    expect(write('pump=syntonic&step=3&tonic=D', null)).toBe('tonic=D');
  });

  it('turns the lattice to 7-limit only for the septimal pump', () => {
    expect(pumpLimit('septimal')).toBe(7);
    expect(pumpLimit('syntonic')).toBe(5);
    expect(pumpLimit('greater-diesis')).toBe(5);
  });
});

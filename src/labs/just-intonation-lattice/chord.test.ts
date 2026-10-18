import { describe, expect, it } from 'vitest';
import { MAX_CHORD_NOTES, readLattice, setLimit, toggleNode, writeLattice } from './chord';

const node = (three: number, five = 0, seven = 0) => ({ three, five, seven });
const read = (query: string) => readLattice(new URLSearchParams(query));
const MAJOR = [node(0), node(0, 1), node(1)];

describe('the lattice in the URL (?chord= and ?limit=)', () => {
  it('starts flat (5-limit) with the major triad on the Tonic', () => {
    expect(read('')).toEqual({ limit: 5, chord: MAJOR });
  });

  it('reads the chord as ratios, in the order they were added', () => {
    expect(read('chord=6/5,1/1,3/2')).toEqual({ limit: 5, chord: [node(1, -1), node(0), node(1)] });
  });

  it('an empty chord stays empty', () => {
    expect(read('chord=')).toEqual({ limit: 5, chord: [] });
  });

  it('octave-reduces, and drops invalid, repeated and beyond-7-limit notes', () => {
    expect(read('chord=3/1,x,3/2,11/8,5/0,5/4')).toEqual({ limit: 5, chord: [node(1), node(0, 1)] });
  });

  it(`keeps at most ${MAX_CHORD_NOTES} notes`, () => {
    expect(read('chord=1/1,3/2,9/8,27/16,81/64,243/128,5/4').chord).toHaveLength(MAX_CHORD_NOTES);
  });

  it('reads the 7-limit, and a chord using ×7 turns it on', () => {
    expect(read('limit=7').limit).toBe(7);
    expect(read('limit=9').limit).toBe(5);
    expect(read('chord=1/1,7/4')).toEqual({ limit: 7, chord: [node(0), node(0, 0, 1)] });
  });

  it('writes the state, leaving defaults out and keeping other parameters', () => {
    const write = (state: Parameters<typeof writeLattice>[1]) =>
      writeLattice(new URLSearchParams('tonic=D&chord=1/1'), state).toString();
    expect(write({ limit: 5, chord: MAJOR })).toBe('tonic=D');
    expect(write({ limit: 7, chord: [node(0), node(0, 0, 1)] })).toBe('tonic=D&chord=1%2F1%2C7%2F4&limit=7');
    expect(write({ limit: 5, chord: [] })).toBe('tonic=D&chord=');
  });

  it('round-trips', () => {
    const state = { limit: 7 as const, chord: [node(-1, 1), node(2, -1, 1), node(0)] };
    expect(readLattice(writeLattice(new URLSearchParams(), state))).toEqual(state);
  });
});

describe('building a chord', () => {
  it('a click adds a node, a second click removes it', () => {
    expect(toggleNode([node(0)], node(1))).toEqual([node(0), node(1)]);
    expect(toggleNode([node(0), node(1)], node(0))).toEqual([node(1)]);
  });

  it(`a full chord (${MAX_CHORD_NOTES} notes) drops its oldest note for the new one`, () => {
    const full = [0, 1, 2, 3, 4, 5].map((a) => node(a));
    expect(toggleNode(full, node(0, 1))).toEqual([...full.slice(1), node(0, 1)]);
  });

  it('going back to 5-limit drops the ×7 notes', () => {
    expect(setLimit({ limit: 7, chord: [node(0), node(0, 0, 1)] }, 5)).toEqual({ limit: 5, chord: [node(0)] });
    expect(setLimit({ limit: 5, chord: MAJOR }, 7)).toEqual({ limit: 7, chord: MAJOR });
  });
});

import { describe, expect, it } from 'vitest';
import { nodeOfFactors } from '../../core';
import { pitchLabel } from './labels';
import { PATH_LOOPS, pumpPicture } from './pumpPicture';

describe('the comma explorer’s picture, however many loops on', () => {
  it('keeps stepping: Next is never switched off by the number of loops', () => {
    const picture = pumpPicture({ id: 'syntonic', step: 400 });
    expect(picture.current.loop).toBe(100);
    expect(picture.canStep).toBe(true);
  });

  it('draws the whole path of roots for the first loops', () => {
    const picture = pumpPicture({ id: 'syntonic', step: 6 });
    expect(picture.path).toHaveLength(7);
    expect(picture.path[0]).toEqual({ three: 0, five: 0, seven: 0 });
  });

  it('draws only the last few loops of the path after many, ending at the current root', () => {
    const picture = pumpPicture({ id: 'pythagorean', step: 1200 });
    expect(picture.path).toHaveLength(PATH_LOOPS * 12 + 1);
    expect(picture.path.at(-1)).toEqual(nodeOfFactors(picture.current.root));
  });

  it('labels a note a hundred Pythagorean commas on in a few characters, still exactly', () => {
    const { current } = pumpPicture({ id: 'pythagorean', step: 1200 });
    const label = pitchLabel(0, current.root);
    expect(label).toBe('A♯×171 3¹²⁰⁰/2¹⁹⁰¹');
  });
});

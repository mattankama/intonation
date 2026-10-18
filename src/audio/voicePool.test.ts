import { describe, expect, it } from 'vitest';
import { VoicePool } from './voicePool';

describe('the voice pool: never more than its limit sounding or ringing out', () => {
  it('admits voices freely up to the limit', () => {
    const pool = new VoicePool<string>(3);
    expect(pool.admit('a')).toBeNull();
    expect(pool.admit('b')).toBeNull();
    expect(pool.admit('c')).toBeNull();
    expect(pool.size).toBe(3);
  });

  it('past the limit, hands over the oldest voice to the new one', () => {
    const pool = new VoicePool<string>(3);
    for (const v of ['a', 'b', 'c']) pool.admit(v);
    expect(pool.admit('d')).toBe('a');
    expect(pool.admit('e')).toBe('b');
    expect(pool.size).toBe(3);
  });

  it('hands over a voice already ringing out before one still held', () => {
    const pool = new VoicePool<string>(3);
    for (const v of ['a', 'b', 'c']) pool.admit(v);
    pool.release('c');
    expect(pool.admit('d')).toBe('c');
    expect(pool.admit('e')).toBe('a');
  });

  it('frees a place when a voice has rung out', () => {
    const pool = new VoicePool<string>(2);
    pool.admit('a');
    pool.admit('b');
    pool.release('a');
    pool.end('a');
    expect(pool.admit('c')).toBeNull();
    expect(pool.size).toBe(2);
  });

  it('stays within the limit through any run of notes', () => {
    const pool = new VoicePool<number>(8);
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const live = new Set<number>();
    for (let v = 0; v < 2000; v++) {
      const handed = pool.admit(v);
      if (handed !== null) live.delete(handed);
      live.add(v);
      for (const u of [...live]) {
        const r = random();
        if (r < 0.2) pool.release(u);
        else if (r < 0.3) {
          pool.end(u);
          live.delete(u);
        }
      }
      expect(pool.size).toBeLessThanOrEqual(8);
      expect(live.size).toBe(pool.size);
    }
  });
});

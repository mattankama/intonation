import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FALLBACK_COLORS, SCENE_COLOR_TOKENS, SYSTEM_COLOR_TOKENS } from './colors';

/** Every custom property in the design system's colour tokens, with var() chains resolved. */
function tokenValues(): Map<string, string> {
  const css = readFileSync(new URL('../../design-system/tokens/colors.css', import.meta.url), 'utf8');
  const raw = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) raw.set(name!, value!.trim());
  const resolve = (value: string): string => {
    const ref = /^var\((--[\w-]+)\)$/.exec(value);
    return ref ? resolve(raw.get(ref[1]!) ?? value) : value;
  };
  return new Map([...raw].map(([name, value]) => [name, resolve(value).toLowerCase()]));
}

describe('scene colour fallbacks match the design-system tokens', () => {
  const tokens = tokenValues();

  it.each(Object.entries(SCENE_COLOR_TOKENS))('%s falls back to %s', (role, token) => {
    expect(tokens.get(token)).toBeDefined();
    expect(FALLBACK_COLORS[role as keyof typeof SCENE_COLOR_TOKENS].toLowerCase()).toBe(tokens.get(token));
  });

  it('every tuning-system colour falls back to its token', () => {
    expect(FALLBACK_COLORS.systems.map((c) => c.toLowerCase())).toEqual(SYSTEM_COLOR_TOKENS.map((t) => tokens.get(t)));
  });
});

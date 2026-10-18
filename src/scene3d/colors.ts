/**
 * Scene colours, read from the design-system tokens so the CSS stays the one source of
 * truth (decision #13). three.js needs real colour values, so they are resolved from the
 * custom properties on :root when a scene mounts.
 */

/** The four tuning-system colours, in order: charcoal, link teal, forest, deep gold. */
export const SYSTEM_COLOR_TOKENS = [
  '--data-system-1',
  '--data-system-2',
  '--data-system-3',
  '--data-system-4',
] as const;

export interface SceneColors {
  /** The scene background, the warm canvas. */
  readonly background: string;
  /** Ink: pure-target rings, label text, emphasis. */
  readonly ink: string;
  /** Hairline: axes and guides. */
  readonly guide: string;
  /** Link teal (comma pump paths, highlights). */
  readonly accent: string;
  /** Soft gold fill (lattice chord shapes). */
  readonly fill: string;
  /** The 4 data colours for overlaid tuning systems. */
  readonly systems: readonly [string, string, string, string];
}

const FALLBACK: SceneColors = {
  background: '#f1efed',
  ink: '#161513',
  guide: '#d4cfca',
  accent: '#006b8f',
  fill: '#f7e0a1',
  systems: ['#312d2a', '#006b8f', '#33553c', '#b8892a'],
};

/** The scene colours from the tokens on :root (fallbacks where a token is missing). */
export function readSceneColors(): SceneColors {
  if (typeof document === 'undefined') return FALLBACK;
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const [s1, s2, s3, s4] = SYSTEM_COLOR_TOKENS.map((name, i) => token(name, FALLBACK.systems[i]!));
  return {
    background: token('--canvas-warm', FALLBACK.background),
    ink: token('--ink', FALLBACK.ink),
    guide: token('--field-border', FALLBACK.guide),
    accent: token('--link', FALLBACK.accent),
    fill: token('--accent-gold-soft', FALLBACK.fill),
    systems: [s1!, s2!, s3!, s4!],
  };
}

/** The CSS value of the k-th system colour, for legends and tables outside the scene. */
export const systemColorVar = (k: number) => `var(${SYSTEM_COLOR_TOKENS[k % 4]})`;

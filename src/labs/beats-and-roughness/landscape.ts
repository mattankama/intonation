/**
 * The roughness section's set-up (issue #29; decision #15 Roughness landscape framing):
 * - the bottom note, C3 / C4 / C5, in the URL (?bottom=C3; C4 is left out);
 * - "Show 12-EDO versions", in the URL (?edo12=1);
 * - the pinned chords: the nine chord types in root position as pure chords, as stacked
 *   intervals (lower = bottom → middle, upper = middle → top). The landscape holds three-note
 *   chords, so the 7th chords are pinned without their fifth (root, third, seventh);
 * - the grid size: ~200 × 200 on desktop, ~60 × 60 on phones (decision #17).
 */
import {
  CHORD_TYPES,
  type ChordType,
  LANDSCAPE_MAX_CENTS,
  type Ratio,
  cents,
  centsBetween,
  chordTones,
  edo12Frequency,
  tuneChord,
} from '../../core';

export const BOTTOM_NOTES = ['C3', 'C4', 'C5'] as const;
export type BottomNote = (typeof BOTTOM_NOTES)[number];
export const BOTTOM_KEY = 'bottom';
export const DEFAULT_BOTTOM: BottomNote = 'C4';
export const SHOW_EDO12_KEY = 'edo12';

const isBottom = (raw: string | null): raw is BottomNote => BOTTOM_NOTES.includes(raw as BottomNote);

export function readBottom(params: URLSearchParams): BottomNote {
  const raw = params.get(BOTTOM_KEY);
  return isBottom(raw) ? raw : DEFAULT_BOTTOM;
}

export function writeBottom(params: URLSearchParams, bottom: BottomNote): URLSearchParams {
  const next = new URLSearchParams(params);
  if (bottom === DEFAULT_BOTTOM) next.delete(BOTTOM_KEY);
  else next.set(BOTTOM_KEY, bottom);
  return next;
}

export const readShowEdo12 = (params: URLSearchParams): boolean => params.get(SHOW_EDO12_KEY) === '1';

export function writeShowEdo12(params: URLSearchParams, show: boolean): URLSearchParams {
  const next = new URLSearchParams(params);
  if (show) next.set(SHOW_EDO12_KEY, '1');
  else next.delete(SHOW_EDO12_KEY);
  return next;
}

/** The bottom note's frequency: that C in 12-EDO from the Reference pitch (A4). */
export function bottomFrequency(bottom: BottomNote, referencePitch: number): number {
  return edo12Frequency({ pitchClass: 0, octave: Number(bottom.slice(1)) }, referencePitch);
}

/** A three-note chord as two stacked intervals, in cents. */
export interface StackedIntervals {
  readonly lower: number;
  readonly upper: number;
}

export interface LandscapePin {
  readonly type: ChordType;
  /** The pure chord's notes in lowest whole numbers, e.g. [4, 5, 6]. */
  readonly proportion: readonly number[];
  /** A 7th chord pinned as root, third and seventh. */
  readonly withoutFifth: boolean;
  readonly pure: StackedIntervals;
  readonly edo12: StackedIntervals;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Ratios above a root in lowest whole numbers: 1, 5/4, 9/5 → 20:25:36. */
function proportion(ratios: readonly Ratio[]): number[] {
  const lcm = ratios.reduce((l, r) => (l * r.den) / gcd(l, r.den), 1);
  const whole = ratios.map((r) => (r.num * lcm) / r.den);
  const common = whole.reduce(gcd);
  return whole.map((w) => w / common);
}

const stack = ([a, b, c]: readonly number[]): StackedIntervals => ({ lower: b! - a!, upper: c! - b! });

/** The nine chord types as pins on the landscape, in menu order. */
export function landscapePins(): LandscapePin[] {
  return CHORD_TYPES.map((type) => {
    const choice = { root: 0, type, inversion: 0, pure: '5-limit' } as const;
    const withoutFifth = chordTones(choice).length > 3;
    const keep = <T extends { interval: string }>(notes: readonly T[]) =>
      withoutFifth ? notes.filter((n) => n.interval !== 'fifth') : notes;
    const tones = keep(chordTones(choice));
    const edo = keep(tuneChord({ system: '12-edo', tonic: 0 }, choice, 440).notes);
    return {
      type,
      proportion: proportion(tones.map((t) => t.ratio)),
      withoutFifth,
      pure: stack(tones.map((t) => cents(t.ratio))),
      edo12: stack(edo.map((n) => centsBetween(edo[0]!.frequency, n.frequency))),
    };
  });
}

/** The landscape's floor is a square this wide (scene units), centred on the origin. */
export const LANDSCAPE_SIZE = 6;
/** The height of relative roughness 1 (scene units). */
export const LANDSCAPE_HEIGHT = 2.2;
const HALF = LANDSCAPE_SIZE / 2;
const clampCents = (c: number) => Math.min(LANDSCAPE_MAX_CENTS, Math.max(0, Math.round(c)));

/**
 * Where a chord sits: lower interval along x, upper interval along z (towards the viewer, so
 * the rough walls of narrow intervals stand at the back), roughness up.
 */
export function scenePoint(lower: number, upper: number, roughness: number): [number, number, number] {
  return [
    -HALF + (LANDSCAPE_SIZE * lower) / LANDSCAPE_MAX_CENTS,
    LANDSCAPE_HEIGHT * roughness,
    -HALF + (LANDSCAPE_SIZE * upper) / LANDSCAPE_MAX_CENTS,
  ];
}

/** The chord under a point on the floor plan (x, z), in whole cents. */
export function chordAt(x: number, z: number): StackedIntervals {
  return {
    lower: clampCents(((x + HALF) / LANDSCAPE_SIZE) * LANDSCAPE_MAX_CENTS),
    upper: clampCents(((z + HALF) / LANDSCAPE_SIZE) * LANDSCAPE_MAX_CENTS),
  };
}

/** Grid points per axis: 6¢ steps on desktop, 20¢ on phones. */
export const landscapePoints = (phone: boolean): number => (phone ? 61 : 201);

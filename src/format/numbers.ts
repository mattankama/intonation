/**
 * Site-wide number display rules (decision: Math panel typesetting, issue #16).
 * - Cents: 1 decimal in Controls tables and labels, 3 decimals in The math.
 * - Hz: 2 decimals everywhere.
 * - Ratios: exact fractions where one exists.
 */
import type { Ratio } from '../core';

const MINUS = '−';

export const CENTS_DECIMALS = { controls: 1, math: 3 } as const;
export const HZ_DECIMALS = 2;

/** Where a number is shown; decides its precision. */
export type DisplayContext = keyof typeof CENTS_DECIMALS;

/** A fixed-decimal number with a typographic minus sign, no unit. */
export function formatDecimal(value: number, decimals: number): string {
  const text = Math.abs(value).toFixed(decimals);
  const isZero = Number(text) === 0;
  return value < 0 && !isZero ? MINUS + text : text;
}

export function formatCents(value: number, context: DisplayContext): string {
  return `${formatDecimal(value, CENTS_DECIMALS[context])}¢`;
}

/** Cents with a sign: "+0.783¢" (wide), "−5.2¢" (narrow), "0.0¢" when it rounds to zero. */
export function formatSignedCents(value: number, context: DisplayContext): string {
  const shown = formatCents(value, context);
  return value > 0 && Number(formatDecimal(value, CENTS_DECIMALS[context])) !== 0 ? `+${shown}` : shown;
}

export function formatHz(value: number): string {
  return `${formatDecimal(value, HZ_DECIMALS)} Hz`;
}

export function formatRatio(r: Ratio): string {
  return `${r.num}/${r.den}`;
}

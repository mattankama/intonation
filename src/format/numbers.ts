/**
 * Site-wide number display rules (decision: Math panel typesetting, issue #16).
 * - Cents: 1 decimal in Controls tables and labels, 3 decimals in The math.
 * - Hz: 2 decimals everywhere.
 * - Ratios: exact fractions where one exists; a pitch too long to read as a fraction is
 *   written, still exactly, as prime powers.
 */
import { type PrimeFactors, type Ratio, factorsFraction } from '../core';

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

/** "5/4"; also takes BigInt fractions (core factorsFraction, for long comma pumps). */
export function formatRatio(r: Ratio | { readonly num: bigint; readonly den: bigint }): string {
  return `${r.num}/${r.den}`;
}

/** The longest fraction written out in full ("531441/524288" is 13 characters). */
const MAX_FRACTION_LENGTH = 15;
const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const superscript = (n: number) => [...String(n)].map((d) => SUPERSCRIPT_DIGITS[Number(d)]).join('');

/**
 * An exact pitch ratio from its prime exponents: "5/4", or, once the fraction is too long
 * to read (a comma pump many loops on), its prime powers: "3¹²⁰⁰/2¹⁹⁰¹".
 */
export function formatPitchRatio(f: PrimeFactors): string {
  const full = formatRatio(factorsFraction(f));
  if (full.length <= MAX_FRACTION_LENGTH) return full;
  const powers = (sign: 1 | -1) => {
    const terms = ([[2, f.two], [3, f.three], [5, f.five], [7, f.seven]] as const)
      .filter(([, e]) => e * sign > 0)
      .map(([p, e]) => (Math.abs(e) === 1 ? `${p}` : `${p}${superscript(Math.abs(e))}`));
    return terms.length === 0 ? '1' : terms.join('·');
  };
  return `${powers(1)}/${powers(-1)}`;
}

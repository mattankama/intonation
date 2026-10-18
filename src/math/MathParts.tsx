/**
 * Building blocks for The math (decision: Math panel typesetting, issue #16).
 *
 * - Browser-native MathML, no maths library; prose around it is Source Sans.
 * - Each section: a small heading, 1–3 sentences, then a formula as
 *   general form → current values substituted → result (≤ ~80 words).
 * - Values taken from the screen are wrapped in <Live>: bold on a light tint.
 * - Each Lab's math ends with a Sources list.
 */
import { Fragment, type ReactNode } from 'react';
import { copy } from '../copy/en';
import { CENTS_DECIMALS, HZ_DECIMALS, formatDecimal } from '../format/numbers';

export function MathSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="math-section">
      <h3 className="math-heading">{heading}</h3>
      {children}
    </section>
  );
}

/** A live value from the screen inside a formula, shown bold on a tint. */
export function Live({ children }: { children: ReactNode }) {
  return <mn className="math-live">{children}</mn>;
}

/** One formula worked three ways: general form, values substituted, result. */
export function WorkedFormula({
  general,
  substituted,
  result,
}: {
  general: ReactNode;
  substituted: ReactNode;
  result: ReactNode;
}) {
  return (
    // Inline <math> in block rows keeps formulas left-aligned in the narrow inspector.
    <div className="worked-formula">
      <div data-step="general">
        <math>{general}</math>
      </div>
      <div data-step="substituted">
        <math>{substituted}</math>
      </div>
      <div data-step="result">
        <math>{result}</math>
      </div>
    </div>
  );
}

export function Sources({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="math-section math-sources">
      <h3 className="math-heading">{copy.math.sourcesHeading}</h3>
      <ul>
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  );
}

// --- Shared MathML pieces -------------------------------------------------------------------

/** A cents value as The math shows it: 3 decimals, typographic minus, no unit ("−21.506"). */
export const threeDecimalCents = (value: number) => formatDecimal(value, CENTS_DECIMALS.math);

/** A frequency as The math shows it: 2 decimals, no unit ("440.00"). */
export const twoDecimalHz = (value: number) => formatDecimal(value, HZ_DECIMALS);

/** A whole number with a typographic minus ("−3"). */
export const wholeNumber = (value: number) => formatDecimal(value, 0);

/** A unit after a number: a thin space, then the unit upright ("¢", "Hz"). */
export const unit = (symbol: string) => (
  <>
    <mspace width="0.1em" />
    <mtext>{symbol}</mtext>
  </>
);

/**
 * A name with a subscript: f₁, f_A4, f_pure. A numeric index is a number (<mn>); any other
 * index is an upright label (<mtext>).
 */
export const sub = (name: string, index: string) => (
  <msub>
    <mi>{name}</mi>
    {/^\d+$/.test(index) ? <mn>{index}</mn> : <mtext>{index}</mtext>}
  </msub>
);

/** log₂ */
export const log2 = (
  <msub>
    <mi>log</mi>
    <mn>2</mn>
  </msub>
);

/** base^exponent, with a numeric base. */
export const power = (base: string, exponent: ReactNode) => (
  <msup>
    <mn>{base}</mn>
    {exponent}
  </msup>
);

/** "(a, b, c)" as a MathML row of identifiers or numbers. */
export const triple = (items: readonly ReactNode[]) => (
  <>
    <mo>(</mo>
    {items.map((item, i) => (
      <Fragment key={i}>
        {i > 0 && <mo>,</mo>}
        {item}
      </Fragment>
    ))}
    <mo>)</mo>
  </>
);

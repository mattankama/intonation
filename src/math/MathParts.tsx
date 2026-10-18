/**
 * Building blocks for The math (decision: Math panel typesetting, issue #16).
 *
 * - Browser-native MathML, no maths library; prose around it is Source Sans.
 * - Each section: a small heading, 1–3 sentences, then a formula as
 *   general form → current values substituted → result (≤ ~80 words).
 * - Values taken from the screen are wrapped in <Live>: bold on a light tint.
 * - Each Lab's math ends with a Sources list.
 */
import type { ReactNode } from 'react';
import { copy } from '../copy/en';

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

/** MathML pieces shared by the lattice Lab's chord math and comma-pump math. */
import { Fragment, type ReactNode } from 'react';
import type { PrimeFactors } from '../../core';
import { formatDecimal } from '../../format/numbers';
import { Live, WorkedFormula } from '../../math/MathParts';

export const c3 = (value: number) => formatDecimal(value, 3);
export const whole = (value: number) => formatDecimal(value, 0);
export const unit = (symbol: string) => (
  <>
    <mspace width="0.1em" />
    <mtext>{symbol}</mtext>
  </>
);
export const log2 = (
  <msub>
    <mi>log</mi>
    <mn>2</mn>
  </msub>
);
export const power = (base: string, exponent: ReactNode) => (
  <msup>
    <mn>{base}</mn>
    {exponent}
  </msup>
);
export const sub = (name: string, index: string) => (
  <msub>
    <mi>{name}</mi>
    <mi>{index}</mi>
  </msub>
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

/** r = 2^k · 3^a · 5^b · 7^c for one ratio: its place on the lattice (a, b, c). */
export function FactorsFormula({ ratio, factors }: { ratio: string; factors: PrimeFactors }) {
  return (
    <WorkedFormula
      general={
        <>
          <mi>r</mi>
          <mo>=</mo>
          {power('2', <mi>k</mi>)}
          <mo>·</mo>
          {power('3', <mi>a</mi>)}
          <mo>·</mo>
          {power('5', <mi>b</mi>)}
          <mo>·</mo>
          {power('7', <mi>c</mi>)}
        </>
      }
      substituted={
        <>
          <Live>{ratio}</Live>
          <mo>=</mo>
          {power('2', <mn>{whole(factors.two)}</mn>)}
          <mo>·</mo>
          {power('3', <Live>{whole(factors.three)}</Live>)}
          <mo>·</mo>
          {power('5', <Live>{whole(factors.five)}</Live>)}
          <mo>·</mo>
          {power('7', <Live>{whole(factors.seven)}</Live>)}
        </>
      }
      result={
        <>
          {triple([<mi>a</mi>, <mi>b</mi>, <mi>c</mi>])}
          <mo>=</mo>
          {triple([factors.three, factors.five, factors.seven].map((e) => <mn>{whole(e)}</mn>))}
        </>
      }
    />
  );
}

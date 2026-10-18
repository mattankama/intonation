/** The prime-factor formula shared by the lattice Lab's chord math and comma-pump math. */
import type { PrimeFactors } from '../../core';
import { Live, WorkedFormula, power, triple, wholeNumber } from '../../math/MathParts';

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
          {power('2', <mn>{wholeNumber(factors.two)}</mn>)}
          <mo>·</mo>
          {power('3', <Live>{wholeNumber(factors.three)}</Live>)}
          <mo>·</mo>
          {power('5', <Live>{wholeNumber(factors.five)}</Live>)}
          <mo>·</mo>
          {power('7', <Live>{wholeNumber(factors.seven)}</Live>)}
        </>
      }
      result={
        <>
          {triple([<mi>a</mi>, <mi>b</mi>, <mi>c</mi>])}
          <mo>=</mo>
          {triple([factors.three, factors.five, factors.seven].map((e) => <mn>{wholeNumber(e)}</mn>))}
        </>
      }
    />
  );
}

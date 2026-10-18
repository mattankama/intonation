import { type Note, edo12Frequency, edo12NoteName, semitonesFromA4 } from '../core';
import { copy } from '../copy/en';
import { HZ_DECIMALS, formatDecimal } from '../format/numbers';
import { Live, MathSection, WorkedFormula } from './MathParts';

export const NOTE_MATH_SOURCES = [copy.math.sources.iso16, copy.math.sources.barbour];

const fA4 = (
  <msub>
    <mi>f</mi>
    <mtext>A4</mtext>
  </msub>
);

/** The 12-EDO frequency of the note just played, worked from the Reference pitch. */
export function NoteMath({ note, referencePitch }: { note: Note; referencePitch: number }) {
  const name = edo12NoteName(note);
  const n = semitonesFromA4(note);
  const frequency = edo12Frequency(note, referencePitch);
  return (
    <>
      <MathSection heading={copy.math.note.heading}>
        <p>{copy.math.note.body(name)}</p>
        <WorkedFormula
          general={
            <>
              <mi>f</mi>
              <mo>=</mo>
              {fA4}
              <mo>·</mo>
              <msup>
                <mn>2</mn>
                <mrow>
                  <mi>n</mi>
                  <mo>/</mo>
                  <mn>12</mn>
                </mrow>
              </msup>
            </>
          }
          substituted={
            <>
              <mi>f</mi>
              <mo>=</mo>
              <Live>{formatDecimal(referencePitch, HZ_DECIMALS)}</Live>
              <mo>·</mo>
              <msup>
                <mn>2</mn>
                <mrow>
                  <Live>{formatDecimal(n, 0)}</Live>
                  <mo>/</mo>
                  <mn>12</mn>
                </mrow>
              </msup>
            </>
          }
          result={
            <>
              <mi>f</mi>
              <mo>=</mo>
              <Live>{formatDecimal(frequency, HZ_DECIMALS)}</Live>
              <mspace width="0.25em" />
              <mtext>Hz</mtext>
            </>
          }
        />
        <p>{copy.math.note.semitones(name, n)}</p>
      </MathSection>
      <MathSection heading={copy.math.referencePitch.heading}>
        <p>{copy.math.referencePitch.body}</p>
      </MathSection>
    </>
  );
}

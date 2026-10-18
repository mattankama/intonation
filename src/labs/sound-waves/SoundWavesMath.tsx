import { Fragment } from 'react';
import { HARMONIC_COUNT, sumOfSquares, timbreHarmonics, timbreRms, wavePeak } from '../../core';
import { copy } from '../../copy/en';
import { formatDecimal } from '../../format/numbers';
import { Live, MathSection, WorkedFormula } from '../../math/MathParts';
import type { LabProps } from '../registry';

const text = copy.soundWavesMath;
const AMPLITUDE_DECIMALS = 2;
const RMS_DECIMALS = 3;

export const SOUND_WAVES_SOURCES = [copy.math.sources.fourier, copy.math.sources.helmholtz];

const sum = (
  <munderover>
    <mo>∑</mo>
    <mrow>
      <mi>n</mi>
      <mo>=</mo>
      <mn>1</mn>
    </mrow>
    <mn>{HARMONIC_COUNT}</mn>
  </munderover>
);
const x = (
  <>
    <mi>x</mi>
    <mo>(</mo>
    <mi>θ</mi>
    <mo>)</mo>
  </>
);
const an = (
  <msub>
    <mi>a</mi>
    <mi>n</mi>
  </msub>
);
const sinNTheta = (
  <>
    <mi>sin</mi>
    <mo>(</mo>
    <mi>n</mi>
    <mi>θ</mi>
    <mo>)</mo>
  </>
);

/** sin(nθ) with n written out: sin θ, sin 2θ, … */
function SinTerm({ n }: { n: number }) {
  return (
    <>
      <mi>sin</mi>
      <mo>(</mo>
      {n > 1 && <mn>{n}</mn>}
      <mi>θ</mi>
      <mo>)</mo>
    </>
  );
}

/** The Fourier sum, loudness (RMS) and phase of the current Timbre. */
export function SoundWavesMath({ settings }: LabProps) {
  const harmonics = timbreHarmonics(settings.timbre, settings.brightness);
  const terms = harmonics.map((a, i) => ({ a, n: i + 1 })).filter(({ a }) => a > 0);
  const peak = wavePeak(harmonics);

  return (
    <>
      <MathSection heading={text.sum.heading}>
        <p>{text.sum.body}</p>
        <WorkedFormula
          general={
            <>
              {x}
              <mo>=</mo>
              {sum}
              {an}
              {sinNTheta}
              <mo>,</mo>
              <mspace width="0.5em" />
              <mi>θ</mi>
              <mo>=</mo>
              <mn>2</mn>
              <mi>π</mi>
              <mi>f</mi>
              <mi>t</mi>
            </>
          }
          substituted={
            <>
              {x}
              <mo>=</mo>
              {terms.length === 0 && <mn>0</mn>}
              {terms.map(({ a, n }, i) => (
                <Fragment key={n}>
                  {i > 0 && <mo>+</mo>}
                  <Live>{formatDecimal(a, AMPLITUDE_DECIMALS)}</Live>
                  <SinTerm n={n} />
                </Fragment>
              ))}
            </>
          }
          result={
            <>
              <mi>max</mi>
              <mo>|</mo>
              <mi>x</mi>
              <mo>|</mo>
              <mo>=</mo>
              <Live>{formatDecimal(peak, AMPLITUDE_DECIMALS)}</Live>
            </>
          }
        />
        <p>{text.sum.peak}</p>
      </MathSection>

      <MathSection heading={text.loudness.heading}>
        <p>{text.loudness.body}</p>
        <WorkedFormula
          general={
            <>
              <mtext>RMS</mtext>
              <mo>=</mo>
              <msqrt>
                <mfrac>
                  <mrow>
                    <mo>∑</mo>
                    <msubsup>
                      <mi>a</mi>
                      <mi>n</mi>
                      <mn>2</mn>
                    </msubsup>
                  </mrow>
                  <mn>2</mn>
                </mfrac>
              </msqrt>
            </>
          }
          substituted={
            <>
              <mtext>RMS</mtext>
              <mo>=</mo>
              <msqrt>
                <mfrac>
                  <Live>{formatDecimal(sumOfSquares(harmonics), RMS_DECIMALS)}</Live>
                  <mn>2</mn>
                </mfrac>
              </msqrt>
            </>
          }
          result={
            <>
              <mtext>RMS</mtext>
              <mo>=</mo>
              <Live>{formatDecimal(timbreRms(harmonics), RMS_DECIMALS)}</Live>
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.phase.heading}>
        <p>{text.phase.body}</p>
        <WorkedFormula
          general={
            <>
              {x}
              <mo>=</mo>
              <mo>∑</mo>
              {an}
              <mi>sin</mi>
              <mo>(</mo>
              <mi>n</mi>
              <mi>θ</mi>
              <mo>+</mo>
              <msub>
                <mi>φ</mi>
                <mi>n</mi>
              </msub>
              <mo>)</mo>
            </>
          }
          substituted={
            <>
              <msub>
                <mi>φ</mi>
                <mi>n</mi>
              </msub>
              <mo>=</mo>
              <mn>0</mn>
              <mspace width="0.5em" />
              <mtext>for every</mtext>
              <mspace width="0.25em" />
              <mi>n</mi>
            </>
          }
          result={
            <>
              {x}
              <mo>=</mo>
              <mo>∑</mo>
              {an}
              {sinNTheta}
            </>
          }
        />
      </MathSection>
    </>
  );
}

import type { ReactNode } from 'react';
import { beatRate, timbreHarmonics } from '../../core';
import { copy } from '../../copy/en';
import { HZ_DECIMALS, formatDecimal } from '../../format/numbers';
import { Live, MathSection, WorkedFormula } from '../../math/MathParts';
import type { LabProps } from '../registry';
import { twoTones, useGap } from './beatsState';

const text = copy.beatsMath;
const SOURCES = copy.math.sources;

export const BEATS_SOURCES = [SOURCES.helmholtz, SOURCES.plompLevelt];

const hz = (value: number) => formatDecimal(value, HZ_DECIMALS);
const c3 = (value: number) => formatDecimal(value, 3);
const unit = (symbol: string) => (
  <>
    <mspace width="0.1em" />
    <mtext>{symbol}</mtext>
  </>
);
const sub = (name: string, index: string) => (
  <msub>
    <mi>{name}</mi>
    <mn>{index}</mn>
  </msub>
);
const log2 = sub('log', '2');
const difference = (f2: ReactNode, f1: ReactNode) => (
  <>
    {f2}
    <mo>−</mo>
    {f1}
  </>
);

/** The beat rate, the gap in cents, why the sum swells, harmonics, and beats vs roughness. */
export function BeatsMath({ settings }: LabProps) {
  const [gap] = useGap();
  const { f1, f2, rate, cents } = twoTones(settings, gap);
  const hasHarmonicsAboveFirst = timbreHarmonics(settings.timbre, settings.brightness).some((a, i) => i > 0 && a > 0);
  const liveF1 = <Live>{hz(f1)}</Live>;
  const liveF2 = <Live>{hz(f2)}</Live>;

  return (
    <>
      <MathSection heading={text.rate.heading}>
        <p>{text.rate.body}</p>
        <WorkedFormula
          general={
            <>
              <mi>b</mi>
              <mo>=</mo>
              {difference(sub('f', '2'), sub('f', '1'))}
            </>
          }
          substituted={
            <>
              <mi>b</mi>
              <mo>=</mo>
              {difference(liveF2, liveF1)}
            </>
          }
          result={
            <>
              <mi>b</mi>
              <mo>=</mo>
              <mn>{hz(rate)}</mn>
              {unit('Hz')}
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.gap.heading}>
        <p>{text.gap.body}</p>
        <WorkedFormula
          general={
            <>
              <mi>c</mi>
              <mo>=</mo>
              <mn>1200</mn>
              <mo>·</mo>
              {log2}
              <mfrac>
                {sub('f', '2')}
                {sub('f', '1')}
              </mfrac>
            </>
          }
          substituted={
            <>
              <mi>c</mi>
              <mo>=</mo>
              <mn>1200</mn>
              <mo>·</mo>
              {log2}
              <mfrac>
                {liveF2}
                {liveF1}
              </mfrac>
            </>
          }
          result={
            <>
              <mi>c</mi>
              <mo>=</mo>
              <mn>{c3(cents)}</mn>
              {unit('¢')}
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.swell.heading}>
        <p>{text.swell.body}</p>
        {rate > 0 ? (
          <WorkedFormula
            general={
              <>
                <mi>T</mi>
                <mo>=</mo>
                <mfrac>
                  <mn>1</mn>
                  <mi>b</mi>
                </mfrac>
              </>
            }
            substituted={
              <>
                <mi>T</mi>
                <mo>=</mo>
                <mfrac>
                  <mn>1</mn>
                  <Live>{hz(rate)}</Live>
                </mfrac>
              </>
            }
            result={
              <>
                <mi>T</mi>
                <mo>=</mo>
                <mn>{c3(1 / rate)}</mn>
                {unit('s')}
              </>
            }
          />
        ) : (
          <p className="placeholder-text">{text.swell.unison}</p>
        )}
      </MathSection>

      {hasHarmonicsAboveFirst && (
        <MathSection heading={text.harmonics.heading}>
          <p>{text.harmonics.body}</p>
          <WorkedFormula
            general={
              <>
                <msub>
                  <mi>b</mi>
                  <mi>k</mi>
                </msub>
                <mo>=</mo>
                <mi>k</mi>
                <mo>·</mo>
                <mo>(</mo>
                {difference(sub('f', '2'), sub('f', '1'))}
                <mo>)</mo>
              </>
            }
            substituted={
              <>
                {sub('b', '2')}
                <mo>=</mo>
                <mn>2</mn>
                <mo>·</mo>
                <mo>(</mo>
                {difference(liveF2, liveF1)}
                <mo>)</mo>
              </>
            }
            result={
              <>
                {sub('b', '2')}
                <mo>=</mo>
                <mn>{hz(beatRate(2 * f1, 2 * f2))}</mn>
                {unit('Hz')}
              </>
            }
          />
        </MathSection>
      )}

      <MathSection heading={text.roughness.heading}>
        <p>{text.roughness.body}</p>
      </MathSection>
    </>
  );
}

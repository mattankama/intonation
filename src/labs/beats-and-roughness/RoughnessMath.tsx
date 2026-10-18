import type { ReactNode } from 'react';
import {
  ROUGHNESS_CONSTANTS,
  chordRoughness,
  partialRoughness,
  roughnessScale,
  semitonesFromA4,
  stackedChord,
} from '../../core';
import { copy } from '../../copy/en';
import { HZ_DECIMALS, formatCents, formatDecimal } from '../../format/numbers';
import { Live, MathSection, WorkedFormula } from '../../math/MathParts';
import type { LabProps } from '../registry';
import { PINS, pinName, useLandscape, usePlayedChord } from './roughnessState';

const text = copy.roughnessMath;
const SOURCES = copy.math.sources;

export const ROUGHNESS_SOURCES = [SOURCES.plompLevelt, SOURCES.setharesTtss];

const { b1, b2 } = ROUGHNESS_CONSTANTS;
const hz = (value: number) => formatDecimal(value, HZ_DECIMALS);
const n4 = (value: number) => formatDecimal(value, 4);
const cents = (value: number) => formatCents(value, 'controls');
const sub = (name: string, index: string) => (
  <msub>
    <mi>{name}</mi>
    <mn>{index}</mn>
  </msub>
);
const unitHz = (
  <>
    <mspace width="0.1em" />
    <mtext>Hz</mtext>
  </>
);

/** The pair curve a · (e^(−b₁·x) − e^(−b₂·x)), with a and x given as nodes. */
function pairCurve(a: ReactNode, x: ReactNode) {
  const exp = (b: number) => (
    <msup>
      <mi>e</mi>
      <mrow>
        <mo>−</mo>
        <mn>{b}</mn>
        <mo>·</mo>
        {x}
      </mrow>
    </msup>
  );
  return (
    <>
      {a}
      <mo>·</mo>
      <mo>(</mo>
      {exp(b1)}
      <mo>−</mo>
      {exp(b2)}
      <mo>)</mo>
    </>
  );
}

/** The bottom note, the roughness of two partials, the whole chord, and what roughness is not. */
export function RoughnessMath({ settings }: LabProps) {
  const { bottom, bottomHz, harmonics, landscape } = useLandscape(settings);
  const played = usePlayedChord();
  const major = PINS[0]!;
  const chord = played ?? { name: pinName(major, 'pure'), ...major.pure };
  const [f1, f2] = stackedChord(bottomHz, chord.lower, chord.upper);
  const a1 = harmonics[0] ?? 0;
  const s = roughnessScale(f1);
  const d = partialRoughness(f1, f2, a1, a1);
  const R = chordRoughness(stackedChord(bottomHz, chord.lower, chord.upper), harmonics);
  const partials = 3 * harmonics.filter((a) => a > 0).length;
  const octave = Number(bottom.slice(1));
  const semitones = semitonesFromA4({ pitchClass: 0, octave });

  return (
    <>
      <MathSection heading={text.bottom.heading}>
        <p>{text.bottom.body(bottom)}</p>
        <WorkedFormula
          general={
            <>
              <mi>f</mi>
              <mo>=</mo>
              {sub('f', 'A4')}
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
              <Live>{hz(settings.referencePitch)}</Live>
              <mo>·</mo>
              <msup>
                <mn>2</mn>
                <mrow>
                  <mn>{formatDecimal(semitones, 0)}</mn>
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
              <mn>{hz(bottomHz)}</mn>
              {unitHz}
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.pair.heading}>
        <p>{text.pair.body(formatDecimal(s, 5), hz(f2 - f1))}</p>
        <WorkedFormula
          general={
            <>
              <mi>d</mi>
              <mo>=</mo>
              {pairCurve(
                <>
                  <mi>min</mi>
                  <mo>(</mo>
                  {sub('a', '1')}
                  <mo>,</mo>
                  {sub('a', '2')}
                  <mo>)</mo>
                </>,
                <mi>x</mi>,
              )}
            </>
          }
          substituted={
            <>
              <mi>d</mi>
              <mo>=</mo>
              {pairCurve(<Live>{formatDecimal(a1, 3)}</Live>, <Live>{formatDecimal(s * (f2 - f1), 3)}</Live>)}
            </>
          }
          result={
            <>
              <mi>d</mi>
              <mo>=</mo>
              <mn>{n4(d)}</mn>
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.chord.heading}>
        <p>{text.chord.body(chord.name ?? copy.roughnessLab.pointName(cents(chord.lower), cents(chord.upper)), partials, (partials * (partials - 1)) / 2)}</p>
        <WorkedFormula
          general={
            <>
              <mi>ρ</mi>
              <mo>=</mo>
              <mfrac>
                <mi>R</mi>
                {sub('R', 'max')}
              </mfrac>
            </>
          }
          substituted={
            <>
              <mi>ρ</mi>
              <mo>=</mo>
              <mfrac>
                <Live>{n4(R)}</Live>
                <Live>{n4(landscape.max)}</Live>
              </mfrac>
            </>
          }
          result={
            <>
              <mi>ρ</mi>
              <mo>=</mo>
              <mn>{formatDecimal(Math.min(1, landscape.max > 0 ? R / landscape.max : 0), 3)}</mn>
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.ingredient.heading}>
        <p>{text.ingredient.body}</p>
      </MathSection>
    </>
  );
}

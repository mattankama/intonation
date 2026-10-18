import { Fragment } from 'react';
import { CENTS_PER_OCTAVE, approximate, edoErrorChart, edoSystem, mappedSteps, ratio } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatDecimal, formatRatio } from '../../format/numbers';
import { Live, MathSection, WorkedFormula, log2, sub, threeDecimalCents } from '../../math/MathParts';
import type { LabProps } from '../registry';
import { useExploredEdo } from './exploredEdo';

const text = copy.edoExplorerMath;
const names = copy.edoExplorer.targetNames;
const sources = copy.math.sources;

export const EDO_EXPLORER_SOURCES = [sources.mandelbaum, sources.barbour];

const FIFTH = ratio(3, 2);
const MAJOR_THIRD = ratio(5, 4);
const MINOR_THIRD = ratio(6, 5);
const CHART = edoErrorChart();

/** s with a ratio subscript: s₃/₂. */
const stepOf = (r: string) => sub('s', r);
/** e with a ratio subscript: e₃/₂. */
const errorOf = (r: string) => sub('e', r);

/**
 * The math of the explored N: the fifth's nearest step and its error, the measure the
 * error chart plots, and how chords come from the EDO mapping instead.
 */
export function EdoExplorerMath({ settings }: LabProps) {
  const { n } = useExploredEdo(settings);
  const edo = copy.settings.tuningSystem.name(edoSystem(n));
  const fifth = approximate(n, FIFTH);
  const exact = n * Math.log2(3 / 2);
  const point = CHART.find((p) => p.n === n)!;
  const chartTargets = [FIFTH, MAJOR_THIRD, MINOR_THIRD].map((r) => approximate(n, r));
  const mapped = [FIFTH, MAJOR_THIRD, MINOR_THIRD].map((r) => mappedSteps(n, r));

  return (
    <>
      <MathSection heading={text.nearest.heading}>
        <p>{text.nearest.body(edo, names['3/2']!)}</p>
        <WorkedFormula
          general={
            <>
              <mi>s</mi>
              <mo>=</mo>
              <mi>round</mi>
              <mo>(</mo>
              <mi>N</mi>
              <mo>·</mo>
              {log2}
              <mi>r</mi>
              <mo>)</mo>
            </>
          }
          substituted={
            <>
              <mi>s</mi>
              <mo>=</mo>
              <mi>round</mi>
              <mo>(</mo>
              <Live>{n}</Live>
              <mo>·</mo>
              {log2}
              <Live>{formatRatio(FIFTH)}</Live>
              <mo>)</mo>
            </>
          }
          result={
            <>
              <mi>s</mi>
              <mo>=</mo>
              <mi>round</mi>
              <mo>(</mo>
              <mn>{formatDecimal(exact, 3)}</mn>
              <mo>)</mo>
              <mo>=</mo>
              <Live>{fifth.step}</Live>
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.error.heading}>
        <p>{text.error.body}</p>
        <WorkedFormula
          general={
            <>
              <mi>e</mi>
              <mo>=</mo>
              <mn>{CENTS_PER_OCTAVE}</mn>
              <mo>·</mo>
              <mfrac>
                <mi>s</mi>
                <mi>N</mi>
              </mfrac>
              <mo>−</mo>
              <mn>{CENTS_PER_OCTAVE}</mn>
              <mo>·</mo>
              {log2}
              <mi>r</mi>
            </>
          }
          substituted={
            <>
              <mi>e</mi>
              <mo>=</mo>
              <Live>{threeDecimalCents(fifth.stepCents)}</Live>
              <mo>−</mo>
              <Live>{threeDecimalCents(fifth.pureCents)}</Live>
            </>
          }
          result={
            <>
              <mi>e</mi>
              <mo>=</mo>
              <Live>{formatCents(fifth.error, 'math')}</Live>
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.chart.heading}>
        <p>{text.chart.body(edo, names[formatRatio(point.worst.target)]!)}</p>
        <WorkedFormula
          general={
            <>
              <mi>E</mi>
              <mo>=</mo>
              <mi>max</mi>
              <mo>(</mo>
              {chartTargets.map((a, i) => (
                <Fragment key={i}>
                  {i > 0 && <mo>,</mo>}
                  <mo>|</mo>
                  {errorOf(formatRatio(a.target))}
                  <mo>|</mo>
                </Fragment>
              ))}
              <mo>)</mo>
            </>
          }
          substituted={
            <>
              <mi>E</mi>
              <mo>=</mo>
              <mi>max</mi>
              <mo>(</mo>
              {chartTargets.map((a, i) => (
                <Fragment key={i}>
                  {i > 0 && <mo>,</mo>}
                  <Live>{threeDecimalCents(Math.abs(a.error))}</Live>
                </Fragment>
              ))}
              <mo>)</mo>
            </>
          }
          result={
            <>
              <mi>E</mi>
              <mo>=</mo>
              <Live>{formatCents(Math.abs(point.worst.error), 'math')}</Live>
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.mapping.heading}>
        <p>{text.mapping.body(edo)}</p>
        <WorkedFormula
          general={
            <>
              {stepOf('6/5')}
              <mo>=</mo>
              {stepOf('3/2')}
              <mo>−</mo>
              {stepOf('5/4')}
            </>
          }
          substituted={
            <>
              {stepOf('6/5')}
              <mo>=</mo>
              <Live>{mapped[0]}</Live>
              <mo>−</mo>
              <Live>{mapped[1]}</Live>
            </>
          }
          result={
            <>
              {stepOf('6/5')}
              <mo>=</mo>
              <Live>{mapped[2]}</Live>
            </>
          }
        />
      </MathSection>
    </>
  );
}

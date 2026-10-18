import { cents, noteName, tuningTable } from '../../core';
import { copy } from '../../copy/en';
import { formatRatio } from '../../format/numbers';
import { Live, MathSection, WorkedFormula, log2, sub, threeDecimalCents, unit } from '../../math/MathParts';
import type { LabProps } from '../registry';
import { intervalOf } from './spiral';
import { useComparedSystems, usePicks } from './state';

const text = copy.tuningSystemsMath;
const SOURCES = copy.math.sources;

export const TUNING_SYSTEMS_SOURCES = [SOURCES.barbour, SOURCES.scala, SOURCES.fiveLimit];


/** The picked note's cents and ratio, the interval against pure, and the spiral's angle. */
export function TuningSystemsMath({ settings }: LabProps) {
  const [systems] = useComparedSystems();
  const [picks] = usePicks(systems, settings);
  const last = picks[picks.length - 1];
  const systemChoice = last ? { system: last.system, tonic: settings.tonic } : null;
  const row = last && systemChoice ? tuningTable(systemChoice).find((r) => r.note.pitchClass === last.note.pitchClass) : undefined;
  const name = last && systemChoice ? noteName(systemChoice, last.note) : '';
  const interval = picks.length === 2 ? intervalOf(picks[0]!, picks[1]!) : null;

  return (
    <>
      {row && (
        <MathSection heading={text.fromEdo12.heading}>
          <p>{text.fromEdo12.body(name)}</p>
          <WorkedFormula
            general={
              <>
                <mi>d</mi>
                <mo>=</mo>
                <mi>c</mi>
                <mo>−</mo>
                <mn>100</mn>
                <mo>·</mo>
                <mi>k</mi>
              </>
            }
            substituted={
              <>
                <mi>d</mi>
                <mo>=</mo>
                <Live>{threeDecimalCents(row.cents)}</Live>
                <mo>−</mo>
                <mn>100</mn>
                <mo>·</mo>
                <Live>{Math.round(row.cents / 100)}</Live>
              </>
            }
            result={
              <>
                <mi>d</mi>
                <mo>=</mo>
                <mn>{threeDecimalCents(row.centsFromEdo12)}</mn>
                {unit('¢')}
              </>
            }
          />
        </MathSection>
      )}
      {row?.ratio && (
        <MathSection heading={text.ratio.heading}>
          <p>{text.ratio.body(name)}</p>
          <WorkedFormula
            general={
              <>
                <mi>c</mi>
                <mo>=</mo>
                <mn>1200</mn>
                <mo>·</mo>
                {log2}
                <mi>r</mi>
              </>
            }
            substituted={
              <>
                <mi>c</mi>
                <mo>=</mo>
                <mn>1200</mn>
                <mo>·</mo>
                {log2}
                <mo>(</mo>
                <Live>{formatRatio(row.ratio)}</Live>
                <mo>)</mo>
              </>
            }
            result={
              <>
                <mi>c</mi>
                <mo>=</mo>
                <mn>{threeDecimalCents(cents(row.ratio))}</mn>
                {unit('¢')}
              </>
            }
          />
        </MathSection>
      )}
      {interval && (
        <MathSection heading={text.interval.heading}>
          <p>{text.interval.body}</p>
          <WorkedFormula
            general={
              <>
                <mi>Δ</mi>
                <mo>=</mo>
                <mo>(</mo>
                {sub('c', '2')}
                <mo>−</mo>
                {sub('c', '1')}
                <mo>)</mo>
                <mo>−</mo>
                <mn>1200</mn>
                <mo>·</mo>
                {log2}
                <mi>r</mi>
              </>
            }
            substituted={
              <>
                <mi>Δ</mi>
                <mo>=</mo>
                <mo>(</mo>
                <Live>{threeDecimalCents(interval.high.cents)}</Live>
                <mo>−</mo>
                <Live>{threeDecimalCents(interval.low.cents)}</Live>
                <mo>)</mo>
                <mo>−</mo>
                <mn>1200</mn>
                <mo>·</mo>
                {log2}
                <mo>(</mo>
                <Live>{formatRatio(interval.pure)}</Live>
                <mo>)</mo>
              </>
            }
            result={
              <>
                <mi>Δ</mi>
                <mo>=</mo>
                <mn>{threeDecimalCents(interval.offPure)}</mn>
                {unit('¢')}
              </>
            }
          />
        </MathSection>
      )}
      <MathSection heading={text.spiral.heading}>
        <p>{text.spiral.body}</p>
        {row ? (
          <WorkedFormula
            general={
              <>
                <mi>θ</mi>
                <mo>=</mo>
                <mn>360°</mn>
                <mo>·</mo>
                <mfrac>
                  <mi>c</mi>
                  <mn>1200</mn>
                </mfrac>
              </>
            }
            substituted={
              <>
                <mi>θ</mi>
                <mo>=</mo>
                <mn>360°</mn>
                <mo>·</mo>
                <mfrac>
                  <Live>{threeDecimalCents(row.cents)}</Live>
                  <mn>1200</mn>
                </mfrac>
              </>
            }
            result={
              <>
                <mi>θ</mi>
                <mo>=</mo>
                <mn>{threeDecimalCents((360 * row.cents) / 1200)}°</mn>
              </>
            }
          />
        ) : (
          <p className="placeholder-text">{text.spiral.empty}</p>
        )}
      </MathSection>
    </>
  );
}

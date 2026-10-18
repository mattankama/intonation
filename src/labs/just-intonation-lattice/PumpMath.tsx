import {
  CHORD_INTERVALS,
  type PrimeFactors,
  commaPumpComma,
  commaPumpDrift,
  factorsCents,
  latticeNoteName,
  nodeOfFactors,
  octaveReduceFactors,
} from '../../core';
import { copy } from '../../copy/en';
import { formatPitchRatio, formatRatio } from '../../format/numbers';
import { Live, MathSection, WorkedFormula, log2, threeDecimalCents, unit, wholeNumber } from '../../math/MathParts';
import type { LabProps } from '../registry';
import { FactorsFormula } from './FactorsFormula';
import type { PumpState } from './pumpState';
import { loopSymbols, pitchLabel, stepSymbol } from './labels';
import { usePumpPicture } from './pumpPicture';

const text = copy.latticeMath;
const pumpText = text.pump;

/** A pitch's ratio as the lattice shows it: octave-reduced, exact. */
const reduced = (pitch: PrimeFactors) => formatPitchRatio(octaveReduceFactors(pitch));

/**
 * The comma explorer's math (issue #31): how the current chord is placed (the note it
 * keeps), its root's prime factors, the comma one loop makes and the drift so far.
 */
export function PumpMath({ settings, pump }: LabProps & { pump: PumpState }) {
  const picture = usePumpPicture(pump);
  if (!picture) return null;
  const { current, id } = picture;
  const tonic = settings.tonic;
  const symbol = stepSymbol(tonic, current);
  const comma = commaPumpComma(id);
  const commaCents = factorsCents(comma);
  const root = octaveReduceFactors(current.root);
  const rootLabel = pitchLabel(tonic, current.root);

  return (
    <>
      {current.held ? (
        <MathSection heading={pumpText.held.heading(pitchLabel(tonic, current.held.pitch))}>
          <p>
            {pumpText.held.body(
              symbol,
              pitchLabel(tonic, current.held.pitch),
              copy.chords.intervals[current.held.interval],
            )}
          </p>
          <WorkedFormula
            general={
              <>
                <mi>r</mi>
                <mo>=</mo>
                <mi>h</mi>
                <mo>÷</mo>
                <mi>i</mi>
              </>
            }
            substituted={
              <>
                <mi>r</mi>
                <mo>=</mo>
                <Live>{reduced(current.held.pitch)}</Live>
                <mo>÷</mo>
                <Live>{formatRatio(CHORD_INTERVALS[current.held.interval].ratio)}</Live>
              </>
            }
            result={
              <>
                <mi>r</mi>
                <mo>=</mo>
                <mn>{reduced(current.root)}</mn>
              </>
            }
          />
        </MathSection>
      ) : (
        <MathSection heading={pumpText.start.heading}>
          <p>{pumpText.start.body(symbol, current.notes.map((n) => pitchLabel(tonic, n.pitch)).join(', '))}</p>
        </MathSection>
      )}
      <MathSection heading={text.factors.heading(reduced(current.root))}>
        <p>{text.factors.body(rootLabel)}</p>
        <FactorsFormula ratio={reduced(current.root)} factors={root} />
      </MathSection>
      <MathSection heading={pumpText.comma.heading}>
        <p>
          {pumpText.comma.body(
            loopSymbols(tonic, id),
            latticeNoteName(tonic, nodeOfFactors(comma)),
            formatPitchRatio(comma),
          )}
        </p>
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
              <Live>{formatPitchRatio(comma)}</Live>
              <mo>)</mo>
            </>
          }
          result={
            <>
              <mi>c</mi>
              <mo>=</mo>
              <mn>{threeDecimalCents(commaCents)}</mn>
              {unit('¢')}
            </>
          }
        />
      </MathSection>
      {current.loop > 0 && (
        <MathSection heading={pumpText.drift.heading}>
          <p>{pumpText.drift.body}</p>
          <WorkedFormula
            general={
              <>
                <mi>Δ</mi>
                <mo>=</mo>
                <mi>k</mi>
                <mo>·</mo>
                <mi>c</mi>
              </>
            }
            substituted={
              <>
                <mi>Δ</mi>
                <mo>=</mo>
                <Live>{wholeNumber(current.loop)}</Live>
                <mo>·</mo>
                <mo>(</mo>
                <mn>{threeDecimalCents(commaCents)}</mn>
                {unit('¢')}
                <mo>)</mo>
              </>
            }
            result={
              <>
                <mi>Δ</mi>
                <mo>=</mo>
                <mn>{threeDecimalCents(factorsCents(commaPumpDrift(id, current.loop)))}</mn>
                {unit('¢')}
              </>
            }
          />
        </MathSection>
      )}
      <MathSection heading={pumpText.why.heading}>
        <p>{pumpText.why.body}</p>
      </MathSection>
    </>
  );
}

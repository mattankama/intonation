import { Fragment } from 'react';
import { cents, primeFactors, ratioValue, tonicSpelling } from '../../core';
import { copy } from '../../copy/en';
import { formatHz, formatRatio } from '../../format/numbers';
import { Live, MathSection, WorkedFormula, log2, sub, threeDecimalCents, unit } from '../../math/MathParts';
import type { LabProps } from '../registry';
import { FactorsFormula } from './FactorsFormula';
import { PumpMath } from './PumpMath';
import { chordNote, chordNotes, proportionText } from './labels';
import { tonicFrequency } from './sound';
import { useLattice, usePump } from './urlState';

const text = copy.latticeMath;
const SOURCES = copy.math.sources;

export const LATTICE_SOURCES = [SOURCES.euler, SOURCES.longuetHiggins];

/**
 * The last note added to the chord: its prime factors (its place on the lattice), its cents
 * and its frequency; then the chord as whole numbers and why the lattice is built this way.
 */
export function LatticeMath(props: LabProps) {
  const [pump] = usePump();
  return pump ? <PumpMath settings={props.settings} pump={pump} /> : <ChordMath {...props} />;
}

function ChordMath({ settings }: LabProps) {
  const [{ chord }] = useLattice();
  const last = chord[chord.length - 1];
  const note = last ? chordNote(last, settings.tonic) : null;
  const factors = note ? primeFactors(note.ratio) : null;
  const notes = chordNotes(chord, settings.tonic);
  const proportion = proportionText(notes);
  const fTonic = tonicFrequency(settings);

  return (
    <>
      {note && factors ? (
        <MathSection heading={text.factors.heading(formatRatio(note.ratio))}>
          <p>{text.factors.body(note.label)}</p>
          <FactorsFormula ratio={formatRatio(note.ratio)} factors={factors} />
        </MathSection>
      ) : (
        <MathSection heading={text.factors.emptyHeading}>
          <p className="placeholder-text">{text.empty}</p>
        </MathSection>
      )}
      {note && (
        <MathSection heading={text.cents.heading}>
          <p>{text.cents.body(note.label)}</p>
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
                <Live>{formatRatio(note.ratio)}</Live>
                <mo>)</mo>
              </>
            }
            result={
              <>
                <mi>c</mi>
                <mo>=</mo>
                <mn>{threeDecimalCents(cents(note.ratio))}</mn>
                {unit('¢')}
              </>
            }
          />
        </MathSection>
      )}
      {note && (
        <MathSection heading={text.frequency.heading}>
          <p>{text.frequency.body(tonicSpelling(settings.tonic))}</p>
          <WorkedFormula
            general={
              <>
                <mi>f</mi>
                <mo>=</mo>
                {sub('f', 'T')}
                <mo>·</mo>
                <mi>r</mi>
              </>
            }
            substituted={
              <>
                <mi>f</mi>
                <mo>=</mo>
                <Live>{formatHz(fTonic)}</Live>
                <mo>·</mo>
                <Live>{formatRatio(note.ratio)}</Live>
              </>
            }
            result={
              <>
                <mi>f</mi>
                <mo>=</mo>
                <mn>{formatHz(fTonic * ratioValue(note.ratio))}</mn>
              </>
            }
          />
        </MathSection>
      )}
      {proportion && (
        <MathSection heading={text.chord.heading}>
          <p>{text.chord.body}</p>
          <WorkedFormula
            general={
              <>
                {sub('r', '1')}
                <mo>:</mo>
                {sub('r', '2')}
                <mo>:</mo>
                <mo>…</mo>
              </>
            }
            substituted={
              <>
                {notes.map((n, i) => (
                  <Fragment key={n.label}>
                    {i > 0 && <mo>:</mo>}
                    <Live>{formatRatio(n.ratio)}</Live>
                  </Fragment>
                ))}
              </>
            }
            result={<mn>{proportion}</mn>}
          />
        </MathSection>
      )}
      <MathSection heading={text.lattice.heading}>
        <p>{text.lattice.body}</p>
      </MathSection>
    </>
  );
}

import { Fragment, type ReactNode } from 'react';
import { cents, primeFactors, ratioValue, tonicSpelling } from '../../core';
import { copy } from '../../copy/en';
import { formatDecimal, formatHz, formatRatio } from '../../format/numbers';
import { Live, MathSection, WorkedFormula } from '../../math/MathParts';
import type { LabProps } from '../registry';
import { chordNote, chordNotes, proportionText, tonicFrequency, useLattice } from './state';

const text = copy.latticeMath;
const SOURCES = copy.math.sources;

export const LATTICE_SOURCES = [SOURCES.euler, SOURCES.longuetHiggins];

const c3 = (value: number) => formatDecimal(value, 3);
const whole = (value: number) => formatDecimal(value, 0);
const unit = (symbol: string) => (
  <>
    <mspace width="0.1em" />
    <mtext>{symbol}</mtext>
  </>
);
const log2 = (
  <msub>
    <mi>log</mi>
    <mn>2</mn>
  </msub>
);
const power = (base: string, exponent: ReactNode) => (
  <msup>
    <mn>{base}</mn>
    {exponent}
  </msup>
);
const sub = (name: string, index: string) => (
  <msub>
    <mi>{name}</mi>
    <mi>{index}</mi>
  </msub>
);
/** "(a, b, c)" as a MathML row of identifiers or numbers. */
const triple = (items: readonly ReactNode[]) => (
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

/**
 * The last note added to the chord: its prime factors (its place on the lattice), its cents
 * and its frequency; then the chord as whole numbers and why the lattice is built this way.
 */
export function LatticeMath({ settings }: LabProps) {
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
                <Live>{formatRatio(note.ratio)}</Live>
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
                <mn>{c3(cents(note.ratio))}</mn>
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

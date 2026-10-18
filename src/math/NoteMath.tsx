import type { ReactNode } from 'react';
import {
  type KeyConstruction,
  type Note,
  type TuningSystemChoice,
  cents,
  centsAboveTonic,
  commaRatio,
  edo12Frequency,
  edo12NoteName,
  edoLandmarks,
  edoStepsFromA4,
  isEdo,
  keyConstruction,
  keySpelling,
  noteName,
  resolvePitch,
  semitonesFromA4,
  stepEdo,
  tonicSpelling,
} from '../core';
import { copy } from '../copy/en';
import { HZ_DECIMALS, formatDecimal, formatRatio } from '../format/numbers';
import { Live, MathSection, WorkedFormula } from './MathParts';

const SOURCES = copy.math.sources;

/** Sources for the note section, by tuning system. */
export function noteMathSources(systemChoice: TuningSystemChoice): readonly string[] {
  if (isEdo(systemChoice.system)) return [SOURCES.iso16, SOURCES.barbour];
  switch (systemChoice.system) {
    case 'pythagorean':
      return [SOURCES.barbour, SOURCES.scala];
    case 'meantone':
      return [SOURCES.aron, SOURCES.barbour, SOURCES.scala];
    case 'werckmeister-iii':
      return [SOURCES.werckmeister, SOURCES.barbour, SOURCES.scala];
    case 'vallotti':
      return [SOURCES.vallotti, SOURCES.scala];
    case 'kirnberger-iii':
      return [SOURCES.kirnberger, SOURCES.scala];
    case 'just':
      return [SOURCES.fiveLimit, SOURCES.barbour];
  }
}

const CENTS_DECIMALS = 3;
const centsText = (value: number) => formatDecimal(value, CENTS_DECIMALS);
const centsUnit = (
  <>
    <mspace width="0.1em" />
    <mtext>¢</mtext>
  </>
);

const fA4 = (
  <msub>
    <mi>f</mi>
    <mtext>A4</mtext>
  </msub>
);
const rP = (
  <msub>
    <mi>r</mi>
    <mtext>P</mtext>
  </msub>
);
const cP = (
  <msub>
    <mi>c</mi>
    <mtext>P</mtext>
  </msub>
);

/** The note just played: how its key is built, then its frequency from the Reference pitch. */
export function NoteMath({
  note,
  systemChoice,
  referencePitch,
}: {
  note: Note;
  systemChoice: TuningSystemChoice;
  referencePitch: number;
}) {
  const construction = keyConstruction(systemChoice, note.pitchClass);
  const n = stepEdo(systemChoice.system);
  return (
    <>
      {n !== null ? (
        <>
          <EdoStepSection n={n} note={note} systemChoice={systemChoice} />
          <EdoFrequencySection n={n} note={note} systemChoice={systemChoice} referencePitch={referencePitch} />
        </>
      ) : construction ? (
        <>
          <ConstructionSection construction={construction} systemChoice={systemChoice} />
          <FrequencySection note={note} systemChoice={systemChoice} referencePitch={referencePitch} />
        </>
      ) : (
        <Edo12Section note={note} referencePitch={referencePitch} />
      )}
      {systemChoice.system === 'vallotti' && (
        <MathSection heading={copy.math.vallotti.heading}>
          <p>{copy.math.vallotti.body}</p>
        </MathSection>
      )}
      <MathSection heading={copy.math.referencePitch.heading}>
        <p>{copy.math.referencePitch.body}</p>
      </MathSection>
    </>
  );
}

/** How a key of a 12-note system is built: an exact ratio, or a fraction of a comma. */
function ConstructionSection({
  construction,
  systemChoice,
}: {
  construction: KeyConstruction;
  systemChoice: TuningSystemChoice;
}) {
  const text = copy.math.key;
  const { spelling, fifths, pythagorean, comma, commaFraction, ratio } = construction;
  const commaName = copy.math.commas[comma];
  const route = text.fifths(spelling, fifths, tonicSpelling(systemChoice.tonic));
  const centsResult = (
    <>
      <mi>c</mi>
      <mo>=</mo>
      <Live>{centsText(construction.cents)}</Live>
      {centsUnit}
    </>
  );
  const log2 = (
    <msub>
      <mi>log</mi>
      <mn>2</mn>
    </msub>
  );

  // Only pure fifths on the way: the key is its Pythagorean ratio.
  if (commaFraction.num === 0) {
    return (
      <MathSection heading={text.heading(spelling)}>
        <p>
          {fifths === 0
            ? text.tonic(spelling, copy.settings.tuningSystem.name(systemChoice.system))
            : `${route} ${text.pure}`}
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
              <Live>{formatRatio(pythagorean)}</Live>
              <mo>)</mo>
            </>
          }
          result={centsResult}
        />
      </MathSection>
    );
  }

  // A whole number of commas: still an exact ratio, now a 5-limit one.
  if (ratio) {
    const n = commaFraction.num;
    return (
      <MathSection heading={text.heading(spelling)}>
        <p>
          {route} {text.wholeCommas(n, commaName)}
        </p>
        <WorkedFormula
          general={
            <>
              <mi>r</mi>
              <mo>=</mo>
              {rP}
              <mo>·</mo>
              <msup>
                <mi>κ</mi>
                <mrow>
                  <mo>−</mo>
                  <mi>n</mi>
                </mrow>
              </msup>
            </>
          }
          substituted={
            <>
              <mi>r</mi>
              <mo>=</mo>
              <Live>{formatRatio(pythagorean)}</Live>
              <mo>·</mo>
              <msup>
                <mrow>
                  <mo>(</mo>
                  <mn>{formatRatio(commaRatio(comma))}</mn>
                  <mo>)</mo>
                </mrow>
                <Live>{formatDecimal(-n, 0)}</Live>
              </msup>
            </>
          }
          result={
            <>
              <mi>r</mi>
              <mo>=</mo>
              <Live>{formatRatio(ratio)}</Live>
              <mo>→</mo>
              {centsResult}
            </>
          }
        />
      </MathSection>
    );
  }

  // A fraction of a comma: no ratio, the Pythagorean cents moved by f·κ.
  const raised = commaFraction.num < 0;
  const f = { num: Math.abs(commaFraction.num), den: commaFraction.den };
  const sign = <mo>{raised ? '+' : '−'}</mo>;
  return (
    <MathSection heading={text.heading(spelling)}>
      <p>
        {route} {text.fraction(raised ? 'higher' : 'lower', commaName)}
      </p>
      <WorkedFormula
        general={
          <>
            <mi>c</mi>
            <mo>=</mo>
            {cP}
            {sign}
            <mi>f</mi>
            <mo>·</mo>
            <mi>κ</mi>
          </>
        }
        substituted={
          <>
            <mi>c</mi>
            <mo>=</mo>
            <Live>{centsText(cents(pythagorean))}</Live>
            {sign}
            <Live>{formatRatio(f)}</Live>
            <mo>·</mo>
            <Live>{centsText(cents(commaRatio(comma)))}</Live>
          </>
        }
        result={centsResult}
      />
    </MathSection>
  );
}

/** A key's frequency from the Reference pitch: f = f_A4 · 2^(c/1200). */
function FrequencySection({
  note,
  systemChoice,
  referencePitch,
}: {
  note: Note;
  systemChoice: TuningSystemChoice;
  referencePitch: number;
}) {
  const { frequency, centsFromA4 } = resolvePitch(systemChoice, note, referencePitch);
  const exponent = (c: ReactNode) => (
    <msup>
      <mn>2</mn>
      <mrow>
        {c}
        <mo>/</mo>
        <mn>1200</mn>
      </mrow>
    </msup>
  );
  return (
    <MathSection heading={copy.math.frequency.heading}>
      <p>{copy.math.frequency.body(noteName(systemChoice, note))}</p>
      <WorkedFormula
        general={
          <>
            <mi>f</mi>
            <mo>=</mo>
            {fA4}
            <mo>·</mo>
            {exponent(<mi>c</mi>)}
          </>
        }
        substituted={
          <>
            <mi>f</mi>
            <mo>=</mo>
            <Live>{formatDecimal(referencePitch, HZ_DECIMALS)}</Live>
            <mo>·</mo>
            {exponent(<Live>{centsText(centsFromA4)}</Live>)}
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
    </MathSection>
  );
}

/** The 12-EDO frequency of the note just played, worked from the Reference pitch. */
function Edo12Section({ note, referencePitch }: { note: Note; referencePitch: number }) {
  const name = edo12NoteName(note);
  const n = semitonesFromA4(note);
  const frequency = edo12Frequency(note, referencePitch);
  return (
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
  );
}

/** Where an N-EDO step sits in the octave: c = 1200 · s / N cents above step 0. */
function EdoStepSection({ n, note, systemChoice }: { n: number; note: Note; systemChoice: TuningSystemChoice }) {
  const step = note.pitchClass;
  const fraction = (s: ReactNode, divisions: ReactNode) => (
    <>
      <mi>c</mi>
      <mo>=</mo>
      <mn>1200</mn>
      <mo>·</mo>
      <mfrac>
        {s}
        {divisions}
      </mfrac>
    </>
  );
  return (
    <MathSection heading={copy.math.note.heading}>
      <p>{copy.math.edoStep.body(keySpelling(systemChoice, step), n)}</p>
      <WorkedFormula
        general={fraction(<mi>s</mi>, <mi>N</mi>)}
        substituted={fraction(<Live>{formatDecimal(step, 0)}</Live>, <Live>{formatDecimal(n, 0)}</Live>)}
        result={
          <>
            <mi>c</mi>
            <mo>=</mo>
            <Live>{centsText(centsAboveTonic(systemChoice, step))}</Live>
            {centsUnit}
          </>
        }
      />
    </MathSection>
  );
}

/** An N-EDO note's frequency: k steps from A4, each a factor of 2^(1/N). */
function EdoFrequencySection({
  n,
  note,
  systemChoice,
  referencePitch,
}: {
  n: number;
  note: Note;
  systemChoice: TuningSystemChoice;
  referencePitch: number;
}) {
  const k = edoStepsFromA4(n, note);
  const { frequency } = resolvePitch(systemChoice, note, referencePitch);
  const power = (steps: ReactNode, divisions: ReactNode) => (
    <msup>
      <mn>2</mn>
      <mrow>
        {steps}
        <mo>/</mo>
        {divisions}
      </mrow>
    </msup>
  );
  const stepOfA = keySpelling(systemChoice, edoLandmarks(n)[9]!);
  return (
    <MathSection heading={copy.math.frequency.heading}>
      <p>{copy.math.edoFrequency.body(n, stepOfA)}</p>
      <WorkedFormula
        general={
          <>
            <mi>f</mi>
            <mo>=</mo>
            {fA4}
            <mo>·</mo>
            {power(<mi>k</mi>, <mi>N</mi>)}
          </>
        }
        substituted={
          <>
            <mi>f</mi>
            <mo>=</mo>
            <Live>{formatDecimal(referencePitch, HZ_DECIMALS)}</Live>
            <mo>·</mo>
            {power(<Live>{formatDecimal(k, 0)}</Live>, <Live>{formatDecimal(n, 0)}</Live>)}
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
      <p>{copy.math.edoFrequency.steps(noteName(systemChoice, note), k)}</p>
    </MathSection>
  );
}

import {
  CENTS_PER_OCTAVE,
  cents,
  chordTones,
  isEdo,
  mappedSteps,
  pureChord,
  ratio as exactRatio,
  stepEdo,
} from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatDecimal, formatRatio } from '../../format/numbers';
import { Live, MathSection, WorkedFormula, log2, sub, twoDecimalHz, unit } from '../../math/MathParts';
import type { LabProps } from '../registry';
import { columnHeading } from './ChordComparisonVisual';
import { chordColumns, useChordComparison } from './useChordComparison';

const text = copy.chordComparisonMath;
const sources = copy.math.sources;

export const CHORD_COMPARISON_SOURCES = [
  sources.plompLevelt,
  sources.helmholtz,
  sources.sethares,
  sources.barbour,
];

const FIFTH = exactRatio(3, 2);

/**
 * The math of the first column: its pure target, its note furthest from pure, its
 * strongest beat, and how an N-EDO or a 12-note system decides its notes.
 */
export function ChordComparisonMath({ settings }: LabProps) {
  const [state] = useChordComparison();
  const columns = chordColumns(state, settings);
  const first = columns.systems[0];
  if (!first) return null;
  const system = columnHeading(first);
  const tones = chordTones(state.chord);
  const roles = tones.map((tone) => copy.chords.roles[tone.interval]);
  const notes = first.tuned.notes;
  const rootIndex = tones.findIndex((t) => t.interval === 'unison');
  const root = notes[rootIndex]!;
  // The note furthest from pure (the first non-root note if every note is pure).
  const others = notes.map((note, i) => ({ note, i })).filter(({ i }) => i !== rootIndex);
  const furthest = others.reduce((a, b) =>
    Math.abs(b.note.centsOffPure) > Math.abs(a.note.centsOffPure) ? b : a,
  );
  const ratio = tones[furthest.i]!.ratio;
  // The strongest beat involving that note, else the strongest of any pair.
  const ranked = first.beats
    .flatMap((pair) => pair.beats.map((beat) => ({ pair, beat })))
    .sort((a, b) => b.beat.weight - a.beat.weight);
  const strongest =
    ranked.find(({ pair }) => pair.lower === furthest.i || pair.upper === furthest.i) ?? ranked[0];
  const edo = columns.systems.map((c) => stepEdo(c.system)).find((n) => n !== null);
  const hasChain = columns.systems.some((c) => !isEdo(c.system));
  const chordName = copy.chords.name(copy.chords.roots[state.chord.root]!, state.chord.type);

  return (
    <>
      <MathSection heading={text.pure.heading}>
        <p>{text.pure.body(chordName, pureChord(state.chord).proportion.join(':'), system)}</p>
        <WorkedFormula
          general={
            <>
              {sub('f', 'pure')}
              <mo>=</mo>
              {sub('f', 'root')}
              <mo>×</mo>
              <mi>r</mi>
            </>
          }
          substituted={
            <>
              {sub('f', 'pure')}
              <mo>=</mo>
              <Live>{twoDecimalHz(root.frequency)}</Live>
              <mo>×</mo>
              <Live>{formatRatio(ratio)}</Live>
            </>
          }
          result={
            <>
              {sub('f', 'pure')}
              <mo>=</mo>
              <Live>{twoDecimalHz(furthest.note.pureFrequency)}</Live>
              {unit('Hz')}
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.centsOff.heading}>
        <p>{text.centsOff.body(furthest.note.name, system)}</p>
        <WorkedFormula
          general={
            <>
              <mi>c</mi>
              <mo>=</mo>
              <mn>1200</mn>
              <mo>·</mo>
              {log2}
              <mfrac>
                <mi>f</mi>
                {sub('f', 'pure')}
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
                <Live>{twoDecimalHz(furthest.note.frequency)}</Live>
                <Live>{twoDecimalHz(furthest.note.pureFrequency)}</Live>
              </mfrac>
            </>
          }
          result={
            <>
              <mi>c</mi>
              <mo>=</mo>
              <Live>{formatCents(furthest.note.centsOffPure, 'math')}</Live>
            </>
          }
        />
      </MathSection>

      <MathSection heading={text.beats.heading}>
        {strongest ? (
          <>
            <p>
              {text.beats.body(
                copy.chordComparison.pair(roles[strongest.pair.lower]!, roles[strongest.pair.upper]!),
                system,
                ...strongest.beat.harmonics,
              )}
            </p>
            <WorkedFormula
              general={
                <>
                  <mi>Δ</mi>
                  <mi>f</mi>
                  <mo>=</mo>
                  <mo>|</mo>
                  <mi>i</mi>
                  <mo>·</mo>
                  {sub('f', 'A')}
                  <mo>−</mo>
                  <mi>j</mi>
                  <mo>·</mo>
                  {sub('f', 'B')}
                  <mo>|</mo>
                </>
              }
              substituted={
                <>
                  <mi>Δ</mi>
                  <mi>f</mi>
                  <mo>=</mo>
                  <mo>|</mo>
                  <Live>{strongest.beat.harmonics[0]}</Live>
                  <mo>·</mo>
                  <Live>{twoDecimalHz(notes[strongest.pair.lower]!.frequency)}</Live>
                  <mo>−</mo>
                  <Live>{strongest.beat.harmonics[1]}</Live>
                  <mo>·</mo>
                  <Live>{twoDecimalHz(notes[strongest.pair.upper]!.frequency)}</Live>
                  <mo>|</mo>
                </>
              }
              result={
                <>
                  <mi>Δ</mi>
                  <mi>f</mi>
                  <mo>=</mo>
                  <Live>{twoDecimalHz(strongest.beat.rate)}</Live>
                  {unit('Hz')}
                </>
              }
            />
          </>
        ) : (
          <p>{text.beats.none(system)}</p>
        )}
      </MathSection>

      {edo !== undefined && edo !== null && (
        <MathSection heading={text.mapping.heading}>
          <p>{text.mapping.body(edo)}</p>
          <WorkedFormula
            general={
              <>
                {sub('s', 'fifth')}
                <mo>=</mo>
                <mi>round</mi>
                <mo>(</mo>
                <mi>N</mi>
                <mo>·</mo>
                {log2}
                <mfrac>
                  <mn>3</mn>
                  <mn>2</mn>
                </mfrac>
                <mo>)</mo>
              </>
            }
            substituted={
              <>
                {sub('s', 'fifth')}
                <mo>=</mo>
                <mi>round</mi>
                <mo>(</mo>
                <Live>{edo}</Live>
                <mo>×</mo>
                <mn>{formatDecimal(cents(FIFTH) / CENTS_PER_OCTAVE, 5)}</mn>
                <mo>)</mo>
              </>
            }
            result={
              <>
                {sub('s', 'fifth')}
                <mo>=</mo>
                <Live>{mappedSteps(edo, FIFTH)}</Live>
                {unit('steps')}
              </>
            }
          />
        </MathSection>
      )}

      {hasChain && (
        <MathSection heading={text.tonic.heading}>
          <p>{text.tonic.body}</p>
        </MathSection>
      )}
    </>
  );
}

import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';
import { CHORD_SECONDS, playChord, stopChord } from '../../audio/chords';
import {
  type ChordRemark,
  type NotePairBeats,
  type TunedNote,
  chordTones,
  isCustomTimbre,
  isEdo,
  pureChord,
  stepEdo,
  tonicSpelling,
} from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatDecimal, formatHz, formatRatio } from '../../format/numbers';
import type { LabProps } from '../registry';
import { type SystemColumn, chordColumns, useChordComparison } from './useChordComparison';

const text = copy.chordComparison;
/** Play all in turn: one chord every this many seconds. */
const TURN_SECONDS = CHORD_SECONDS + 0.4;
/** Beats slower than this read better as a swell with its period. */
const SWELL_BELOW_HZ = 0.5;
/** The cents bar spans ±this many cents. */
const BAR_CENTS = 50;

/** "+13.7¢", "−2.0¢", "0.0¢". */
export function signedCents(value: number): string {
  const shown = formatCents(value, 'controls');
  return value > 0 && Number(formatDecimal(value, 1)) !== 0 ? `+${shown}` : shown;
}

/** A beat rate in Hz, or a slow swell's period. */
function beatRate(rate: number): string {
  return rate < SWELL_BELOW_HZ ? text.swell(formatDecimal(1 / rate, 1)) : formatHz(rate);
}

/** A note's name in a column: "G♯4", or just "step 10" in an N-EDO (the full name is its title). */
function shortName(column: SystemColumn, note: TunedNote): string {
  return stepEdo(column.system) === null ? note.name : text.step(note.note.pitchClass);
}

/** A column's heading: the tuning system, with its Tonic for a 12-note system. */
export function columnHeading(column: SystemColumn): string {
  const name = copy.settings.tuningSystem.name(column.system);
  return text.systemHeading(name, isEdo(column.system) ? null : tonicSpelling(column.tuning.tonic));
}

export function remarkText(remark: ChordRemark): string {
  const names = copy.chords.intervals;
  switch (remark.kind) {
    case 'borrowed':
      return text.remarks.borrowed(remark.key, remark.as);
    case 'mapping':
      return text.remarks.mapping(
        remark.edo,
        names[remark.interval],
        remark.nearest,
        remark.builtFrom.map((i) => names[i]),
      );
    case 'no-step':
      return text.remarks.noStep(remark.edo, names[remark.interval], remark.mapsTo);
  }
}

/** Plays one column, or every column in turn, and says which is sounding. */
function useChordPlayback() {
  const [playing, setPlaying] = useState<number | null>(null);
  const [inTurn, setInTurn] = useState(false);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (seconds: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, seconds * 1000));
  };
  const finish = () => {
    setPlaying(null);
    setInTurn(false);
  };
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      stopChord();
    },
    [],
  );
  return {
    playing,
    inTurn,
    play(index: number, frequencies: readonly number[]) {
      clear();
      playChord(frequencies);
      setPlaying(index);
      setInTurn(false);
      later(CHORD_SECONDS, finish);
    },
    /** The first chord starts at once, inside the click, so audio may start. */
    playAll(columns: readonly (readonly number[])[]) {
      clear();
      setInTurn(true);
      columns.forEach((frequencies, index) => {
        const start = () => {
          playChord(frequencies);
          setPlaying(index);
        };
        if (index === 0) start();
        else later(index * TURN_SECONDS, start);
      });
      later((columns.length - 1) * TURN_SECONDS + CHORD_SECONDS, finish);
    },
    stop() {
      clear();
      stopChord();
      finish();
    },
  };
}

/** Each pair of notes and its strongest beats (or none). */
function Beats({ pairs, roles }: { pairs: readonly NotePairBeats[]; roles: readonly string[] }) {
  return (
    <div className="cc-beats">
      <h3 className="cc-beats-heading">{text.beatsHeading}</h3>
      <ul>
        {pairs.map(({ lower, upper, beats }) => (
          <li key={`${lower}-${upper}`} className="cc-beat" data-beats={beats.length}>
            <span className="cc-beat-pair">{text.pair(roles[lower]!, roles[upper]!)}</span>
            <span className="cc-beat-rates">
              {beats.length === 0
                ? text.noBeat
                : beats.map((beat) => (
                    <span
                      key={beat.harmonics.join(':')}
                      className="cc-beat-rate"
                      title={text.harmonics(...beat.harmonics)}
                    >
                      {beatRate(beat.rate)}
                    </span>
                  ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A bar from the middle (0¢) towards the side of the deviation; fraction runs −1…1. */
const offBar = (fraction: number): CSSProperties => ({
  left: `${50 + Math.min(0, fraction) * 50}%`,
  width: `${Math.abs(fraction) * 50}%`,
});

/** The cents a note is off pure, as a signed number and a small bar around 0. */
function CentsOff({ value }: { value: number }) {
  const clamped = Math.max(-1, Math.min(1, value / BAR_CENTS));
  return (
    <span className="cc-off">
      <span className="cc-off-value">{signedCents(value)}</span>
      <span className="cc-off-bar" aria-hidden="true">
        <span className="cc-off-mark" style={offBar(clamped)} />
      </span>
    </span>
  );
}

/**
 * Chord comparison: the pure chord beside up to four tuning systems' versions, each with
 * its notes' cents off pure, the beats between them and a play button.
 */
export function ChordComparisonVisual({ settings }: LabProps) {
  const [state] = useChordComparison();
  const columns = chordColumns(state, settings);
  const playback = useChordPlayback();
  const headingId = useId();
  const { chord } = state;
  const roles = chordTones(chord).map((tone) => copy.chords.roles[tone.interval]);
  const pure = pureChord(chord);
  const chordName = copy.chords.name(copy.chords.roots[chord.root]!, chord.type);
  const sine = !isCustomTimbre(settings.timbre) && settings.timbre === 'sine';
  const allFrequencies = [
    columns.pure.frequencies,
    ...columns.systems.map((c) => c.tuned.notes.map((n) => n.frequency)),
  ];
  const highestFirst = <T,>(items: readonly T[]) => items.map((item, i) => ({ item, i })).reverse();

  const playButton = (index: number, label: string) => (
    <button
      type="button"
      className="button-tertiary ml-focusable cc-play"
      aria-label={text.play(label)}
      onClick={() => playback.play(index, allFrequencies[index]!)}
    >
      <span aria-hidden="true">▶</span>
    </button>
  );

  return (
    <div className="cc-visual">
      <div className="cc-toolbar">
        <h2 id={headingId} className="cc-chord">
          {chordName}
          <span className="cc-chord-detail">{copy.chords.inversions[chord.inversion]}</span>
        </h2>
        <button
          type="button"
          className="button-primary ml-focusable"
          onClick={() => (playback.inTurn ? playback.stop() : playback.playAll(allFrequencies))}
        >
          {playback.inTurn ? text.stop : text.playAll}
        </button>
      </div>
      {sine && <p className="cc-hint">{text.sineHint}</p>}

      <div className="cc-columns" aria-labelledby={headingId} role="group">
        <section className="cc-column cc-column-pure" data-playing={playback.playing === 0 || undefined}>
          <header className="cc-column-head">
            <h3 className="cc-column-title">{text.pureHeading}</h3>
            <p className="cc-column-sub">{pure.proportion.join(':')}</p>
            {playButton(0, text.pureHeading)}
          </header>
          <ol className="cc-notes" aria-label={text.notesLabel(text.pureHeading)}>
            {highestFirst(pure.ratios).map(({ item: r, i }) => (
              <li key={i} className="cc-note">
                <span className="cc-note-name">{formatRatio(r)}</span>
                <span className="cc-note-hz">{formatHz(columns.pure.frequencies[i]!)}</span>
              </li>
            ))}
          </ol>
          <Beats pairs={columns.pure.beats} roles={roles} />
        </section>

        {columns.systems.map((column, c) => {
          const heading = columnHeading(column);
          return (
            <section
              key={column.system}
              className="cc-column"
              data-system={column.system}
              data-playing={playback.playing === c + 1 || undefined}
            >
              <header className="cc-column-head">
                <h3 className="cc-column-title">{heading}</h3>
                <p className="cc-column-sub">{text.centsOff}</p>
                {playButton(c + 1, heading)}
              </header>
              <ol className="cc-notes" aria-label={text.notesLabel(heading)}>
                {highestFirst(column.tuned.notes).map(({ item: note, i }) => (
                  <li key={i} className="cc-note" data-role={roles[i]}>
                    <span className="cc-note-name" title={note.name}>
                      {shortName(column, note)}
                    </span>
                    <CentsOff value={note.centsOffPure} />
                    <span className="cc-note-hz">{formatHz(note.frequency)}</span>
                  </li>
                ))}
              </ol>
              <Beats pairs={column.beats} roles={roles} />
              {column.tuned.remarks.length > 0 && (
                <ul className="cc-remarks">
                  {column.tuned.remarks.map((remark) => (
                    <li key={remarkText(remark)}>{remarkText(remark)}</li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

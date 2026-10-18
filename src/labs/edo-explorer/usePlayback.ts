import { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../audio/engine';

const SCALE_VOICE = 'edo-scale';
/** The whole scale takes about this long, each step between the bounds below. */
const SCALE_SECONDS = 4.8;
const STEP_MIN_SECONDS = 0.08;
const STEP_MAX_SECONDS = 0.3;
/** The top note rings on a little after the last step. */
const LAST_NOTE_SECONDS = 0.6;

/** Seconds per step: quicker for a large N, so every scale takes a few seconds. */
const stepSeconds = (steps: number) =>
  Math.min(STEP_MAX_SECONDS, Math.max(STEP_MIN_SECONDS, SCALE_SECONDS / steps));

/**
 * Plays a scale one note after another (each note replaces the one before) and says
 * whether it is still playing. The first note starts inside the click, so audio may start.
 */
export function useScalePlayback() {
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      audioEngine.noteOff(SCALE_VOICE);
    },
    [],
  );
  return {
    playing,
    play(frequencies: readonly number[]) {
      clear();
      const each = stepSeconds(frequencies.length - 1);
      frequencies.forEach((hz, i) => {
        const last = i === frequencies.length - 1;
        const pluck = () => audioEngine.pluck(SCALE_VOICE, hz, last ? LAST_NOTE_SECONDS : each + 0.1);
        if (i === 0) pluck();
        else timers.current.push(window.setTimeout(pluck, i * each * 1000));
      });
      timers.current.push(
        window.setTimeout(() => setPlaying(false), ((frequencies.length - 1) * each + LAST_NOTE_SECONDS) * 1000),
      );
      setPlaying(true);
    },
    stop() {
      clear();
      audioEngine.noteOff(SCALE_VOICE);
      setPlaying(false);
    },
  };
}

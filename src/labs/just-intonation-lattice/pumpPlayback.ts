/**
 * The comma explorer's playback (issue #31): stepping (Next), playing through to home
 * (Play) and the optional drone on 1/1. It lives in this module, not in a component, so it
 * keeps going while a phone shows The math tab instead of Controls.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { audioEngine } from '../../audio/engine';
import { commaPumpLength, runCommaPump } from '../../core';
import { hrefFor, navigate } from '../../state/location';
import type { Settings } from '../../state/settings';
import { type PumpState, maxPumpStep, readPump, writePump } from './pumpState';
import { playStep, tonicFrequency } from './sound';

/** Seconds between chords while playing through to home. */
const STEP_SECONDS = 1.5;

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const changed = () => listeners.forEach((l) => l());

let timer: number | undefined;
let droning = false;
const DRONE = 'comma:drone';

/** The pump in the address bar right now (playback outlives renders). */
const pumpNow = () => readPump(new URLSearchParams(window.location.search));
const writeNow = (next: PumpState) =>
  navigate(hrefFor(window.location.pathname, writePump(new URLSearchParams(window.location.search), next)), {
    replace: true,
  });

/** Steps on one chord and plays it; false when there is nowhere further to go. */
function stepOn(settings: Settings): boolean {
  const state = pumpNow();
  if (!state || state.step >= maxPumpStep(state.id)) return false;
  const next = { ...state, step: state.step + 1 };
  writeNow(next);
  playStep(runCommaPump(next.id, next.step).at(-1)!, settings);
  return true;
}

export function stopPump(): void {
  if (timer === undefined) return;
  window.clearTimeout(timer);
  timer = undefined;
  changed();
}

/** Next chord (stops any playing first). */
export function nextChord(settings: Settings): void {
  stopPump();
  stepOn(settings);
}

/** Plays the current chord, then steps on chord by chord until the pump is home again. */
export function playToHome(settings: Settings): void {
  stopPump();
  const state = pumpNow();
  if (!state) return;
  playStep(runCommaPump(state.id, state.step).at(-1)!, settings);
  if (state.step >= maxPumpStep(state.id)) return;
  const tick = () => {
    const ok = stepOn(settings);
    const now = pumpNow();
    if (!ok || !now || now.step % commaPumpLength(now.id) === 0 || now.step >= maxPumpStep(now.id)) {
      timer = undefined;
      changed();
    } else timer = window.setTimeout(tick, STEP_SECONDS * 1000);
  };
  timer = window.setTimeout(tick, STEP_SECONDS * 1000);
  changed();
}

/** Whether Play is stepping through. */
export const usePumpPlaying = () => useSyncExternalStore(subscribe, () => timer !== undefined);

/** Turns the drone on 1/1 on or off (call from a click: it may start the audio). */
export function setDrone(on: boolean, settings: Settings): void {
  if (on === droning) return;
  droning = on;
  if (on) audioEngine.noteOn(DRONE, tonicFrequency(settings));
  else audioEngine.noteOff(DRONE);
  changed();
}

export const useDrone = () => useSyncExternalStore(subscribe, () => droning);

/**
 * Keeps the drone on the starting Tonic's pitch as the settings change, and stops the
 * playback and the drone when the comma explorer is turned off or the Lab is left. Use
 * once, in the Visual.
 */
export function usePumpSound(settings: Settings, active: boolean): void {
  const drone = useDrone();
  const hz = tonicFrequency(settings);
  useEffect(() => {
    if (drone) audioEngine.setFrequency(DRONE, hz);
  }, [drone, hz]);
  useEffect(() => {
    if (!active) return;
    return () => {
      stopPump();
      if (droning) {
        droning = false;
        audioEngine.noteOff(DRONE);
        changed();
      }
    };
  }, [active]);
}

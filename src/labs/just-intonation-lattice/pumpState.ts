/**
 * The comma explorer's state (issue #31), shared by the lattice Lab's Visual, Controls and
 * Math: the pump and step in the URL (./pump.ts), what is drawn, and how it sounds —
 * stepping (Next), playing through to home (Play), and the optional drone on 1/1.
 * Playback and the drone live in this module, not in a component, so they keep going
 * while a phone shows The math tab instead of Controls.
 */
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { playChord as playFrequencies } from '../../audio/chords';
import { audioEngine } from '../../audio/engine';
import {
  type CommaPumpId,
  type LatticeNode,
  type PrimeFactors,
  type PumpStep,
  commaPumpComma,
  commaPumpLength,
  factorsCents,
  factorsFraction,
  latticeNoteName,
  nodeOfFactors,
  octaveReduceFactors,
  runCommaPump,
} from '../../core';
import { copy } from '../../copy/en';
import { formatRatio } from '../../format/numbers';
import { hrefFor, navigate, useLocation } from '../../state/location';
import type { Settings } from '../../state/settings';
import type { LatticeLayout } from './geometry';
import { type PumpState, maxPumpStep, pumpLimit, readPump, writePump } from './pump';
import { tonicFrequency } from './state';

const text = copy.latticeLab.pump;

/** The comma explorer from the URL (null: building a chord) and a setter that writes it back. */
export function usePump(): [PumpState | null, (next: PumpState | null) => void] {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const state = useMemo(() => readPump(new URLSearchParams(query)), [query]);
  const update = useCallback(
    (next: PumpState | null) =>
      navigate(hrefFor(pathname, writePump(new URLSearchParams(query), next)), { replace: true }),
    [pathname, query],
  );
  return [state, update];
}

// --- Names --------------------------------------------------------------------------------------

/** "5/4": a node's ratio, octave-reduced, exact however far the pump has gone. */
export const nodeRatioText = (n: LatticeNode) =>
  formatRatio(factorsFraction(octaveReduceFactors({ two: 0, ...n })));

/** "E 5/4": a pitch's name and ratio, as the lattice labels its node. */
export const pitchLabel = (tonic: number, pitch: PrimeFactors) => {
  const n = nodeOfFactors(pitch);
  return `${latticeNoteName(tonic, n)} ${nodeRatioText(n)}`;
};

/** "Am": the chord symbol of a step, spelled from its root's node. */
export const stepSymbol = (tonic: number, step: PumpStep) =>
  text.symbol(latticeNoteName(tonic, nodeOfFactors(step.root)), step.chord.type);

/** "C–Am–Dm–G–C": one loop's chords, spelled from the Tonic. */
export function loopSymbols(tonic: number, id: CommaPumpId): string {
  return runCommaPump(id, commaPumpLength(id))
    .map((s) => stepSymbol(tonic, s))
    .join('–');
}

/** "C–Am–Dm–G–C: home comes back 21.5¢ flat (80/81)." */
export function pumpDescription(tonic: number, id: CommaPumpId, formatSize: (cents: number) => string): string {
  const comma = commaPumpComma(id);
  const drift = factorsCents(comma);
  return text.description(loopSymbols(tonic, id), formatSize(Math.abs(drift)), drift > 0, formatRatio(factorsFraction(comma)));
}

// --- What the lattice shows ---------------------------------------------------------------

export interface PumpPicture {
  readonly id: CommaPumpId;
  /** Every step so far, the current one last. */
  readonly run: readonly PumpStep[];
  readonly current: PumpStep;
  /** The roots so far, in order: the teal path. */
  readonly path: readonly LatticeNode[];
  /** The current chord's notes. */
  readonly chord: readonly LatticeNode[];
  /** Every node of the loop on screen (home belongs to the loop just finished), for framing the desktop view. */
  readonly frame: readonly LatticeNode[];
  readonly limit: LatticeLayout['limit'];
  /** Whether Next can step on (loops stop at MAX_LOOPS). */
  readonly canStep: boolean;
}

const chordNodes = (s: PumpStep) => s.notes.map((n) => nodeOfFactors(n.pitch));

export function pumpPicture({ id, step }: PumpState): PumpPicture {
  const length = commaPumpLength(id);
  const current = runCommaPump(id, step);
  // The loop on screen: arriving home still shows the loop just finished.
  const last = current.at(-1)!;
  const loopStart = (last.position === 0 && last.loop > 0 ? last.loop - 1 : last.loop) * length;
  const loop = runCommaPump(id, loopStart + length).slice(loopStart);
  return {
    id,
    run: current,
    current: current.at(-1)!,
    path: current.map((s) => nodeOfFactors(s.root)),
    chord: chordNodes(current.at(-1)!),
    frame: loop.flatMap((s) => [nodeOfFactors(s.root), ...chordNodes(s)]),
    limit: pumpLimit(id),
    canStep: step < maxPumpStep(id),
  };
}

/** The picture for the URL's pump, recomputed only when it changes. */
export function usePumpPicture(state: PumpState | null): PumpPicture | null {
  const id = state?.id;
  const step = state?.step;
  return useMemo(() => (id === undefined ? null : pumpPicture({ id, step: step! })), [id, step]);
}

// --- Sound --------------------------------------------------------------------------------

/** A pitch above the starting Tonic, in Hz: 1/1 is the Tonic's 12-EDO pitch in octave 4. */
export const pitchFrequency = (settings: Settings, pitch: PrimeFactors) =>
  tonicFrequency(settings) * 2 ** (factorsCents(pitch) / 1200);

/** Plays one step's chord, replacing the chord before. */
export function playStep(step: PumpStep, settings: Settings): void {
  playFrequencies(step.notes.map((n) => pitchFrequency(settings, n.pitch)));
}

/** Plays a node tapped on the lattice, in the octave above 1/1. */
export function playNode(node: LatticeNode, settings: Settings): void {
  audioEngine.pluck('comma:node', pitchFrequency(settings, octaveReduceFactors({ two: 0, ...node })), 1.6);
}

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

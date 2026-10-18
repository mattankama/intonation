/**
 * Audio engine (decisions: Synthesis approach #6, Timbre preset recipes #14).
 *
 * - One OscillatorNode per note, driven by an unnormalised PeriodicWave built from the
 *   Timbre's harmonic amplitudes, so harmonics stay locked at exact k:1 ratios.
 * - Levels come from ./levels: every Timbre is loudness-matched by RMS, with headroom so a
 *   3-note chord at full volume peaks around 0.6. A DynamicsCompressorNode set to
 *   −1 dBFS / ratio 20 is kept only as a safety net for big chords; it never engages for
 *   ordinary playing, so it can't flatten the beats people should hear.
 * - Changing the Timbre while notes sound never calls setPeriodicWave on a sounding
 *   oscillator (that clicks). Each note starts a second oscillator with the new wave a
 *   whole number of periods after the note began, so the two are in phase, and
 *   crossfades to it.
 * - Envelopes use setTargetAtTime only (never .value, never cancelAndHoldAtTime).
 * - The AudioContext is created and resumed only from a user gesture (noteOn).
 *
 * The engine never computes pitch: callers pass frequencies from the acoustics core.
 */
import { type Harmonics, presetHarmonics } from '../core';
import { phaseAlignedStart, voiceAmplitudes, volumeGain } from './levels';

/** Envelope time constants in seconds; ≈ 5 time constants to settle (~40 ms / ~120 ms). */
const ATTACK = 0.008;
const RELEASE = 0.024;
/** Timbre crossfade time constant (~75 ms to settle). */
const CROSSFADE = 0.015;
/** Master volume changes glide rather than step. */
const VOLUME_GLIDE = 0.02;
/** How far ahead a crossfade is scheduled, so the new oscillator starts on time. */
const LOOKAHEAD = 0.01;
/** A faded-out oscillator is stopped once its gain has decayed this many time constants. */
const SETTLE = 8;

/** One oscillator of a note; a note has more than one only during a Timbre crossfade. */
interface Layer {
  osc: OscillatorNode;
  fade: GainNode;
}

interface Voice {
  frequency: number;
  /** When the note's first oscillator started; later layers start in phase with it. */
  start: number;
  envelope: GainNode;
  layers: Layer[];
}

export function periodicWaveTerms(amplitudes: Harmonics): { real: Float32Array; imag: Float32Array } {
  const real = new Float32Array(amplitudes.length + 1);
  const imag = new Float32Array(amplitudes.length + 1);
  amplitudes.forEach((a, i) => {
    imag[i + 1] = a;
  });
  return { real, imag };
}

class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private wave: PeriodicWave | null = null;
  private harmonics: Harmonics = presetHarmonics('sine');
  private volume = 100;
  private readonly voices = new Map<string, Voice>();
  private readonly pluckTimers = new Map<string, number>();

  /** Creates or resumes the AudioContext. Call only from a user gesture. */
  private ensureContext(): AudioContext {
    if (!this.context) {
      const context = new AudioContext();
      const safetyNet = new DynamicsCompressorNode(context, {
        threshold: -1,
        knee: 0,
        ratio: 20,
      });
      this.master = new GainNode(context, { gain: volumeGain(this.volume) });
      this.master.connect(safetyNet).connect(context.destination);
      this.context = context;
      this.wave = this.buildWave();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  private buildWave(): PeriodicWave {
    const { real, imag } = periodicWaveTerms(voiceAmplitudes(this.harmonics));
    return new PeriodicWave(this.context!, { real, imag, disableNormalization: true });
  }

  /** Sets the master volume (0–100 %). Safe to call before any sound has played. */
  setVolume(volumePercent: number): void {
    this.volume = volumePercent;
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(volumeGain(volumePercent), this.context.currentTime, VOLUME_GLIDE);
  }

  /**
   * Sets the Timbre (harmonic amplitudes; the engine loudness-matches them). Sounding
   * notes crossfade to it. Safe to call before any sound has played.
   */
  setTimbre(harmonics: Harmonics): void {
    const same =
      harmonics.length === this.harmonics.length && harmonics.every((a, i) => a === this.harmonics[i]);
    if (same) return;
    this.harmonics = harmonics;
    if (!this.context) return;
    this.wave = this.buildWave();
    const earliest = this.context.currentTime + LOOKAHEAD;
    for (const voice of this.voices.values()) {
      const at = phaseAlignedStart(voice.start, voice.frequency, earliest);
      for (const layer of voice.layers) {
        layer.fade.gain.setTargetAtTime(0, at, CROSSFADE);
        layer.osc.stop(at + CROSSFADE * SETTLE);
      }
      const layer = this.startLayer(voice, at, 0);
      layer.fade.gain.setTargetAtTime(1, at, CROSSFADE);
      voice.layers = [layer];
    }
  }

  private startLayer(voice: Voice, at: number, initialGain: number): Layer {
    const context = this.context!;
    const osc = new OscillatorNode(context, { frequency: voice.frequency, periodicWave: this.wave! });
    const fade = new GainNode(context, { gain: initialGain });
    osc.connect(fade).connect(voice.envelope);
    osc.addEventListener('ended', () => fade.disconnect());
    osc.start(at);
    return { osc, fade };
  }

  /** Starts a note. `id` names it for noteOff; reusing an id releases the old note first. */
  noteOn(id: string, frequency: number): void {
    const context = this.ensureContext();
    this.noteOff(id);
    const now = context.currentTime;
    const envelope = new GainNode(context, { gain: 0 });
    envelope.connect(this.master!);
    envelope.gain.setTargetAtTime(1, now, ATTACK);
    const voice: Voice = { frequency, start: now, envelope, layers: [] };
    voice.layers.push(this.startLayer(voice, now, 1));
    this.voices.set(id, voice);
  }

  noteOff(id: string): void {
    const voice = this.voices.get(id);
    if (!voice || !this.context) return;
    this.voices.delete(id);
    const now = this.context.currentTime;
    voice.envelope.gain.setTargetAtTime(0, now, RELEASE);
    // Layers already fading out of a crossfade stop sooner than this, so the envelope
    // can go once the current layer has ended.
    const end = now + RELEASE * SETTLE;
    for (const layer of voice.layers) {
      layer.osc.stop(end);
      layer.osc.addEventListener('ended', () => voice.envelope.disconnect());
    }
  }

  /** Plays a note for a fixed time (keyboard activation of an on-screen key). */
  pluck(id: string, frequency: number, seconds = 0.6): void {
    window.clearTimeout(this.pluckTimers.get(id));
    this.noteOn(id, frequency);
    this.pluckTimers.set(
      id,
      window.setTimeout(() => this.noteOff(id), seconds * 1000),
    );
  }
}

export const audioEngine = new AudioEngine();

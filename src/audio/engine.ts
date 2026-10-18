/**
 * Audio engine (decision: Synthesis approach, issue #6).
 *
 * - One OscillatorNode per note, driven by an unnormalised PeriodicWave built from the
 *   Timbre's harmonic amplitudes, so harmonics stay locked at exact k:1 ratios.
 * - Envelopes use setTargetAtTime only (never .value, never cancelAndHoldAtTime).
 * - No compressor or limiter, which would flatten the beats people should hear.
 *   Clipping is prevented with headroom: each wave is scaled so its worst-case peak is 1,
 *   and each voice gets an equal share of a fixed peak budget for MAX_VOICES notes.
 * - The AudioContext is created and resumed only from a user gesture (noteOn).
 *
 * The engine never computes pitch: callers pass frequencies from the acoustics core.
 */

/** Harmonic amplitudes a₁, a₂, …; the sine Timbre is [1]. */
export type Harmonics = readonly number[];

export const SINE: Harmonics = [1];

/** Notes that may sound at once before the sum could reach full scale. */
export const MAX_VOICES = 6;
/** Peak level the whole mix is kept under (≈ −0.9 dBFS). */
const PEAK_BUDGET = 0.9;
/** Attack and release time constants in seconds (≈ 5 time constants to settle). */
const ATTACK = 0.008;
const RELEASE = 0.06;

/**
 * Fourier terms for a PeriodicWave, scaled so the wave's worst-case peak
 * (the sum of |aₖ|) is exactly 1.
 */
export function periodicWaveTerms(harmonics: Harmonics): { real: Float32Array; imag: Float32Array } {
  const peak = harmonics.reduce((sum, a) => sum + Math.abs(a), 0) || 1;
  const real = new Float32Array(harmonics.length + 1);
  const imag = new Float32Array(harmonics.length + 1);
  harmonics.forEach((a, i) => {
    imag[i + 1] = a / peak;
  });
  return { real, imag };
}

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
}

class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private wave: PeriodicWave | null = null;
  private readonly voices = new Map<string, Voice>();

  /** Creates or resumes the AudioContext. Call only from a user gesture. */
  private ensureContext(): AudioContext {
    if (!this.context) {
      const context = new AudioContext();
      this.master = new GainNode(context, { gain: PEAK_BUDGET / MAX_VOICES });
      this.master.connect(context.destination);
      const { real, imag } = periodicWaveTerms(SINE);
      this.wave = new PeriodicWave(context, { real, imag, disableNormalization: true });
      this.context = context;
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  /** Starts a note. `id` names it for noteOff; reusing an id releases the old note first. */
  noteOn(id: string, frequency: number): void {
    const context = this.ensureContext();
    this.noteOff(id);
    const now = context.currentTime;
    const osc = new OscillatorNode(context, { frequency, periodicWave: this.wave! });
    const gain = new GainNode(context, { gain: 0 });
    osc.connect(gain).connect(this.master!);
    gain.gain.setTargetAtTime(1, now, ATTACK);
    osc.start(now);
    this.voices.set(id, { osc, gain });
  }

  noteOff(id: string): void {
    const voice = this.voices.get(id);
    if (!voice || !this.context) return;
    this.voices.delete(id);
    const now = this.context.currentTime;
    voice.gain.gain.setTargetAtTime(0, now, RELEASE);
    voice.osc.stop(now + RELEASE * 8);
    voice.osc.onended = () => voice.gain.disconnect();
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

  private readonly pluckTimers = new Map<string, number>();
}

export const audioEngine = new AudioEngine();

# Synthesis approach: per-harmonic oscillators vs one PeriodicWave per note

Research for [issue #6](https://github.com/mattankama/intonation/issues/6) (parent map #2, spec #1). Constraint: ADR-0002 says sound comes from the raw Web Audio API with no audio library, so that every frequency is set exactly, to fractions of a cent.

**Question.** Should each note be built from one sine `OscillatorNode` per harmonic (with a `GainNode` per harmonic), or from one `OscillatorNode` per note that plays a custom `PeriodicWave`? The comparison covers frequency precision, CPU cost for 4-note chords × 16 harmonics, changing timbre while a note sounds, normalisation, click-free envelopes, limiting and autoplay.

## Answer

**Use one `OscillatorNode` per note with a custom `PeriodicWave`, created with `disableNormalization: true`. Give each note one `GainNode` envelope, followed by a fixed master gain with enough headroom.** Do not use a `DynamicsCompressorNode` as the normal limiter. To change timbre while a note sounds, crossfade between two oscillators that play the same note, started at the same time so their phases match. Do not call `setPeriodicWave()` on a sounding oscillator. Keep per-harmonic sine oscillators as a fallback for a future Lab that needs inharmonic or individually detuned partials.

Why:

- **Same pitch precision.** In Chromium and WebKit the built-in `"sine"` type is itself a PeriodicWave wavetable, so both approaches use the same DSP code. Frequency error is about 0.0001 cents in Chromium/WebKit and at most a few hundredths of a cent in Gecko, for either approach.
- **Harmonics are exactly harmonic with a PeriodicWave.** Partial k is read from the same table at k times the fundamental's phase. They cannot drift apart, and a pitch change moves all 16 together through one `frequency` AudioParam.
- **About 16× fewer oscillators** (4 instead of 64) and **about 17× fewer nodes** in total (8 instead of 132), with the same cost per oscillator per sample.
- **The browser band-limits automatically.** With per-harmonic sines, the app must drop any harmonic above Nyquist itself.
- **Timbre fits the Glossary.** The Glossary defines timbre as "the strengths of its harmonics", which is exactly what a PeriodicWave's coefficient arrays hold.

The cost: timbre is fixed for each oscillator, so changing it live needs the crossfade pattern below rather than ramping 16 gains.

---

## 1. How frequency is represented, and how precise it is

**Spec.** `OscillatorNode.frequency` and `detune` are a-rate AudioParams that combine as `computedOscFrequency(t) = frequency(t) * pow(2, detune(t) / 1200)`. The instantaneous phase is "the definite time integral of computedOscFrequency" from the node's start time ([§1.26](https://www.w3.org/TR/webaudio-1.1/#OscillatorNode), [computedOscFrequency](https://www.w3.org/TR/webaudio-1.1/#computedoscfrequency)). `AudioParam.value` and every automation value are IDL `float`, i.e. single precision ([§1.6 AudioParam](https://www.w3.org/TR/webaudio-1.1/#AudioParam)). Every frequency is therefore rounded to float32 at the API boundary: at most half an ulp, about 6×10⁻⁸ relative, or **about 0.0001 cents**. Set the exact frequency computed in JS (double) on `frequency` and leave `detune` at 0, so no second rounding step is added.

**Implementations** (source read at the commits linked in Sources):

| Engine | Phase accumulator | Increment | `"sine"` type | Custom PeriodicWave |
|---|---|---|---|---|
| Chromium (Blink) | `double` table read index | `float` | wavetable (the context's shared sine PeriodicWave) | wavetable, linear interpolation (3- or 5-point Lagrange below ≈3 Hz) |
| WebKit | `double` table read index | `float` | wavetable (same Blink-derived design) | same as Chromium |
| Gecko | **`float`** (`mPhase`) | `float` | `fdlibm_sinf(mPhase)`, computed directly | wavetable, linear interpolation, `float` phase |

I simulated these accumulators bit-exactly (float32 arithmetic, 48 kHz, 5 s, table size 4096). The effective pitch error was:

| f₀ | Chromium/WebKit | Gecko sine | Gecko custom |
|---|---|---|---|
| 27.5 Hz | 0.00007 ¢ | 0.030 ¢ | 0.009 ¢ |
| 110 Hz | 0.00007 ¢ | 0.007 ¢ | 0.007 ¢ |
| 261.6 Hz | 0.00005 ¢ | 0.003 ¢ | 0.003 ¢ |
| 880 Hz | 0.00007 ¢ | 0.0009 ¢ | 0.0006 ¢ |

This is my own model of the code, not a browser measurement. Every figure is well under a hundredth of a cent above about 100 Hz. The approaches differ only in this: with per-harmonic sines in Gecko, each harmonic carries its own independent rounding error, so harmonics drift by tiny amounts relative to each other. With a PeriodicWave all partials share one phase and stay exactly in ratio k:1. Neither rounds to a 12-note grid, so both satisfy ADR-0002.

**Interpolation distortion.** A 4096-sample table read with linear interpolation gives an error of about (2π/N)²/8, where N is the number of table samples per cycle of the partial. That is about −130 dB for a sine and about −82 dB for harmonic 16 (N = 256), which is inaudible.

**Band-limiting.** The spec requires care to avoid aliasing ([§1.26](https://www.w3.org/TR/webaudio-1.1/#OscillatorNode)). Chromium and WebKit build 3 tables per octave (36 tables at 44.1/48 kHz) and choose and blend two of them by the fundamental frequency. As a result, partials above roughly 0.63 × Nyquist (about 15 kHz at 48 kHz, 13.9 kHz at 44.1 kHz) can be faded out early. This also applies to the built-in sine, so per-harmonic sines get no advantage. Gecko also limits partials to `nyquist / f₀`. With per-harmonic sines the app must skip harmonics ≥ Nyquist itself. The spec clamps `frequency` to [−Nyquist, Nyquist], so it does not silence them.

## 2. CPU and node cost: 4 notes × 16 harmonics

| | Per-harmonic sines | PeriodicWave per note |
|---|---|---|
| OscillatorNodes | 64 | 4 (8 during a timbre crossfade) |
| GainNodes | 64 harmonic + 4 envelope | 4 envelope (8 while crossfading) |
| Nodes to create on every chord start (oscillators can't restart) | 132 | 8 |
| Per-sample DSP per oscillator | table lookup + interpolation | same code path in Chromium/WebKit |
| Table memory | shared built-in sine | one table set per PeriodicWave: 36 × 4096 floats ≈ 576 KiB in Chromium at 48 kHz |

Sources: Chromium uses `Context()->GetPeriodicWave(SINE)` for the sine type and stores per-range `band_limited_tables_`. Paul Adenot's (Gecko engineer, spec editor) Web Audio performance notes say oscillators are "implemented using multiple wave tables computed using the inverse Fourier transform", except that the sine is computed directly in Gecko. They also say gain automation is applied to the buffer in every browser, so automated harmonic gains are not free.

The oscillator DSP scales with node count, so the per-harmonic design does about 16× more oscillator work and walks a much larger graph every 128-frame render quantum. I did **not** measure absolute CPU (no browser was available to this agent). 64 oscillators at 48 kHz is about 3 M interpolated samples per second, which should fit on desktop, but phones are uncertain. PeriodicWave keeps us well clear either way.

There is one PeriodicWave-specific cost: `createPeriodicWave` runs one inverse FFT per range (36 FFTs of 4096 points) on the main thread and allocates about 576 KiB. Cache one PeriodicWave per timbre and reuse it for every note. Don't recreate it on every slider `input` event; throttle it to animation frames or create it on `change`.

## 3. Changing timbre while a note sounds

- **Per-harmonic.** Ramp each harmonic's `GainNode.gain` with automation. Changes are smooth and continuous. This is the approach's one real strength.
- **PeriodicWave, swapping waves.** `setPeriodicWave()` on a playing oscillator is applied at once, with no smoothing. Chromium swaps `periodic_wave_` under a lock and keeps the read index, so phase is preserved (the spec also requires phase to be preserved when `type` is set). But the waveform's *shape* changes in a single sample, which produces a step discontinuity, i.e. a click. Also, if Chromium's audio thread can't take that lock during a swap, it outputs **a zeroed render quantum** (`output_bus->Zero()`, about 2.7 ms of silence). **Don't swap waves on a sounding oscillator.**
- **PeriodicWave, recommended crossfade.** At note start, start oscillators A (current timbre) and B (target timbre), or start B whenever you need it, but **with the same `start()` time and the same `frequency`**. Phase is the integral of frequency from the start time, so A and B stay phase-locked. To move to a new timbre, ramp A's gain from 1 to 0 and B's from 0 to 1 over 20–50 ms. Both waves use the same phase convention (e.g. only sine terms, `imag`), and normalisation is disabled. A linear crossfade g·A + (1−g)·B therefore equals *exactly* the wave whose coefficients are interpolated linearly. Each harmonic's amplitude moves smoothly, with no comb-filter dip. For a continuous slider drag, keep the two-oscillator pair alive: refill the silent side with the newest timbre and crossfade again (rate-limited). If a Lab really needs continuous per-harmonic morphing at audio rate, use per-harmonic sines for that Lab only.

## 4. PeriodicWave normalisation

- **Spec** ([§1.28.4–1.28.5](https://www.w3.org/TR/webaudio-1.1/#waveform-normalization)). The unnormalised wave is x(t) = Σₖ₌₁ (a[k] cos 2πkt + b[k] sin 2πkt). By default (`disableNormalization: false`) it is divided by f = max |x̃(n)|, its peak on an N-point grid, so **the peak is always 1**. DC (index 0) is forced to 0. Implementations must support at least 8192 elements, and the `real` and `imag` lengths must match.
- **Consequence.** With normalisation on, loudness depends on the harmonic *phases* and on how the peaks happen to line up, not only on the amplitudes. Two timbres with the same harmonic strengths but different phases come out at different levels, and a timbre change jumps in level. Chromium computes the peak once, on the fullest table, and applies it to all ranges.
- **With `disableNormalization: true`** the coefficients are literal amplitudes: `imag[1] = 1` gives a sine of peak 1. Firefox and Chromium both apply an internal 0.5 IFFT correction to reach this. Mozilla bug 1424906 fixed Firefox, which was producing peak 2.
- **Recommendation.** Set `disableNormalization: true` and normalise in our own code. Scale each timbre to a common RMS, √(Σ (aₖ² + bₖ²) / 2), so switching timbre doesn't change loudness. Compute a peak bound to drive the headroom gain (§6).

## 5. Click-free envelopes with AudioParam automation

- Setting `.value` is defined as `setValueAtTime(value, currentTime)`, an instant step ([§1.6.1](https://www.w3.org/TR/webaudio-1.1/#dom-audioparam-value)). The spec says nothing about de-zippering. **Never assign `.value` to a sounding gain or frequency.**
- Start every note's envelope gain at 0, and start the oscillator before it is audible.
- **Attack:** `gain.setTargetAtTime(peak, t0, τa)` with τa ≈ 3–10 ms, or `setValueAtTime(0, t0)` + `linearRampToValueAtTime(peak, t0 + 0.01)`.
- **Release:** `gain.setTargetAtTime(0, t1, τr)`, then `osc.stop(t1 + 8 * τr)`. e⁻⁸ is about −70 dB. Note that `exponentialRampToValueAtTime` cannot reach 0 ([spec](https://www.w3.org/TR/webaudio-1.1/#dom-audioparam-exponentialramptovalueattime)), and the spec itself recommends `setTargetAtTime` for release ([§1.6.2](https://www.w3.org/TR/webaudio-1.1/#dom-audioparam-settargetattime)).
- **Releasing mid-attack, or retriggering:** a new SetTarget event takes as its starting value the [[current value]] at its start time, so following one SetTarget with another is continuous **without cancelling anything**. Avoid `cancelScheduledValues()` while a ramp is running. The spec warns that it "may cause discontinuities because the original value … is restored immediately". `cancelAndHoldAtTime()` would solve this, but **Firefox does not implement it** (MDN BCD: Chrome 57, Safari 14.1, Firefox no, [bug 1308431](https://bugzil.la/1308431)). Rule: build envelopes only from `setTargetAtTime` events at "now", or from ramps that start at "now" and are never cancelled early.
- `stop()` may be called again; "the last invocation will be the only one applied" ([§1.7](https://www.w3.org/TR/webaudio-1.1/#AudioScheduledSourceNode)). Oscillators can't be restarted, so each note-on creates new oscillators. With PeriodicWave that is 1–2 nodes per note, not 17+.
- Automation times aren't quantised to the sample rate ([§1.6](https://www.w3.org/TR/webaudio-1.1/#AudioParam)). Schedule chord notes at one shared `t0` slightly after `currentTime` (e.g. +10–20 ms) so they start together, sample-accurately.

## 6. Limiting: DynamicsCompressorNode, and why it shouldn't do the work

Spec facts ([§1.19](https://www.w3.org/TR/webaudio-1.1/#DynamicsCompressorNode)):

- Ranges: threshold −100–0 dB (default −24), knee 0–40 dB (default 30), ratio 1–20 (default 12), attack 0–1 s (default 0.003), release 0–1 s (default 0.25). All are k-rate.
- **Fixed 6 ms look-ahead**: the internal graph contains `DelayNode(0.006)`, so the node adds latency and has a tail.
- **Automatic make-up gain that can't be turned off**: (1/f(1.0))^0.6, where f is the compression curve.
- Attack and release are applied through a detector average and an envelope rate, so it is not a brick-wall limiter. Fast transients can still overshoot.
- Signals outside [−1, 1] at the destination have undefined rendering ([§5.2](https://www.w3.org/TR/webaudio-1.1/#audio-values-rendering)).

**Why it matters for Intonation.** The site exists to let people hear beating. When the partials of a slightly impure chord beat, the summed amplitude swells and falls at the beat rate (about 0.5–20 Hz). An engaged compressor with release ≈ 0.25 s tracks and **flattens exactly those swells**, which hides the difference between tuning systems, and its make-up gain shifts levels. So:

1. **Gain staging first.** Before the destination, bound the worst-case peak: Σ over notes of (note gain × Σₖ |harmonic amplitude|). Beating means coherent peaks *will* line up regularly, so treat the bound as reachable. Set a master `GainNode` so the bound stays at or below about −1 dBFS (e.g. 4 notes at peak 1 each means master ≤ 0.22). Use the RMS normalisation from §4 for loudness and this bound for safety.
2. **Optional safety net only.** If added at all, put a `DynamicsCompressorNode` last, with **threshold −1 dB, knee 0, ratio 20, attack 0, release ≈ 0.1 s**. Make-up gain is then about +0.57 dB (f(1) ≈ −0.95 dB, × 0.6), so leave a little more than 1 dB of headroom in step 1. Because of step 1 it should never engage in normal use. Read `reduction`, which updates once per render quantum, in dev builds to assert it stays at 0. Keep in mind it still adds 6 ms of latency on every path.
3. A soft clipper (`WaveShaperNode`) is an alternative safety net with no latency, but it adds harmonics when it engages, which is a timbre change. That is worse for this site than gain reduction, so use it only as a last resort.

## 7. Autoplay and user-gesture rules

- **Spec** ([§1.2 "allowed to start"](https://www.w3.org/TR/webaudio-1.1/#allowed-to-start)): a UA may block the `"suspended"` → `"running"` transition until the page has **sticky activation**. While it is blocked, `resume()` promises stay pending; they are not rejected.
- **HTML** ([user activation](https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation)): activation comes from trusted `keydown` (not Esc or reserved keys), `mousedown`, `pointerdown` (mouse), `pointerup` (non-mouse) or `touchend`. It is sticky: once gained, it lasts for the page's lifetime.
- **Chrome**: a context "created before the document receives a user gesture … will be created in the 'suspended' state", so call `resume()` after the gesture. Chrome also resumes when `start()` is called on an attached node after a gesture. Chrome advises sticking to `click` because activation events are not yet consistent across browsers. **Firefox**: `media.autoplay.block-webaudio` defaults to true, so contexts play only after sticky activation (MDN Autoplay guide).
- **Pattern:** create one `AudioContext` lazily, or create it early and accept that it starts suspended. Call `ctx.resume()` inside the first Play button `click`/`pointerup` handler, and build notes only after `ctx.state === "running"`. Show the play affordance until then. Note for later: on iOS Safari the hardware silent switch can mute Web Audio. Safari 16.4+ exposes `navigator.audioSession.type = "playback"` ([Audio Session API](https://w3c.github.io/audio-session/), MDN BCD), which needs testing on a device once the site leaves localhost.

## Suggested node graph (PeriodicWave design)

```
per note:  Oscillator(PeriodicWave A) ─┐
           Oscillator(PeriodicWave B) ─┤ (B only while crossfading timbre)
           [xfade GainNodes]           ┘→ envelope GainNode ─┐
                                                             ├→ master GainNode (headroom) → [optional DynamicsCompressor safety] → destination
other notes ─────────────────────────────────────────────────┘
```

## Open questions / not verified

- **Absolute CPU on low-end and mobile devices** was not measured. A quick `OfflineAudioContext` benchmark (64 sines vs 4 PeriodicWaves, rendering 30 s) in a prototype would settle it.
- The Gecko precision numbers come from a bit-exact model of its float32 accumulator, not from captured browser output.
- Chromium/WebKit fade partials above about 0.63 × Nyquist early. That only matters if a Lab plays harmonic 16 of notes above about C6. Check by ear if it comes up.

## Sources

Specs:

- W3C, *Web Audio API 1.1*, Working Draft 22 Sep 2026: https://www.w3.org/TR/webaudio-1.1/. Sections used: [OscillatorNode §1.26](https://www.w3.org/TR/webaudio-1.1/#OscillatorNode), [PeriodicWave §1.28](https://www.w3.org/TR/webaudio-1.1/#PeriodicWave), [waveform normalisation](https://www.w3.org/TR/webaudio-1.1/#waveform-normalization), [AudioParam §1.6](https://www.w3.org/TR/webaudio-1.1/#AudioParam), [setTargetAtTime](https://www.w3.org/TR/webaudio-1.1/#dom-audioparam-settargetattime), [cancelAndHoldAtTime](https://www.w3.org/TR/webaudio-1.1/#dom-audioparam-cancelandholdattime), [DynamicsCompressorNode §1.19](https://www.w3.org/TR/webaudio-1.1/#DynamicsCompressorNode), [allowed to start](https://www.w3.org/TR/webaudio-1.1/#allowed-to-start), [rendering range §5.2](https://www.w3.org/TR/webaudio-1.1/#audio-values-rendering). Editor's Draft: https://webaudio.github.io/web-audio-api/
- WHATWG HTML, user activation: https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation
- W3C Audio Session API: https://w3c.github.io/audio-session/

Browser sources:

- Chromium `oscillator_handler.cc` (double read index, float increments, sine = PeriodicWave, try-lock zeroing): https://github.com/chromium/chromium/blob/dd41611e3f220a791491fa9fbc08a8dcea3558de/third_party/blink/renderer/modules/webaudio/oscillator_handler.cc
- Chromium `periodic_wave_handler.cc` (table sizes, 3 ranges per octave, culling, normalisation, 0.5 scale): https://github.com/chromium/chromium/blob/dd41611e3f220a791491fa9fbc08a8dcea3558de/third_party/blink/renderer/modules/webaudio/periodic_wave_handler.cc
- WebKit `OscillatorNode.cpp`: https://github.com/WebKit/WebKit/blob/e427188d73fb165e49a4aade8c172b47ea6fbe02/Source/WebCore/Modules/webaudio/OscillatorNode.cpp
- Gecko `OscillatorNode.cpp` (float `mPhase`, `fdlibm_sinf` sine path): https://github.com/mozilla-firefox/firefox/blob/9eb1a31a98493915dc324021054e5817cbef2444/dom/media/webaudio/OscillatorNode.cpp
- Gecko `blink/PeriodicWave.cpp` (normalisation, Nyquist culling): https://github.com/mozilla-firefox/firefox/blob/400a2309dafe25f9e4552a1758dce4eb360b10ef/dom/media/webaudio/blink/PeriodicWave.cpp
- Mozilla bug 1424906, "PeriodicWave disableNormalization … incorrect": https://bugzilla.mozilla.org/show_bug.cgi?id=1424906
- Mozilla bug 1308431 (cancelAndHoldAtTime not implemented): https://bugzil.la/1308431

Documentation:

- MDN `createPeriodicWave`: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createPeriodicWave
- MDN `cancelAndHoldAtTime` (BCD data: https://github.com/mdn/browser-compat-data/blob/main/api/AudioParam.json): https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime
- MDN Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- Chrome autoplay policy: https://developer.chrome.com/blog/autoplay
- Paul Adenot, *Web Audio API performance and debugging notes*: https://padenot.github.io/web-audio-perf/

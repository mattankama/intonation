# Audible beats

Research for [#5 Audible beats](https://github.com/mattankama/intonation/issues/5) (map [#2](https://github.com/mattankama/intonation/issues/2), spec [#1](https://github.com/mattankama/intonation/issues/1)).

**Question.** Which pairs of harmonics in an interval or chord give beats worth showing to a listener, and up to what beat rate? Where do psychoacoustics sources put the line between beats, roughness and separate tones, and how should beats between higher harmonics be weighted or filtered?

**Short answer.** Two partials a frequency difference Δf apart are heard as a single tone that **beats** (a countable wobble in loudness) while Δf is below about 15–20 Hz. Above that the wobble blurs into **roughness**. Roughness is strongest at about a quarter of a critical bandwidth (≈ 20–25 Hz in the bass, ≈ 40 Hz near 1 kHz, ≈ 80 Hz near 2 kHz). It fades into **two smooth, separate tones** once Δf reaches one critical bandwidth. Because the critical band widens with frequency, the same interval beats more slowly and sounds rougher in the bass than in the treble.

For the UI, report every pair of harmonics (up to the 8th) whose difference is at most 20 Hz as a beat. Weight each pair by the smaller of its two amplitudes and hide pairs too weak to hear. Pairs between 20 Hz and a quarter critical band can be shown separately as "fast beats (roughness)". Anything wider belongs to the Roughness model, not the beat list.

---

## 1. Beats, roughness and separate tones

When two sine tones at f₁ and f₂ sound together, the loudness envelope rises and falls |f₁ − f₂| times per second. What a listener hears depends on that rate and on how it compares with the critical bandwidth at that pitch.

| Δf (frequency difference) | Percept | Source |
|---|---|---|
| 0 | One steady tone | (definition) |
| up to ≈ 15–20 Hz | One tone whose **loudness wobbles**: countable beats. Called *fluctuation strength* in psychoacoustics; it peaks near a 4 Hz modulation rate. | Vassilakis: "Slow amplitude fluctuations (≈≤15 per second) are perceived as loudness fluctuations referred to as beating." Fluctuation strength is "due to slow modulations (≤ 20 Hz)" (Wickelmaier & Ellermeier, citing Terhardt 1968 and Fastl 1983). 4 Hz peak: Zwicker & Fastl's model, as plotted by Wickelmaier & Ellermeier. |
| ≈ 20 Hz to ≈ ¼ critical band | Beats too fast to count, heard as **roughness** that grows as Δf grows. Helmholtz: slow beats give a "coarse … chattering or jarring" roughness; faster ones a "finer but more cutting roughness". | Helmholtz Ch. VIII; Vassilakis; Plomp & Levelt |
| ≈ ¼ critical band | **Maximum roughness** (maximum "tonal dissonance") | Plomp & Levelt 1965: "maximal tonal dissonance is produced by intervals subtending 25% of the critical bandwidth" |
| ¼ critical band up to 1 critical band | Roughness fades; the two tones start to be heard separately | Plomp & Levelt 1965 |
| ≥ 1 critical band | **Two smooth, separate tones**, no beating or roughness | Plomp & Levelt 1965: "maximal tonal consonance is reached for interval widths of 100% of the critical bandwidth"; "roughness appears only for tones at a frequency distance not exceeding critical bandwidth" |

Notes on the boundaries:

- **Helmholtz's figures.** Helmholtz found the "most penetrating roughness … from beats of 30 to 40 in a second" and treated this as independent of pitch. He also heard intermittence ("pulses of tone") up to about 132 beats/s in high registers, where it is no longer countable (*Sensations of Tone*, Ch. VIII, pp. 170–173 of the Ellis translation). Plomp & Levelt found that 30–40 Hz matches their data only "in the frequency range between 500 and 1000 cps". In general, "for increasing frequency, also the interval width for maximum roughness … increases" in proportion to the critical bandwidth (p. 554).
- **How much the peak varies.** Measured peak-roughness separations near 1 kHz run from ~35–50 Hz (Plomp & Levelt 1965) to ~63 Hz median (Plomp & Steeneken 1968) and 70 Hz (Zwicker & Fastl's roughness reference). Greenwood argues these largely agree once listener spread is taken into account (Plomp & Steeneken's interquartile range is 50–76 Hz). Any threshold here is a convention, not a sharp line.
- **Where roughness ends.** Vassilakis gives ≈ 75–150 fluctuations/s as the point where roughness "almost disappears", "depending on the frequency of the interfering waves".

### How the boundaries move with register

Critical bandwidth is roughly constant at ~100 Hz below about 500 Hz. Above that it grows to about 15–20 % of the centre frequency. The table uses the Zwicker & Terhardt (1980) formula CB = 25 + 75·(1 + 1.4 f²)^0.69 (f in kHz). It also shows the Glasberg & Moore (1990) ERB = 24.7·(4.37 f + 1), and the peak-dissonance Δf implied by Sethares' fit to Plomp & Levelt (computed from his published constants, see §2):

| Mean frequency | Critical band (Z&T) | ¼ CB (max roughness) | ERB (G&M) | Sethares peak Δf |
|---|---|---|---|---|
| 65 Hz (C2) | 100 Hz | 25 Hz | 32 Hz | 19 Hz |
| 131 Hz (C3) | 101 Hz | 25 Hz | 39 Hz | 20 Hz |
| 262 Hz (C4) | 105 Hz | 26 Hz | 53 Hz | 22 Hz |
| 523 Hz (C5) | 119 Hz | 30 Hz | 81 Hz | 27 Hz |
| 1047 Hz (C6) | 167 Hz | 42 Hz | 138 Hz | 37 Hz |
| 2093 Hz (C7) | 316 Hz | 79 Hz | 251 Hz | 57 Hz |
| 4186 Hz (C8) | 726 Hz | 182 Hz | 477 Hz | 97 Hz |

This has two consequences in opposite directions, and both are in Helmholtz:

1. **The same cents error beats faster higher up.** Beat rate = harmonic frequency × mistuning, so it doubles every octave. A 10-cent error gives "about 3 beats in two seconds" on c′ (≈ 264 Hz, per the translator's footnote) but 3 and 6 beats per second one and two octaves up, "which become very disagreeable" (Ch. VIII p. 171).
2. **The same interval is rougher lower down.** In the bass, the whole gap between two notes (not only a mistuning) can fall inside one critical band. Helmholtz: major and minor thirds, consonant in the middle of the range, "are decidedly rough in the lower octaves and produce distinct beats". Beats of a whole tone are "very distinct and powerful" low down but "scarcely audible" near 2000 Hz (Ch. VIII p. 171). Plomp & Levelt link this to musical practice "to avoid thirds at low frequencies" (p. 556).

## 2. Complex tones: which partial pairs matter

Helmholtz's explanation, which Plomp & Levelt confirm and refine, is that the dissonance of two complex tones comes from beats and roughness between **pairs of partials**: partials of the lower note against partials of the upper note. A pure interval makes the low-numbered partials coincide exactly, so they cannot beat. Mistune it and those coinciding pairs split by a few Hz and beat. The beat rate of the pair "harmonic *i* of note A, harmonic *j* of note B" is

  Δf = | i·f_A − j·f_B |

and for an interval near the ratio j : i (e.g. 5 : 4) the first such pair is the one you hear most.

How the literature limits and weights pairs:

- **Number of harmonics.** Plomp & Levelt computed complex-tone dissonance with **6 harmonics**. They note that "for up to 6 harmonics, all frequency differences between adjacent harmonics exceed critical bandwidth", and that tones with strong harmonics above that "sound much sharper". They add that "most musical instruments produce strong harmonics up to a number that may vary from about 6 to 10" (pp. 555, 556, 560). Above roughly the 6th–8th harmonic, neighbouring harmonics of a *single* note already fall inside one critical band. From there on, a beat between two notes' high harmonics is buried in roughness the timbre already has on its own.
- **Summing pairs.** Plomp & Levelt sum the dissonance "of each pair of adjacent partials" and call this "rather speculative" but "not unreasonable as a first approximation" (p. 555).
- **Amplitude weighting.** Sethares' parameterisation of the Plomp–Levelt curve, the model the spec names for the Roughness lab, weights each pair by the **smaller** of the two amplitudes: `d = min(a_i, a_j) · (5·e^(−3.51·s·Δf) − 5·e^(−5.75·s·Δf))`, with `s = 0.24 / (0.0207·f_min + 18.96)` (published code on Sethares' site). The reason for `min` is physical. Two partials with amplitudes a ≥ b give an envelope swinging between a − b and a + b, so the depth of the wobble is set by the weaker partial. Equal amplitudes give the deepest beats, which matches Vassilakis: "interfering components of equal amplitudes resulting in the highest fluctuation degree."
- **Pure tones.** With pure sine tones, a mistuned 3 : 2 or 5 : 4 has no coinciding partials, yet weak "beats of mistuned consonances" can still be heard (Plomp 1967, JASA 42:462). They are faint and outside a partial-pair model, so the UI should not report them (see Open questions).

## 3. Recommended rule for the UI

For each pair of notes in the chord (A lower, B upper), with Timbre amplitudes a₁…a₁₆:

1. **Candidate pairs.** All (i, j) with 1 ≤ i, j ≤ **8**. Work out the beats from the 8 lowest harmonics even though the Timbre defines 16: Plomp & Levelt's 6, plus headroom for strong 7th and 8th harmonics, which they mention explicitly (4:7, 5:7, 6:7, 5:8, 7:8). Harmonics 9–16 still feed the Roughness model.
2. **Beat rate.** Δf = |i·f_A − j·f_B|, in Hz ("wobbles per second").
3. **Classify by Δf**, using the critical band CB at the pair's mean frequency (Zwicker & Terhardt formula):
   - **Beat** (show the number): Δf ≤ **20 Hz**. Below about 0.5 Hz, show it as a slow swell (period in seconds); exactly 0, show "no beat".
   - **Fast beat / roughness** (show dimmed, optional): 20 Hz < Δf < **CB/4**, the rising side of the Plomp–Levelt curve where faster beats turn into roughness.
   - **Not a beat**: Δf ≥ CB/4. Leave it to the Roughness model.
4. **Weight** each pair by w = min(a_i, a_j) × (the two notes' gains, if voices differ in level). Hide pairs with w below **0.1 × the strongest partial in the chord (−20 dB)**. This cutoff is our own choice, not a published threshold (see Open questions).
5. **Rank and trim.** For each note pair, list the surviving beats in order of weight and show the top one or two. For a mistuned interval near j : i, the top beat is nearly always the lowest coinciding pair (i, j), so "C–E: 10.4 beats/s" is the headline figure. Higher multiples ((2i, 2j), …) beat at 2×, 3× that rate and are weaker.
6. **Sine Timbre.** With only one harmonic, most mistuned intervals show no beats at all. Say so ("no partials close enough to beat"). Don't invent second-order beats.

Why 20 Hz rather than 15: the sources put countable beating at "≈ ≤ 15" (Vassilakis) or "≤ 20 Hz" (fluctuation strength). The higher figure keeps the familiar 12-EDO minor-third beat (≈ 14–18 Hz in the middle of the range) in the list, and these beats are still heard as a wobble, if a fast one.

## 4. Worked examples (A4 = 440 Hz, harmonics 1–8)

C4 = 261.626 Hz. 12-EDO: E4 = 329.628, G4 = 391.995, E♭4 = 311.127. Pure: E4 = 5/4·C4 = 327.032.

**Major third C4–E4, 12-EDO**

| Pair | Frequencies | Δf | Δf / CB | Class |
|---|---|---|---|---|
| C h5 – E h4 | 1308.13 / 1318.51 | **10.38 Hz** | 0.05 | **Beat** |
| C h4 – E h3 | 1046.50 / 988.88 | 57.6 Hz | 0.35 | not a beat (> CB/4 ≈ 41 Hz) |
| C h1 – E h1 | 261.63 / 329.63 | 68.0 Hz | 0.64 | not a beat |
| C h6 – E h5 | 1569.75 / 1648.14 | 78.4 Hz | 0.33 | not a beat |

The pair (10, 8) beats at 20.76 Hz but lies beyond harmonic 8, so the rule omits it. With 1/n amplitudes its weight would be 0.1 versus 0.2 for (5, 4).

**Major third C4–E4, pure 5/4**

| Pair | Δf | Class |
|---|---|---|
| C h5 – E h4 | **0 Hz** | no beat |
| C h1 – E h1, C h4 – E h3, C h6 – E h5 | 65.4 Hz each | not beats (some roughness, the same in every tuning) |

So the side-by-side comparison reads: 12-EDO third, **10.4 beats/s**; pure third, **no beats**. This is the textbook figure.

**Perfect fifth C4–G4, 12-EDO:** C h3 – G h2 beats at **0.89 Hz** (shown as a slow swell, ~1.1 s period). C h6 – G h4 beats at 1.77 Hz.

**Minor third C4–E♭4, 12-EDO:** C h6 – E♭ h5 beats at **14.1 Hz**. C h7 – E♭ h6 at 35.4 Hz falls in the fast-beat band (CB/4 at ~1.85 kHz ≈ 69 Hz).

**Major triad C4–E4–G4, 12-EDO:** C–E 10.4 Hz (h5/h4); C–G 0.89 Hz (h3/h2); E–G **17.8 Hz** (E h6 – G h5); plus E h7 – G h6 at 44.6 Hz as a fast beat.

**Same 12-EDO major third, different registers** (C h5 – E h4 pair):

| Octave | C | Beat rate | Reading |
|---|---|---|---|
| C2–E2 | 65.4 Hz | 2.6 Hz | slow, very clear wobble |
| C3–E3 | 130.8 Hz | 5.2 Hz | clear beat |
| C4–E4 | 261.6 Hz | 10.4 Hz | fast beat |
| C5–E5 | 523.3 Hz | 20.8 Hz | just past the beat limit; fast beat/roughness (CB/4 at 2.6 kHz ≈ 100 Hz) |
| C6–E6 | 1046.5 Hz | 41.5 Hz | fast beat/roughness |

In the bass a second effect appears: at C2–E2 the *fundamentals themselves* are only 16.4 Hz (12-EDO 17.0 Hz) apart, well inside one critical band. So even the pure third beats there, as Helmholtz describes. The rule reports this correctly because it does not assume beats come only from mistuning.

## 5. Open questions

- **The −20 dB visibility cutoff is our choice**, not taken from a source. A principled alternative would compare the envelope depth 20·log₁₀((a+b)/(a−b)) with a temporal-modulation detection threshold, which needs a source on amplitude-modulation detection (e.g. Viemeister 1979); not researched here.
- **Primary-source gaps.** I read Plomp & Levelt 1965 and Helmholtz in full text. Zwicker & Fastl (*Psychoacoustics*, Ch. 10 Fluctuation strength, Ch. 11 Roughness), Terhardt 1968/1974 and Plomp 1967 were **not** read directly. Their figures (4 Hz fluctuation-strength peak, 70 Hz roughness reference, ≤ 20 Hz fluctuation range) come from secondary sources that cite them. The Zwicker & Terhardt CB formula is the widely reproduced form, not checked against the 1980 paper itself.
- **Inharmonic partials** (e.g. a future piano-like Timbre) would shift the coinciding pairs. The rule still works if Δf is computed from the actual partial frequencies rather than i·f.
- **Second-order beats** with pure tones (Plomp 1967) are left out on purpose.

## Sources

- H. von Helmholtz, *On the Sensations of Tone*, trans. A. J. Ellis, 2nd English ed. (1885; 1895 reprint), Ch. VIII "Limits of the frequency of beats", pp. 170–173. Full text: <https://archive.org/details/onsensationsofto00helmrich>
- R. Plomp & W. J. M. Levelt, "Tonal consonance and critical bandwidth", *J. Acoust. Soc. Am.* 38, 548–560 (1965), doi:[10.1121/1.1909741](https://doi.org/10.1121/1.1909741). Full text (MPI): <https://pure.mpg.de/rest/items/item_66382_5/component/file_468040/content>
- R. Plomp, "Beats of mistuned consonances", *J. Acoust. Soc. Am.* 42, 462–474 (1967), doi:[10.1121/1.1910602](https://doi.org/10.1121/1.1910602) (citation only; PubMed <https://pubmed.ncbi.nlm.nih.gov/6075940/>)
- W. A. Sethares, "Local consonance and the relationship between timbre and scale", *J. Acoust. Soc. Am.* 94(3), 1218–1228 (1993): <https://sethares.engr.wisc.edu/papers/consance.html>. Dissonance-curve code and constants: <https://sethares.engr.wisc.edu/comprog.html>. Accessible version: <https://sethares.engr.wisc.edu/consemi.html>
- E. Zwicker & E. Terhardt, "Analytical expressions for critical-band rate and critical bandwidth as a function of frequency", *J. Acoust. Soc. Am.* 68, 1523–1525 (1980), doi:[10.1121/1.385079](https://doi.org/10.1121/1.385079)
- B. R. Glasberg & B. C. J. Moore, "Derivation of auditory filter shapes from notched-noise data", *Hearing Research* 47, 103–138 (1990), doi:[10.1016/0378-5955(90)90170-T](https://doi.org/10.1016/0378-5955(90)90170-T)
- H. Fastl & E. Zwicker, *Psychoacoustics: Facts and Models*, 3rd ed. (Springer 2007), Ch. 10 "Fluctuation strength" (p. 247), Ch. 11 "Roughness" (p. 257): <https://link.springer.com/book/10.1007/978-3-540-68888-4> (not read directly)
- F. Wickelmaier & W. Ellermeier, "Scaling the perceived fluctuation strength of frequency-modulated tones" (ASA poster, 2004), with definitions from Terhardt 1968 and Fastl 1983, and the Zwicker–Fastl model's 4 Hz peak: <https://www.mathpsy.uni-tuebingen.de/wickelmaier/pubs/WickelmaierEllermeier2004ASA.pdf>
- P. N. Vassilakis, "Auditory roughness" (adapted from Vassilakis 2005, *Selected Reports in Ethnomusicology* 12): <https://acousticslab.org/learnmoresra/moreroughness.html>
- D. D. Greenwood, "Plomp & Levelt vs. Zwicker & Fastl — little evidence of conflict", AUDITORY list, 5 Oct 1999 (summarises Plomp & Steeneken 1968 quartiles): <https://auditory.org/mhonarc/1999/msg00287.html>

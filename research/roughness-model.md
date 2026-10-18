# Roughness model for the three-note roughness landscape

Research for [#4](https://github.com/mattankama/intonation/issues/4), part of the [wayfinder map #2](https://github.com/mattankama/intonation/issues/2). It feeds the Beats & roughness Lab (spec #1, user stories 36–41).

## Answer

Use **Sethares' parameterisation of the Plomp–Levelt curve, in its second-edition form** (*Tuning, Timbre, Spectrum, Scale*, 2nd ed., Appendix E). That is the form with **min-amplitude weighting**, using the constants from Sethares' published code. To get a chord's roughness, pool every partial of all three notes and sum the pair roughness over **every unordered pair** of partials. Sethares' own "dissonance surfaces" for three-note chords (TTSS §6.8) are drawn exactly this way, so the Lab's landscape reproduces a published figure.

Vassilakis' amplitude term is the only well-documented alternative. With harmonic Timbres it ranks chords almost the same way (see the sanity checks), so keep it as a possible later upgrade rather than the default.

## 1. The formula

### Pair roughness

For two sine partials with frequencies `f1 < f2` and amplitudes `a1`, `a2`:

```
d(f1, f2, a1, a2) = min(a1, a2) · [ e^(−b1·s·(f2 − f1)) − e^(−b2·s·(f2 − f1)) ]

s = x* / (s1·f1 + s2)          (f1 = the LOWER frequency of the pair)
```

| Constant | Value | Role | Source |
|---|---|---|---|
| `b1` | **3.5** | rate at which roughness rises | TTSS App. E, eq. E.1 (code uses 3.51) |
| `b2` | **5.75** | rate at which roughness falls | TTSS App. E, eq. E.1; code |
| `x*` | **0.24** | "point of maximum dissonance" scaling | TTSS App. E; code (`Dstar`) |
| `s1` | **0.0207** | register dependence (slope) | Sethares' code; Vassilakis (book text rounds it to 0.021) |
| `s2` | **18.96** | register dependence (offset) | Sethares' code; Vassilakis (book text rounds it to 19) |

These are equations E.1 to E.4 of TTSS Appendix E ([book PDF on Sethares' site](https://sethares.engr.wisc.edu/paperspdf/ttss.pdf), printed pp. 329–330):

- E.1: `d(x) = e^(−b1·x) − e^(−b2·x)`, with "b1 = 3.5 and b2 = 5.75" from "a gradient minimization of the squared error between the (averaged) data" of Plomp and Levelt and the curve.
- E.2: `d(f1, f2, ℓ1, ℓ2) = ℓ12 [e^(−b1·s(f2−f1)) − e^(−b2·s(f2−f1))]`.
- E.3: `s = x* / (s1·f1 + s2)`.
- E.4: `ℓ12 = min(ℓ1, ℓ2)`.

Per the book, the `s` parameters "allow a single functional form to interpolate between the various curves" for different base frequencies, "sliding the dissonance curve along the frequency axis so that it begins at f1, and by stretching (or compressing) it". The values come from a least-squares fit.

**Which constants to use.** Sethares' own reference implementation, [`dissmeasure.m` on his "Some Useful Computer Programs" page](https://sethares.engr.wisc.edu/comprog.html), uses `Dstar=0.24; S1=0.0207; S2=18.96; C1=5; C2=-5; A1=-3.51; A2=-5.75`. Its comments in [`disscurve2.cpp`](https://sethares.engr.wisc.edu/files/disscurve2.cpp) give `s1`, `s2` as the least-squares values. Use **0.0207 and 18.96**: they are the unrounded fit, and [Vassilakis' published model](https://acousticslab.org/learnmoresra/moremodel.html) uses the same pair. For `b1`, the book and Vassilakis say 3.5 and the code says 3.51. The difference is under 1% everywhere: the sanity-check script reproduced the MATLAB values to within 0.7–1.7%, and the shape is unchanged. Use 3.5 so "The math" panel matches the printed formula. The code's `C1 = 5, C2 = −5` is an overall ×5 scale, which is irrelevant for a relative landscape.

**What the constants mean in Hz.** The bracket peaks at `x = ln(b2/b1)/(b2 − b1) ≈ 0.2206`, where it equals ≈ 0.1808. So maximum roughness between two equal partials occurs at a frequency gap of `0.2206 / s`:

| Lower partial | Gap of maximum roughness | Gap where roughness < 1% of peak |
|---|---|---|
| 125 Hz | ≈ 20 Hz | ≈ 160 Hz |
| 250 Hz | ≈ 22 Hz | ≈ 180 Hz |
| 500 Hz | ≈ 27 Hz | ≈ 220 Hz |
| 1000 Hz | ≈ 37 Hz | ≈ 300 Hz |
| 2000 Hz | ≈ 56 Hz | ≈ 450 Hz |

This is consistent with Plomp & Levelt's "rule of thumb that maximal tonal dissonance is produced by intervals subtending 25% of the critical bandwidth, and that maximal tonal consonance is reached for interval widths of 100% of the critical bandwidth" ([Plomp & Levelt 1965, p. 555](https://pure.mpg.de/rest/items/item_66382_5/component/file_468040/content)).

**Caveat (do not "fix" it).** The book calls `x* = 0.24` the point of maximum dissonance, but the fitted curve actually peaks at 0.2206. The constants are a joint fit and are published this way, so use them as given.

### Why Plomp–Levelt via Sethares

- Plomp & Levelt (1965) is the root model: they measured the consonance of pure-tone pairs and derived complex-tone curves by assuming "the total dissonance of such an interval is equal to the sum of the dissonances of each pair of adjacent partials" (p. 555), using 6 harmonics.
- Sethares turned their averaged curve into the closed form above (TTSS App. E; first published in [Sethares 1993, JASA 94(3):1218–1228](https://sethares.engr.wisc.edu/paperspdf/consonance.pdf)). He extended it from adjacent pairs to *all* pairs, and he is the source of three-note "dissonance surfaces".
- Vassilakis (2001, 2005) reuses Sethares' frequency term unchanged and only replaces the amplitude factor (§3).
- Harrison & Pearce (2020) reviewed the field and say of the Sethares and Vassilakis reformulations: "These modifications generally seem principled, but the resulting models have received little systematic validation" ([Psychological Review 127(2):216–244, PMC7032667](https://pmc.ncbi.nlm.nih.gov/articles/PMC7032667/)). See "Open doubts".

## 2. Summing over a three-note chord

Treat the chord as one pooled spectrum. Each note `k ∈ {1, 2, 3}` has fundamental `F_k` and the Timbre's harmonics `h = 1…H` at frequency `h·F_k` with amplitude `A_h` (the same Timbre on every note). Then:

```
R(chord) = Σ over all unordered pairs {p, q} of the 3H partials of d(f_p, f_q, a_p, a_q)
           (with f1 = min(f_p, f_q) inside d)
```

This is TTSS eq. E.6, `D_F = ½ Σ_i Σ_j d(f_i, f_j, ℓ_i, ℓ_j)`: "the sum of the dissonances of all pairs of partials". Applied to a chord, "the resulting sound has a dissonance that is the same as that of a single timbre with frequencies f_i and αf_i by the additivity assumption" (App. E, p. 330). For three notes, §6.8 says: "the total dissonance is calculated by adding the dissonances between all simultaneously sounding partials", with "Total Dissonance of Chord = Dissonance between F and rF + Dissonance between F and sF + Dissonance between rF and sF" (TTSS p. 122). `dissmeasure.m` implements exactly this: it sorts all partials and sums `min(a_i, a_j)·(…)` over every pair.

Implementation notes:

- **Pairs.** There are `3H(3H − 1)/2` pairs; with the spec's 16 harmonics that is 1,128 pairs per chord. That is cheap: a 200 × 200 landscape grid is about 45 M pair evaluations, which is fine in a Web Worker.
- **Intra-note pairs.** Pairs inside one note (e.g. harmonics 2 and 3 of the same note) are included by E.6/E.7. They change only slowly with register and contribute about 1–3% of a chord's total (see the "cross-only" columns in §4). Keep them, to match Sethares and the code. Leaving them out would not change the landscape's shape.
- **Do not use the shortcut `D_F(r) + D_F(s) + D_rF(s/r)`.** App. E (p. 331) writes the three-note case this way, but each `D_F(α)` already contains both notes' intrinsic dissonance (eq. E.7), so this counts every intra-note term twice. The pooled all-pairs sum is the unambiguous version, and it is what §6.8 and the code do.
- **Coinciding partials** (e.g. the root's 3rd harmonic and the fifth's 2nd in a pure 3:2) give a gap of 0, so `d = 0`. Do not merge coincident partials or add their amplitudes first. Sethares does not, and merging would make the surface jump at pure ratios.
- **Zero-amplitude harmonics** (muted in the Sound waves Lab) contribute nothing under `min`. Skip them for speed.
- **Optional cutoff.** For `s·(f2 − f1) > 2.5`, `d` is below 0.1% of the pair maximum, so it can be skipped. Sethares' BASIC version similarly zeroes exponentials whose argument is below −88.
- **Axes.** Sethares plots `r` and `s` as intervals from the bottom note (notes at `1, r, s`). The spec asks for lower interval × upper interval, i.e. notes at `F, F·i1, F·i1·i2`. The formula is the same; only the grid mapping differs.
- **Register.** The landscape depends on the bottom note's absolute frequency through `s`. The Lab must fix it, for example at the Root computed from the Reference pitch, and show it in "The math".
- **Normalisation.** Absolute values are arbitrary. Vassilakis: "the absolute roughness values calculated by the model are arbitrary and are only useful for roughness comparisons". They also grow with the number and strength of harmonics. For display, normalise per Timbre: divide by the maximum over the plotted grid, or by a reference chord such as a 12-EDO semitone cluster. Both keep "the landscape changes with Timbre" (story 40) visible as a change in shape.

## 3. Amplitude weighting

| Option | Pair weight | Source | Behaviour |
|---|---|---|---|
| **Product** | `a1·a2` | Sethares 1993 (JASA) | Quadratic in level, so it overweights loud low harmonics. Sethares later replaced it. |
| **Min** (recommended) | `min(a1, a2)` | TTSS 2nd ed. eq. E.4; App. G; `dissmeasure.m` | Linear in level. Peaks when the two partials are equal. Derived from beating physics. |
| **Vassilakis** | `(a_min·a_max)^0.1 · 0.5 · (2·a_min/(a_min + a_max))^3.11` | Vassilakis 2001, 2005 | Almost level-independent (`^0.1`). Strongly penalises unequal amplitudes. |

**Product → min.** TTSS App. E (p. 330): the min form "is discussed in Appendix G, and is a refinement of the model in [B: 165], which assumed that the loudnesses were multiplicative". [B: 165] is the 1993 JASA paper. App. G (p. 343) derives the min form from the envelope of two beating sines. The beat amplitude `E_max − E_min` works out to `2·min(a1, a2)`, so "the amplitude of the beating is given by the minimum of the two amplitudes. As the disparity in the amplitudes of the partials increases, the dissonance decreases and the maximum sensory dissonance occurs when the partials have equal amplitudes."

**Vassilakis.** [Vassilakis' model page (SRA, from Vassilakis 2001 & 2005)](https://acousticslab.org/learnmoresra/moremodel.html) gives `R = X^0.1 · 0.5 · (Y^3.11) · Z` with `X = Amin·Amax`, `Y = 2·Amin/(Amin + Amax)`, and `Z` exactly Sethares' bracket with `b1 = 3.5, b2 = 5.75, s = 0.24/(s1·fmin + s2), s1 = 0.0207, s2 = 18.96`. Multi-component spectra are handled by "summing the roughness of all sine-pairs in the spectrum". The X and Y terms are "based on Terhardt (1974)", adjusted for amplitude-fluctuation degree. The page reports r = 0.98 against Vassilakis' own listening experiments, and states "The model does not adjust for equal loudness."

**Recommendation: `min`.**

1. It is Sethares' current, published, self-justified form, and the code he distributes uses it.
2. It is linear in amplitude, so the spec's Timbre brightness control moves the landscape in an intuitive way. Product would exaggerate brightness changes. Vassilakis' `^0.1` would almost ignore overall level and react mainly to amplitude *differences* between neighbouring partials.
3. It is the easiest to explain in "The math" panel: one line, "the beat is as strong as the weaker partial".
4. On harmonic Timbres it ranks familiar chords the same way as Vassilakis (§4).

**Amplitude vs loudness.** The book defines `ℓ` as loudness in sones (E.5, `ℓ = (1/16)·2^(SPL/10)`, which works out to ℓ ∝ A^0.602). Its own programs, however, are fed raw amplitudes (`amp`), as in the Fig. 3 example. Use the Timbre's **linear harmonic amplitudes** directly. A sone conversion is a documented option, but it adds no musical clarity for a relative landscape.

## 4. Sanity checks

These were computed with the recommended model (b1 = 3.5, b2 = 5.75, x* = 0.24, s1 = 0.0207, s2 = 18.96). The bottom note is C4 = 261.63 Hz, and the harmonic Timbre has 6 harmonics. Values are relative to the 12-EDO semitone (dyads) or to the C–C♯–D cluster (triads).

**Check against Sethares' code.** A literal port of `dissmeasure.m` on his Fig. 3 example (7 equal harmonics at 500 Hz) gives 4.980 at α = 1.06, 2.116 at 5/4, 0.826 at 3/2 and 0.158 at 2/1. The formula above (×5, b1 = 3.5) gives 5.017, 2.134, 0.835 and 0.160. The only difference is the 3.5 vs 3.51 rounding.

**Dyads.** These use cross-note pairs only. One note alone has intrinsic roughness ≈ 0.003, which is negligible.

| Interval | min, 1/k amplitudes | min, 0.88^(k−1) amplitudes | product, 1/k | Vassilakis, 1/k |
|---|---|---|---|---|
| Unison 1/1 | 0.014 | 0.023 | 0.006 | 0.019 |
| Octave 2/1 | 0.008 | 0.013 | 0.006 | 0.005 |
| Fifth 3/2 | 0.114 | 0.143 | 0.110 | 0.083 |
| 12-EDO fifth | 0.132 | 0.169 | 0.122 | 0.098 |
| Fourth 4/3 | 0.283 | 0.326 | 0.274 | 0.241 |
| Major third 5/4 | 0.415 | 0.437 | 0.435 | 0.358 |
| 12-EDO major third | 0.448 | 0.506 | 0.434 | 0.407 |
| Minor third 6/5 | 0.499 | 0.472 | 0.570 | 0.399 |
| Whole tone 9/8 | 0.756 | 0.695 | 0.855 | 0.656 |
| 12-EDO semitone | **1.000** | **1.000** | 1.000 | 1.000 |

Absolute values for the 1/k Timbre with `min`: unison 0.0059, fifth 0.0477, 12-EDO semitone 0.4187. So the **semitone is about 9× rougher than the pure fifth, which is about 8× rougher than the unison**. The pure fifth and major third both sit below their 12-EDO versions (fifth 0.114 vs 0.132; third 0.415 vs 0.448). This is the effect the Chord comparison and Beats & roughness Labs set out to show.

**Triads** (all pairs, `min`, 1/k amplitudes; relative to the C–C♯–D cluster = 1.000):

| Chord | Relative roughness |
|---|---|
| Unison ×3 | 0.023 |
| Stacked fifths 4:6:9 | 0.142 |
| Pure major 4:5:6 | 0.337 |
| Pure minor 10:12:15 | 0.348 |
| sus4 6:8:9 | 0.371 |
| 12-EDO major | 0.377 |
| 12-EDO minor | 0.391 |
| 12-EDO augmented | 0.416 |
| 12-EDO diminished | 0.514 |
| Semitone cluster | 1.000 |

The ordering is identical under Vassilakis weighting and under the 0.88^(k−1) Timbre. Under product weighting the middle of the list reshuffles slightly: 12-EDO augmented drops level with pure minor, and sus4 rises above 12-EDO minor. Leaving out intra-note pairs ("cross-only") changes each value by about 1–3%; the exception is the degenerate unison, where intra-note pairs are most of the total.

A test suite can lock in these invariants:

- unison ≪ fifth ≪ semitone;
- each pure chord < its 12-EDO version;
- 4:5:6 < 10:12:15 < 12-EDO major;
- the landscape is symmetric under swapping the upper two notes only when plotted against intervals from the bottom note.

## Open doubts

- **Empirical validity.** Harrison & Pearce (2020) found the Hutchinson & Knopoff (1978) interference model fit pooled consonance ratings best (r = .77). MIRtoolbox's Sethares-based measure, with its default product weighting, reached r = .57. They report no separate figure for Vassilakis. These are *consonance* judgments, which also depend on harmonicity and familiarity, not pure roughness ratings. The Lab shows sensory roughness, where Sethares is the standard and the only published three-note surface. If the site ever claims to predict *consonance*, it should say this model captures only the roughness component.
- **Timbre amplitudes.** Results depend on how the Timbre presets' harmonic amplitudes are defined. Harrison & Pearce use 11 harmonics with amplitude 1/i; Sethares' examples use 0.88^(k−1) or equal amplitudes. Normalise the landscape per Timbre (§2).
- **No phase or masking.** The model ignores phase (Pressnitzer & McAdams effects for three or more partials in one critical band, noted on Vassilakis' page), masking and equal-loudness contours. This is standard for all these models.
- **The 1993 paper is a scanned PDF.** Its product weighting is cited here from Sethares' own statement in TTSS App. E, not re-read from the scan.

## Sources

- Plomp, R. & Levelt, W. J. M. (1965). "Tonal consonance and critical bandwidth." *JASA* 38(4):548–560. doi:10.1121/1.1909741. [PDF (MPG PuRe)](https://pure.mpg.de/rest/items/item_66382_5/component/file_468040/content)
- Sethares, W. A. (1993). "Local consonance and the relationship between timbre and scale." *JASA* 94(3):1218–1228. [PDF](https://sethares.engr.wisc.edu/paperspdf/consonance.pdf), [paper page](https://sethares.engr.wisc.edu/papers/consance.html)
- Sethares, W. A. (2005). *Tuning, Timbre, Spectrum, Scale*, 2nd ed., Springer. Author's PDF (dated 16 Sept 2004): [ttss.pdf](https://sethares.engr.wisc.edu/paperspdf/ttss.pdf). Used: §6.8 "Dissonance Surfaces" (pp. 121–123), App. E "How to Draw Dissonance Curves" (pp. 329–331), App. G "Analysis of the Time Domain Model" (pp. 339–343).
- Sethares, W. A. "Some Useful Computer Programs" (`dissmeasure.m` and the BASIC version). [comprog.html](https://sethares.engr.wisc.edu/comprog.html); C translation with commented constants: [disscurve2.cpp](https://sethares.engr.wisc.edu/files/disscurve2.cpp)
- Sethares, W. A. "Relating Tuning and Timbre" (*Experimental Musical Instruments*, 1993). [consemi.html](https://sethares.engr.wisc.edu/consemi.html)
- Vassilakis, P. N. (2001), PhD dissertation, UCLA; (2005) "Auditory roughness as a means of musical expression," *Selected Reports in Ethnomusicology* 12:119–144. The model as published by the author: [SRA "Roughness Calculation Model"](https://acousticslab.org/learnmoresra/moremodel.html)
- Harrison, P. M. C. & Pearce, M. T. (2020). "Simultaneous consonance in music perception and composition." *Psychological Review* 127(2):216–244. [PMC7032667](https://pmc.ncbi.nlm.nih.gov/articles/PMC7032667/)

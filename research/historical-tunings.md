# Historical tuning definitions

Research for [#3](https://github.com/mattankama/intonation/issues/3). This file gives the exact 12-note definitions of Pythagorean tuning, quarter-comma meantone, Werckmeister III, Vallotti and Kirnberger III, and answers whether there is a standard 12-note 5-limit just intonation scale.

## Conventions

- **Tonic** = C. Cents are measured up from C and rounded to 3 decimals. They were computed from the exact constructions below. Every value was checked against the Huygens-Fokker Scala archive [S1], and the 0-decimal values were checked against Barbour [B] where he tabulates the system.
- Interval constants:
  - pure fifth 3/2 = 701.955 c
  - Pythagorean comma PC = 531441/524288 = 23.460 c
  - syntonic comma SC = 81/80 = 21.506 c
  - schisma = PC − SC = 32805/32768 = 1.954 c
- **Note names are the historical spellings.** A 12-key keyboard has one key per pitch class, but each system has a true spelling for that key. For example, Werckmeister's and Kirnberger's "C#" key is really a D♭ (256/243). The table gives both names where they differ. The Lab can label keys however the UI wants, but the pitch must come from the chain position shown here.
- **"Wolf"** means the one fifth that closes the chain and is badly out of tune. The three well-temperaments (Werckmeister III, Vallotti, Kirnberger III) have **no wolf**. For them this file gives where the chain closes and the size of that closing fifth.

## Summary

| System | Chain of fifths (12 notes) | Closing fifth | Size of closing fifth | Wolf? |
|---|---|---|---|---|
| Pythagorean | E♭ … G♯ | G♯–E♭ | 678.495 c (−PC) | Yes |
| ¼-comma meantone | E♭ … G♯ | G♯–E♭ | 737.637 c (+35.682) | Yes |
| Werckmeister III | G♭–D♭–A♭–E♭–B♭–F–C–G–D–A–E–B | B–F♯(=G♭), one of the four tempered fifths | 696.090 c | No |
| Vallotti (modern standard) | F … B♭ (F–C–G–D–A–E–B–F♯–C♯–G♯–D♯/E♭–B♭) | B♭–F (pure) | 701.955 c | No |
| Kirnberger III | D♭ … F♯ | F♯–D♭ (narrow by a schisma) | 700.001 c | No |
| 5-limit JI | not a single chain | several fifths | 680.449 / 721.508 c | Yes, several |

---

## 1. Pythagorean tuning

**Construction:** 11 pure fifths (3/2) from E♭ to G♯. The leftover fifth G♯–E♭ is narrow by a full Pythagorean comma. This is the wolf.

| Note | Ratio | Cents |
|---|---|---|
| C | 1/1 | 0.000 |
| C♯ | 2187/2048 | 113.685 |
| D | 9/8 | 203.910 |
| E♭ | 32/27 | 294.135 |
| E | 81/64 | 407.820 |
| F | 4/3 | 498.045 |
| F♯ | 729/512 | 611.730 |
| G | 3/2 | 701.955 |
| G♯ | 6561/4096 | 815.640 |
| A | 27/16 | 905.865 |
| B♭ | 16/9 | 996.090 |
| B | 243/128 | 1109.775 |

- **Chain:** E♭–B♭–F–C–G–D–A–E–B–F♯–C♯–G♯.
- **Wolf:** G♯–E♭ = 262144/177147 = 678.495 c.
- **Sources:**
  - Barbour, Table 80 [B]. It uses the E♭…G♯ chain: C♯ 114, E♭ 294, F♯ 612, G♯ 816.
  - Scala `pyth_12.scl` [S1]. Its ratios are identical.

**Disagreement (which 12 notes):** Pythagorean tuning has no single authoritative 12-note chain, so the chain is a choice.
- Barbour notes that Hugo de Reutlingen's 15th-century monochord used "two sharps and three flats" (A♭…C♯). Barbour shows the "more typical" G♯ instead [B, p. 99].
- Wikipedia builds a D-centred E♭…G♯ chain. It also notes that a C-centred symmetric chain D♭…F♯ (wolf F♯–D♭) is equally valid [W1].
- **Recommendation:** use E♭…G♯. It matches Barbour and Scala, and it puts the wolf in the same place as meantone, which makes comparisons cleaner.

## 2. Quarter-comma meantone

**Construction:**
- Make C–E a pure 5/4.
- The four fifths C–G–D–A–E are equal, so each is narrowed by ¼ SC. The fifth is 5^(1/4) = 696.578 c.
- Every fifth in the chain E♭…G♯ has this size.
- The wolf is G♯–E♭.

The ratio column uses q = 5^(1/4), the meantone fifth.

| Note | Exact value | Cents |
|---|---|---|
| C | 1 | 0.000 |
| C♯ | 5^(7/4)/16 | 76.049 |
| D | √5/2 | 193.157 |
| E♭ | 4/5^(3/4) | 310.265 |
| E | 5/4 | 386.314 |
| F | 2/5^(1/4) | 503.422 |
| F♯ | 5√5/8 | 579.471 |
| G | 5^(1/4) | 696.578 |
| G♯ | 25/16 | 772.627 |
| A | 5^(3/4)/2 | 889.735 |
| B♭ | 4/√5 | 1006.843 |
| B | 5^(5/4)/4 | 1082.892 |

- **Chain:** E♭–B♭–F–C–G–D–A–E–B–F♯–C♯–G♯.
- **Wolf:** G♯–E♭ = 737.637 c, which is 35.682 c wider than pure.
- **Sources:**
  - Pietro Aron, *Toscanello in musica* (Venice, 1523), as summarised by Barbour [B, pp. 25–26, Table 22]. Aron's tuning order:
    1. Make C–E "sonorous and just".
    2. Flatten C–G and G–D slightly, and make D–A and A–E equal.
    3. Temper F–C, B♭–F and E♭–B♭ the same way.
    4. Tune C♯ and F♯ as pure thirds below E and above D. Aron is silent on G♯, which Barbour and Kinkeldey take as a pure third above E.
  - Barbour's table gives E♭ 310 and G♯ 773, which is the E♭…G♯ chain.
  - Scala `meanquar.scl` [S1] matches to 5 decimals.

**Note:** Aron never states "¼ comma". Barbour derives it: equal fifths plus a pure C–E force each fifth down by ¼ SC [B, p. 26]. The D♯/A♭ alternative (split keys) exists historically, for example Scala `meanquar_14.scl` after Gibelius (1666), but the standard 12-note keyboard layout is E♭…G♯.

## 3. Werckmeister III ("Correct temperament No. 1")

**Construction:**
- The four fifths **C–G, G–D, D–A and B–F♯** are each narrowed by ¼ PC, to 696.090 c.
- The other eight fifths are pure.

The exact ratios below are the ones published on Wikipedia [W2]. They were checked here.

| Note (key) | True spelling | Exact value | Cents |
|---|---|---|---|
| C | C | 1/1 | 0.000 |
| C♯ | D♭ | 256/243 | 90.225 |
| D | D | (64/81)·√2 | 192.180 |
| E♭ | E♭ | 32/27 | 294.135 |
| E | E | (256/243)·2^(1/4) | 390.225 |
| F | F | 4/3 | 498.045 |
| F♯ | G♭ | 1024/729 | 588.270 |
| G | G | (8/9)·2^(3/4) | 696.090 |
| G♯ | A♭ | 128/81 | 792.180 |
| A | A | (1024/729)·2^(1/4) | 888.270 |
| B♭ | B♭ | 16/9 | 996.090 |
| B | B | (128/81)·2^(1/4) | 1092.180 |

- **Chain:**
  - Going down from C: F, B♭, E♭, A♭, D♭, G♭ are all pure, so those notes are plain Pythagorean flats.
  - Going up from C: C–G–D–A are tempered, A–E–B are pure, and B–F♯(=G♭) is tempered and closes the circle.
- **No wolf.** The closing fifth B–F♯ is one of the four tempered fifths (696.090 c).
- **Sources:**
  - Andreas Werckmeister, *Musicalische Temperatur* (Frankfurt & Leipzig, 1691), Plate [P1]. Barbour gives cents 0 90 192 294 390 498 588 696 792 888 996 1092 and the four tempered fifths C–G, G–D, D–A, B–F♯ [B, pp. 160–161, Table 140].
  - Scala `werck3.scl` [S1] matches.

**Disagreements and naming:**
- **Numbering:**
  - "III" is the label on Werckmeister's monochord plate, where I = just intonation and II = meantone.
  - In his own text it is the *first* of his "correct" (well) temperaments. That is why Barbour calls it "Correct Temperament No. 1" and Wikipedia calls it "Werckmeister I (III)" [W2].
  - Barbour's "No. 3" (Table 141) is a *different* temperament: Werckmeister IV in monochord numbering. Code and UI should say "Werckmeister III" and not mix the two schemes.
- **Date:**
  - Scala labels it "1681", which is the *Orgel-Probe*.
  - Barbour cites *Musicalische Temperatur* 1691.
  - IMSLP has the 1691 edition scan and notes a first publication in 1686/87 [P1].
  - Use 1691 (*Musicalische Temperatur*) as the citation.
- **Primary values not read directly:** I did not read the monochord string lengths on the 1691 plate myself. The values here are Barbour's reading [B] plus the exact construction.

## 4. Vallotti

### 4a. Modern standard "Vallotti" (what everyone ships)

**Construction:**
- The six consecutive fifths **F–C–G–D–A–E–B** are each narrowed by 1/6 PC, to 698.045 c.
- The six fifths **B–F♯–C♯–G♯–D♯(E♭)–A♯(B♭)–F** are pure.

The exact-value column uses p = PC^(1/6) (3.910 c). The pure-fifth side lands neatly: every note from F round to F♯ is a Pythagorean flat raised by p.

| Note | Exact value | Cents |
|---|---|---|
| C | 1/1 | 0.000 |
| C♯ | (256/243)·p | 94.135 |
| D | (9/8)·p⁻² | 196.090 |
| E♭ | (32/27)·p | 298.045 |
| E | (81/64)·p⁻⁴ | 392.180 |
| F | (4/3)·p | 501.955 |
| F♯ | (1024/729)·p | 592.180 |
| G | (3/2)·p⁻¹ | 698.045 |
| G♯ | (128/81)·p | 796.090 |
| A | (27/16)·p⁻³ | 894.135 |
| B♭ | (16/9)·p | 1000.000 |
| B | (243/128)·p⁻⁵ | 1090.225 |

- **Chain:** F–C–G–D–A–E–B (tempered), then B–F♯–C♯–G♯–E♭–B♭–F (pure).
- **No wolf.** The circle closes on B♭–F, which is pure (701.955 c).
- **Sources:**
  - Scala `vallotti.scl` [S1] ("Vallotti & Young scale (Vallotti version)"), which matches exactly.
  - Wikipedia [W3]: F–C, C–G, G–D, D–A, A–E, E–B tempered by 1/6 PC, the rest pure. It describes this as "a shifted version of Young's second temperament".
- **Primary:** F. A. Vallotti, *Della scienza teorica e pratica della moderna musica*, book 1 (Padua, 1779). The complete four books were first published in 1950 as *Trattato della moderna musica*. I did not consult it directly.
- **Young:** Thomas Young's version (Scala `young.scl`) is the same pattern starting from C (C–G–D–A–E–B–F♯ tempered). It is a rotation, not a different shape.

### 4b. Disagreement: Vallotti's own version used the syntonic comma

Wikipedia, citing Barbieri (1987) and Hansell/Grove [W3], says Vallotti's own temperament differs from 4a:
- The same six fifths F…B are narrowed by **1/6 SC** (698.371 c), not 1/6 PC.
- The five fifths B–F♯–C♯–G♯–E♭–B♭ are pure.
- **B♭–F is narrow by a schisma** (700.001 c).
- The article calls the modern 1/6-PC form a misattribution to Vallotti.

Scala `vallotti2.scl` ("Vallotti temperament, 1/6-comma") is this version. My computation from the construction matches it:

| C | C♯ | D | E♭ | E | F | F♯ | G | G♯ | A | B♭ | B |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.000 | 95.763 | 196.741 | 299.673 | 393.482 | 501.629 | 593.808 | 698.371 | 797.718 | 895.112 | 1001.628 | 1091.853 |

No two intervals in the two versions differ by more than about 2 c, and Wikipedia states they are audibly indistinguishable [W3].

**Recommendation:** ship 4a under the name "Vallotti", since it is the de-facto standard in tuners, Scala and the literature. Note the attribution caveat in the specialist text.

## 5. Kirnberger III

**Construction:**
- The four fifths **C–G–D–A–E** are each narrowed by ¼ SC (696.578 c), exactly as in meantone. This makes C–E a pure 5/4.
- The seven fifths E–B, B–F♯, D♭–A♭, A♭–E♭, E♭–B♭, B♭–F and F–C are pure.
- The last fifth, **F♯–D♭**, is narrow by one schisma (700.001 c).

| Note (key) | True spelling | Exact value | Cents |
|---|---|---|---|
| C | C | 1/1 | 0.000 |
| C♯ | D♭ | 256/243 | 90.225 |
| D | D | √5/2 | 193.157 |
| E♭ | E♭ | 32/27 | 294.135 |
| E | E | 5/4 | 386.314 |
| F | F | 4/3 | 498.045 |
| F♯ | F♯ | 45/32 | 590.224 |
| G | G | 5^(1/4) | 696.578 |
| G♯ | A♭ | 128/81 | 792.180 |
| A | A | 5^(3/4)/2 | 889.735 |
| B♭ | B♭ | 16/9 | 996.090 |
| B | B | 15/8 | 1088.269 |

- **Chain:** D♭–A♭–E♭–B♭–F–C (pure), C–G–D–A–E (¼ SC each), E–B–F♯ (pure).
- **No wolf.** The circle closes on F♯–D♭, which is a schisma narrow (700.001 c).
- **Sources:**
  - Wikipedia [W4] gives the same ratios.
  - Scala `kirnberger.scl` [S1], labelled "Kirnberger III, letter to Forkel 1779", matches.
  - Ableton's historical tuning catalogue [A1] names the tempered fifths, the seven pure fifths and the F♯–D♭ schisma exactly as above.
- **Primary:**
  - Kirnberger gave this only in a private letter to J. N. Forkel (c. 1779). It was first printed by Heinrich Bellermann as "Briefe von Kirnberger an Forkel", *Allgemeine Musikalische Zeitung* 6 (1871), no. 36, pp. 565–572 [W4].
  - I could not find a digitised copy, so this is reported second-hand.
  - Kirnberger's *published* temperament in *Die Kunst des reinen Satzes* (1771–79) is the different "Kirnberger II": D–A and A–E each narrowed by ½ SC [B, p. 157, Table 132; P2].

**Disagreement (where the schisma goes):**
- Scala also ships `kirnberger3.scl` ("Kirnberger 3: 1/4 synt. comma"). It uses C♯ = 135/128 (from F♯ by a pure fifth) and G♯ = 405/256, which moves the schisma to the G♯–E♭ fifth.
- Wikipedia, Ableton and Scala's own `kirnberger.scl` all put it on F♯–D♭, with D♭ = 256/243.
- **Recommendation:** use F♯–D♭ (the table above). Other Scala variants (`kirnberger3a/b`, after Billeter) are later "milder" reinterpretations, not Kirnberger III.

## 6. 5-limit just intonation: is there a standard 12-note scale?

**Short answer: no single canonical one.** The 7-note diatonic core is standard: Ptolemy's *diatonic syntonon* (intense diatonic), which Zarlino also adopted: 1/1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8 [B, Table 20]. The five chromatic notes vary by author. Barbour tabulates many different historical 12-note "just" monochords (Ramis, Fogliano, Kepler, Mersenne, Marpurg, Euler, Malcolm…) [B, ch. V, Tables 81–103].

The most commonly cited modern 12-note choice is what Wikipedia calls the **asymmetric 5-limit scale** [W5]:

| Note | Ratio | Cents | Alternatives seen in sources |
|---|---|---|---|
| C | 1/1 | 0.000 | |
| C♯/D♭ | 16/15 | 111.731 | 25/24 = 70.672 (Marpurg, Euler) |
| D | 9/8 | 203.910 | 10/9 = 182.404 (Wikipedia symmetric scale 2) |
| E♭ | 6/5 | 315.641 | |
| E | 5/4 | 386.314 | |
| F | 4/3 | 498.045 | |
| F♯ | 45/32 | 590.224 | 64/45 = 609.776, 25/18 = 568.717; Scala `ji_12.scl` uses 7/5 (7-limit, not 5-limit) |
| G | 3/2 | 701.955 | |
| G♯/A♭ | 8/5 | 813.686 | 25/16 = 772.627 (Marpurg) |
| A | 5/3 | 884.359 | |
| B♭ | 9/5 | 1017.596 | 16/9 = 996.090 (Wikipedia symmetric scale 1) |
| B | 15/8 | 1088.269 | |

- **Fifths:** this is not a chain of fifths, so there is no single wolf. In the asymmetric scale nine fifths are pure. Three are impure:
  - D–A = 40/27 = 680.449 c (−SC)
  - B♭–F = 40/27 = 680.449 c
  - F♯–C♯ = 1024/675 = 721.508 c
- **Thirds:** the major thirds E–G♯, F♯–B♭, A–C♯ and B–E♭ are 427.373 c (diminished fourths).
- **Sources:**
  - Wikipedia "Five-limit tuning" [W5]. It gives symmetric scales 1 and 2 and the asymmetric scale, citing Wright, *Mathematics and Music* (2009) pp. 140–141, and Fonville (1991). It does not call any of them "the standard".
  - Barbour, Table 96 [B]: Marpurg's Monochord No. 1, which Barbour calls "the model form of just intonation": 1, 25/24, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 25/16, 5/3, 9/5, 15/8.

**Recommendation:** for a Tonic-C chord comparison, the asymmetric scale is the defensible default. Its pure triads include C, F and G major and A, E and C minor. The project should state that this is *one* choice. The site's "pure chord" target (GLOSSARY) is computed per chord from its root, so it does not depend on this scale.

---

## Doubts and open points

1. **Primary sources read at second hand:** Werckmeister's 1691 plate, Vallotti's *Trattato* and Kirnberger's letter were not read directly. Werckmeister comes via Barbour, the other two via Wikipedia and Scala. All the mathematical constructions are unambiguous and agree across every source checked, except for the flagged disagreements.
2. **Pythagorean chain choice:** E♭…G♯ or D♭…F♯ is a project decision.
3. **Vallotti:** 1/6 PC (standard) or 1/6 SC (Vallotti's own per Barbieri) is a naming and caveat decision.
4. **Kirnberger III schisma placement:** F♯–D♭ (majority) or G♯–E♭ (Scala `kirnberger3.scl`).
5. **5-limit JI:** no canonical 12-note set. The choice of B♭ (9/5 or 16/9), D (9/8 or 10/9) and the tritone must be made explicitly.

## Sources

- **[B]** J. Murray Barbour, *Tuning and Temperament: A Historical Survey* (Michigan State College Press, 1951). Full text: https://archive.org/details/tuningtemperamen00barb. Used: Table 20 (Ptolemy), Table 22 (Aron meantone), Table 80 (Pythagorean), Tables 96–103 (just monochords), Table 132 (Kirnberger ½-comma), Table 140 (Werckmeister No. 1 / "III"), pp. 25–26, 99, 157–161.
- **[S1]** Huygens-Fokker Foundation, Scala scale archive (`scales.zip`): https://www.huygens-fokker.org/docs/scales.zip. Files used: `pyth_12`, `meanquar`, `meanquar_14`, `werck3`, `vallotti`, `vallotti2`, `young`, `kirnberger`, `kirnberger3`, `kirnberger3a`, `kirnberger3b`, `ji_12`. Overview: https://www.huygens-fokker.org/microtonality/scales.html
- **[P1]** Andreas Werckmeister, *Musicalische Temperatur* (Frankfurt & Leipzig: Calvisius, 1691). IMSLP scan: https://imslp.org/wiki/Musicalische_Temperatur_(Werckmeister,_Andreas). Facsimile edited by Rudolf Rasch (Utrecht: Diapason Press, 1983).
- **[P2]** Johann Philipp Kirnberger, *Die Kunst des reinen Satzes in der Musik* (Berlin, 1771–79), vol. 2: https://archive.org/details/diekunstdesreine02kirn
- **[P3]** Pietro Aron, *Toscanello in musica* (Venice, 1523; rev. 1529), as quoted in [B].
- **[W1]** Wikipedia, "Pythagorean tuning": https://en.wikipedia.org/wiki/Pythagorean_tuning
- **[W2]** Wikipedia, "Werckmeister temperament": https://en.wikipedia.org/wiki/Werckmeister_temperament
- **[W3]** Wikipedia, "Vallotti temperament": https://en.wikipedia.org/wiki/Vallotti_temperament. Cites Barbieri 1987, Hansell (Grove), Tartini 1754 and Jorgensen 1991.
- **[W4]** Wikipedia, "Kirnberger temperament": https://en.wikipedia.org/wiki/Kirnberger_temperament. Cites Bellermann, *AMZ* 1871.
- **[W5]** Wikipedia, "Five-limit tuning": https://en.wikipedia.org/wiki/Five-limit_tuning
- **[A1]** Ableton, "12 WT (Kirnberger III)": https://tuning.ableton.com/european-historical/12-wt-kirnberger-iii

All cents values were recomputed from the constructions with `1200·log2(ratio)` and agree with [S1] to within 0.001 c.

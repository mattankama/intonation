/**
 * Every user-facing string on the site, in one place so it can be translated later.
 * Vocabulary follows GLOSSARY.md.
 */
import {
  type ChordIntervalId,
  type ChordType,
  type CommaId,
  type CommaPumpId,
  type NamedTuningSystemId,
  type TimbrePresetId,
  type TuningSystemId,
  stepEdo,
} from '../core';
import type { LabId } from '../labs/ids';

const TUNING_SYSTEM_NAMES = {
  '12-edo': '12-EDO',
  pythagorean: 'Pythagorean',
  just: '5-limit just intonation',
  meantone: '¼-comma meantone',
  'werckmeister-iii': 'Werckmeister III',
  vallotti: 'Vallotti',
  'kirnberger-iii': 'Kirnberger III',
} satisfies Record<NamedTuningSystemId, string>;

/** Shorter names for the phone top-bar chip. */
const TUNING_SYSTEM_SHORT_NAMES = {
  '12-edo': '12-EDO',
  pythagorean: 'Pythagorean',
  just: '5-limit JI',
  meantone: 'Meantone',
  'werckmeister-iii': 'Werckmeister III',
  vallotti: 'Vallotti',
  'kirnberger-iii': 'Kirnberger III',
} satisfies Record<NamedTuningSystemId, string>;

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st. */
function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10];
  return `${n}${suffix ?? 'th'}`;
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "3 steps" / "1 step". */
const stepCount = (k: number) => `${Math.abs(k)} step${Math.abs(k) === 1 ? '' : 's'}`;

/** "a", "a and b", "a, b and c". */
const listAnd = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

const CHORD_TYPE_NAMES = {
  major: 'Major',
  minor: 'Minor',
  diminished: 'Diminished',
  augmented: 'Augmented',
  'dominant-7th': 'Dominant 7th',
  'major-7th': 'Major 7th',
  'minor-7th': 'Minor 7th',
  sus2: 'Sus2',
  sus4: 'Sus4',
} as const satisfies Record<ChordType, string>;

const INTERVAL_NAMES = {
  unison: 'unison',
  'major-second': 'major second',
  'minor-third': 'minor third',
  'major-third': 'major third',
  fourth: 'fourth',
  'diminished-fifth': 'diminished fifth',
  'septimal-tritone': 'septimal tritone',
  fifth: 'fifth',
  'augmented-fifth': 'augmented fifth',
  'harmonic-seventh': 'harmonic seventh',
  'minor-seventh': 'minor seventh',
  'major-seventh': 'major seventh',
} as const satisfies Record<ChordIntervalId, string>;

const TIMBRE_PRESET_NAMES = {
  sine: 'Sine',
  organ: 'Organ-like',
  string: 'String-like',
  brass: 'Brass-like',
  voice: 'Voice-like',
} as const satisfies Record<TimbrePresetId, string>;

export const copy = {
  siteName: 'Intonation',

  home: {
    headline: 'The math and acoustics of tuning, chords and sound waves',
    intro:
      'Six Labs to hear and see why some chords ring and others wobble, where commas come from, and how tuning systems differ. The math is always there when you want it.',
    labsHeading: 'Labs',
  },

  labs: {
    'sound-waves': {
      title: 'Sound waves',
      intro: 'Build a timbre from its harmonics and watch the waveform they add up to.',
    },
    'beats-and-roughness': {
      title: 'Beats & roughness',
      intro: 'See two waves interfere, and explore which three-note chords sound rough or smooth.',
    },
    'tuning-systems': {
      title: 'Tuning systems',
      intro: 'Compare how tuning systems place the twelve notes, on a spiral where one turn is one octave.',
    },
    'chord-comparison': {
      title: 'Chord comparison',
      intro: 'Play one chord in several tuning systems next to its pure chord, and see how far each note is off pure.',
    },
    'just-intonation-lattice': {
      title: 'Just-intonation lattice',
      intro: 'Build chords on a lattice of pure ratios and watch the commas appear.',
    },
    'edo-explorer': {
      title: 'EDO explorer',
      intro: 'See how well each equal division of the octave approximates the pure intervals.',
    },
  } satisfies Record<LabId, { title: string; intro: string }>,

  shell: {
    labsHeading: 'Labs',
    settingsHeading: 'Settings',
    inspectorLabel: 'Inspector',
    controlsTab: 'Controls',
    mathTab: 'The math',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    keyboardLabel: 'Keyboard',
    visualPlaceholder: 'This Lab’s visual is on its way.',
    controlsPlaceholder: 'This Lab’s controls are on their way.',
    documentTitle: (page: string) => `${page} · Intonation`,
  },

  settings: {
    tuningSystem: {
      label: 'Tuning system',
      names: TUNING_SYSTEM_NAMES,
      /** The menu entry for every N-EDO other than 12-EDO; N is chosen beside it. */
      otherEdo: 'N-EDO',
      /** A tuning system's name: "31-EDO" for an N-EDO, else its menu name (or short name). */
      name(system: TuningSystemId, length: 'full' | 'short' = 'full'): string {
        const n = stepEdo(system);
        if (n !== null) return `${n}-EDO`;
        // Every other system is 12-EDO or a chain, each with a name of its own.
        const named = system as NamedTuningSystemId;
        return (length === 'short' ? TUNING_SYSTEM_SHORT_NAMES : TUNING_SYSTEM_NAMES)[named];
      },
      /** The phone top-bar chip; the Tonic is left out for EDOs. */
      chip: (system: string, tonic: string | null) => (tonic ? `${system} in ${tonic}` : system),
    },
    edoSteps: {
      label: 'Steps per octave',
      hint: 'N equal steps; A4 is always one of them.',
    },
    tonic: {
      label: 'Tonic',
      hint: 'The note the tuning system is built from.',
    },
    referencePitch: {
      label: 'Reference pitch (A4)',
      custom: 'Custom…',
      customLabel: 'Custom Reference pitch in Hz',
      range: (min: number, max: number) => `${min}–${max} Hz`,
      option: (hz: number) => `${hz} Hz`,
      chip: (hz: string) => `A4 ${hz} Hz`,
    },
    timbre: {
      label: 'Timbre',
      presets: TIMBRE_PRESET_NAMES,
      /** The one Custom Timbre, named after the preset it was made from. */
      custom: (from: TimbrePresetId) => `Custom (from ${TIMBRE_PRESET_NAMES[from].toLowerCase()})`,
    },
    brightness: {
      label: 'Brightness',
      dark: 'Dark',
      bright: 'Bright',
    },
    volume: {
      label: 'Volume',
      value: (percent: number) => `${percent}%`,
    },
  },

  math: {
    empty: 'Play a note on the keyboard to see its frequency worked out.',
    sourcesHeading: 'Sources',
    note: {
      heading: 'The note you played',
      body: (note: string) =>
        `In 12-EDO every semitone multiplies the frequency by the twelfth root of 2. ${note} is n semitones from A4, which sounds at the Reference pitch.`,
      semitones: (note: string, n: number) =>
        n === 0
          ? `${note} is A4 itself, so n = 0.`
          : `${note} is ${Math.abs(n)} semitone${Math.abs(n) === 1 ? '' : 's'} ${n > 0 ? 'above' : 'below'} A4, so n = ${n < 0 ? '−' : ''}${Math.abs(n)}.`,
    },
    key: {
      heading: (spelling: string) => `How ${spelling} is built`,
      tonic: (spelling: string, system: string) =>
        `${spelling} is the Tonic: ${system} builds every other key from it.`,
      fifths: (spelling: string, fifths: number, tonic: string) =>
        `${spelling} is ${Math.abs(fifths)} fifth${Math.abs(fifths) === 1 ? '' : 's'} ${fifths > 0 ? 'above' : 'below'} the Tonic ${tonic}; with pure fifths (3/2) it would be the Pythagorean ratio rₚ, cₚ cents.`,
      pure: 'All of those fifths are pure, so rₚ is its exact ratio.',
      wholeCommas: (n: number, comma: string) =>
        n > 0
          ? `They are narrowed by ${n} ${comma} comma${n === 1 ? '' : 's'} κ in total, which turns rₚ into a pure 5-limit ratio.`
          : `Going down, fifths narrowed by ${-n} ${comma} comma${n === -1 ? '' : 's'} κ in total raise rₚ into a pure 5-limit ratio (n = −${-n}).`,
      fraction: (direction: 'lower' | 'higher', comma: string) =>
        `Those fifths are narrowed by a fraction f of the ${comma} comma κ in total, so the key sits f·κ ${direction} and has no exact ratio.`,
    },
    commas: {
      pythagorean: 'Pythagorean',
      syntonic: 'syntonic',
    } satisfies Record<CommaId, string>,
    edoStep: {
      body: (step: string, n: number) =>
        `${n}-EDO splits the octave into ${n} equal steps. ${capitalise(step)} sits s steps above step 0, the step nearest C.`,
    },
    edoFrequency: {
      body: (n: number, stepOfA: string) =>
        `A4 is ${stepOfA} and sounds at the Reference pitch. Each step multiplies the frequency by the ${ordinal(n)} root of 2, so a note k steps from A4 sounds at:`,
      steps: (note: string, k: number) =>
        k === 0
          ? `${capitalise(note)} is A4 itself, so k = 0.`
          : `${capitalise(note)} is ${stepCount(k)} ${k > 0 ? 'above' : 'below'} A4, so k = ${k < 0 ? '−' : ''}${Math.abs(k)}.`,
    },
    frequency: {
      heading: 'Its frequency',
      body: (name: string) =>
        `${name} sits c cents from A4 in this tuning system, and A4 sounds at the Reference pitch.`,
    },
    vallotti: {
      heading: 'Which Vallotti?',
      body: 'This is the modern standard Vallotti: F–C–G–D–A–E–B each narrowed by 1/6 Pythagorean comma, the other fifths pure. Vallotti’s own version probably used 1/6 syntonic comma instead, with a schisma left on B♭–F; the two never differ by more than about 2¢.',
    },
    referencePitch: {
      heading: 'Reference pitch',
      body: 'Every pitch on the site is calculated from the frequency given to A4. Standard pitch is 440 Hz; many Baroque ensembles play at 415 Hz, roughly a semitone lower.',
    },
    sources: {
      iso16: 'ISO 16:1975, Acoustics — Standard tuning frequency (standard musical pitch).',
      barbour: 'J. Murray Barbour, Tuning and Temperament: A Historical Survey (1951).',
      fourier: 'Joseph Fourier, Théorie analytique de la chaleur (1822).',
      helmholtz:
        'Hermann von Helmholtz, On the Sensations of Tone, trans. Alexander J. Ellis, 2nd ed. (1885).',
      scala: 'Huygens-Fokker Foundation, Scala scale archive (pyth_12, meanquar, werck3, vallotti, kirnberger).',
      aron: 'Pietro Aron, Toscanello in musica (Venice, 1523).',
      werckmeister: 'Andreas Werckmeister, Musicalische Temperatur (Frankfurt & Leipzig, 1691).',
      vallotti:
        'Francescantonio Vallotti, Della scienza teorica e pratica della moderna musica (Padua, 1779); attribution after Barbieri (1987).',
      kirnberger:
        'J. P. Kirnberger, letter to J. N. Forkel (c. 1779), printed by H. Bellermann in Allgemeine Musikalische Zeitung 6 (1871).',
      fiveLimit: 'David Wright, Mathematics and Music (2009), pp. 140–141: the asymmetric 5-limit scale.',
      euler: 'Leonhard Euler, Tentamen novae theoriae musicae (St Petersburg, 1739): the first lattice of fifths and thirds.',
      longuetHiggins:
        'H. C. Longuet-Higgins, “Letter to a Musical Friend”, The Music Review 23 (1962): notes as points 3^a · 5^b.',
      mandelbaum:
        'M. Joel Mandelbaum, Multiple Division of the Octave and the Tonal Resources of 19-Tone Temperament (PhD dissertation, Indiana University, 1961).',
      plompLevelt:
        'R. Plomp & W. J. M. Levelt, “Tonal consonance and critical bandwidth”, J. Acoust. Soc. Am. 38, 548–560 (1965).',
      sethares:
        'W. A. Sethares, “Local consonance and the relationship between timbre and scale”, J. Acoust. Soc. Am. 94(3), 1218–1228 (1993).',
      setharesTtss:
        'W. A. Sethares, Tuning, Timbre, Spectrum, Scale, 2nd ed. (Springer, 2005), §6.8 and Appendix E; constants from his dissmeasure.m.',
    },
  },

  chords: {
    types: CHORD_TYPE_NAMES,
    /** The Root picker's familiar names (decision #9). */
    roots: ['C', 'C♯/D♭', 'D', 'E♭', 'E', 'F', 'F♯/G♭', 'G', 'A♭', 'A', 'B♭', 'B'],
    inversions: ['Root position', '1st inversion', '2nd inversion', '3rd inversion'],
    /** "A♭ major", "C dominant 7th". */
    name: (root: string, type: ChordType) => `${root} ${CHORD_TYPE_NAMES[type].toLowerCase()}`,
    intervals: INTERVAL_NAMES,
    /** A note's part in the chord, for naming pairs of notes: "root–third". */
    roles: {
      unison: 'root',
      'major-second': 'second',
      'minor-third': 'third',
      'major-third': 'third',
      fourth: 'fourth',
      'diminished-fifth': 'fifth',
      'septimal-tritone': 'fifth',
      fifth: 'fifth',
      'augmented-fifth': 'fifth',
      'harmonic-seventh': 'seventh',
      'minor-seventh': 'seventh',
      'major-seventh': 'seventh',
    } satisfies Record<ChordIntervalId, string>,
  },

  chordButtons: {
    label: 'Chords',
    hint: 'Chords on the Tonic and its neighbours, in the current tuning system',
    /** "Am" for a minor chord, "A♭" for a major one. */
    short: (root: string, type: 'major' | 'minor') => (type === 'minor' ? `${root}m` : root),
    play: (name: string) => `Play ${name}`,
  },

  chordComparison: {
    rootLabel: 'Root',
    typeLabel: 'Chord',
    inversionLabel: 'Inversion',
    pureLabel: 'Pure chord',
    pureOption: (name: string, proportion: string) => `${name} ${proportion}`,
    fiveLimit: '5-limit',
    /** The alternative pure chords (decision #7): dominant 7th and diminished only. */
    alternativeName: (type: ChordType) => (type === 'diminished' ? 'Septimal' : 'Harmonic 7th'),
    systemsHeading: 'Tuning systems',
    systemLabel: (i: number) => `Compared system ${i}`,
    stepsLabel: (i: number) => `Steps per octave, compared system ${i}`,
    remove: (system: string) => `Remove ${system}`,
    add: 'Add a tuning system',
    maxSystems: (n: number) => `Up to ${n} tuning systems, beside the pure chord.`,
    tonicNote: (tonic: string) => `12-note systems are built from the Tonic, ${tonic}, set under Settings.`,
    playAll: 'Play all in turn',
    stop: 'Stop',
    play: (column: string) => `Play ${column}`,
    pureHeading: 'Pure chord',
    /** A column's heading: "¼-comma meantone in C"; EDOs have no Tonic. */
    systemHeading: (system: string, tonic: string | null) => (tonic ? `${system} in ${tonic}` : system),
    notesLabel: (column: string) => `Notes of the chord in ${column}, highest first`,
    centsOff: 'Cents off pure',
    /** An N-EDO note in a column, short: "step 10". */
    step: (step: number) => `step ${step}`,
    beatsHeading: 'Beats',
    pair: (lower: string, upper: string) => `${lower}–${upper}`,
    noBeat: 'no beats',
    /** Δf in Hz, or a slow swell's period. */
    swell: (seconds: string) => `slow swell, every ${seconds} s`,
    harmonics: (i: number, j: number) => `harmonics ${i} and ${j}`,
    sineHint:
      'A sine has no harmonics to beat, so hardly any beats show. Choose another Timbre under Settings to see them.',
    remarks: {
      borrowed: (key: string, as: string) => `Uses ${key} as ${as}.`,
      mapping: (n: number, interval: string, nearest: number, builtFrom: string[]) =>
        `${n}-EDO’s closest ${interval} (${stepCount(nearest)}) doesn’t fit its ${listAnd(builtFrom)}.`,
      noStep: (n: number, interval: string, mapsTo: 'unison' | 'octave') =>
        `${n}-EDO has no step for the ${interval}; it maps to the ${mapsTo}.`,
    },
  },

  chordComparisonMath: {
    pure: {
      heading: 'The pure chord',
      body: (chord: string, proportion: string, system: string) =>
        `${chord} as a pure chord is ${proportion}. Each pure note is the root’s frequency times its ratio. The root is the one ${system} plays, so the root itself is always pure.`,
    },
    centsOff: {
      heading: 'Cents off pure',
      body: (note: string, system: string) =>
        `How far a note is from its pure target, in cents. Here ${note} in ${system}, the note furthest from pure.`,
    },
    beats: {
      heading: 'Beat rate',
      body: (pair: string, system: string, i: number, j: number) =>
        `Two notes beat where one note’s harmonic nearly meets the other’s: harmonic i of the lower against harmonic j of the upper. Here the ${pair} in ${system}, harmonics ${i} and ${j}. Up to 20 Hz this is heard as beats; faster, as roughness.`,
      none: (system: string) =>
        `Two notes beat where one note’s harmonic nearly meets the other’s, up to 20 Hz apart. In ${system} with this Timbre no pair of harmonics 1–8 comes that close, so nothing beats.`,
    },
    mapping: {
      heading: 'The EDO mapping',
      body: (n: number) =>
        `${n}-EDO plays chords from its mapping: its nearest step to the pure fifth, major third and harmonic seventh, with every other interval built from those. Its fifth:`,
    },
    tonic: {
      heading: 'Tonic, not Root',
      body: 'A 12-note tuning system tunes its keys from its Tonic and never retunes them for the chord. A chord far from the Tonic can meet the wolf, as A♭ or F♯ major do in meantone on C.',
    },
  },

  edoExplorer: {
    /** The pure intervals the circle marks, by ratio. */
    targetNames: {
      '3/2': 'fifth',
      '5/4': 'major third',
      '6/5': 'minor third',
      '7/4': 'harmonic seventh',
      '11/8': 'eleventh harmonic',
    } as Record<string, string>,
    circleLabel: (n: number) =>
      `Circle of ${n} steps, with the pure intervals 3/2, 5/4, 6/5, 7/4 and 11/8 marked at their nearest steps`,
    circleKey: 'Ring: the pure interval. Dot: the nearest step.',
    stepSize: (cents: string) => `1 step = ${cents}`,
    /** A mark on the circle: "3/2 −5.2¢". */
    markLabel: (ratio: string, error: string) => `${ratio} ${error}`,
    tableCaption: (edo: string) => `Nearest steps in ${edo}`,
    columns: { interval: 'Pure interval', pure: 'Pure', step: 'Step', size: 'Step size', error: 'Error' },
    chartLabel:
      'Error chart: the largest error among 3/2, 5/4 and 6/5 for every N from 5 to 72; 12, 19, 31 and 53 dip lowest',
    chartHeading: 'Error across every N',
    chartCaption: 'Largest error among 3/2, 5/4 and 6/5. Click a bar to explore that N.',
    chartBar: (n: number, error: string, interval: string) => `${n}-EDO: ${error} (${interval})`,
    nLabel: 'Equal divisions, N',
    nHint: 'From 5 to 72. N sets the tuning system, so the keyboard plays it too.',
    standoutsLabel: 'Standouts',
    standout: (n: number) => `${n}-EDO`,
    notEdo: (system: string) =>
      `The keyboard plays ${system}. Choose N to explore an EDO and play it on the keyboard.`,
    playHeading: 'Play',
    playScale: (n: number) => `Play the scale (${n} steps)`,
    stop: 'Stop',
    chordsLabel: 'Chords on step 0, from the EDO mapping',
    /** A chord row: its steps above step 0, "0 · 10 · 18". */
    chordSteps: (steps: readonly number[]) => steps.join(' · '),
    playChord: (chord: string, steps: string) => `Play ${chord} (steps ${steps})`,
  },

  edoExplorerMath: {
    nearest: {
      heading: 'The nearest step',
      body: (edo: string, interval: string) =>
        `${edo} splits the octave into N equal steps. The step nearest the pure ${interval} r is N·log₂ r, rounded:`,
    },
    error: {
      heading: 'Its error',
      body: 'The error is the step’s size minus the pure interval’s, in cents: positive when the step is wide, negative when it is narrow.',
    },
    chart: {
      heading: 'The error chart',
      body: (edo: string, interval: string) =>
        `Each bar is an EDO’s largest error among the 5-limit intervals 3/2, 5/4 and 6/5. For ${edo} it is the ${interval}. 7/4 and 11/8 are left out: they would bury 12-EDO, whose seventh and eleventh are poor.`,
    },
    mapping: {
      heading: 'Chords use the EDO mapping',
      body: (edo: string) =>
        `Chords are built from ${edo}’s nearest steps to 3/2, 5/4 and 7/4, so each chord’s intervals fit together. Its minor third is its fifth minus its major third:`,
    },
  },

  soundWaves: {
    harmonicsHeading: 'Harmonics',
    columns: { harmonic: 'n', level: 'Level', mute: 'Mute' },
    harmonicLevel: (n: number) => `Harmonic ${n} level`,
    mute: (n: number) => `Mute harmonic ${n}`,
    level: (percent: number) => `${percent}%`,
    multiple: (n: number) => `${n}×`,
    editingPreset: (preset: string) =>
      `${preset} as heard. Move any slider or mute to make it your Custom Timbre, shared with every Lab.`,
    editingCustom: (label: string) =>
      `${label}: your Custom Timbre, used in every Lab. It lives in the page address, so a link shares it.`,
    reset: 'Reset to preset',
    barsLabel: 'Harmonic levels',
    waveformLabel: 'Waveform: two periods of the sum of the harmonics',
    waveformCaption: 'Two periods, scaled to fit',
    silent: 'Every harmonic is at zero or muted, so there is no wave to draw.',
  },

  soundWavesMath: {
    sum: {
      heading: 'The Fourier sum',
      body: 'The waveform is the sum of the sounding harmonics: sine waves at 1, 2, 3 … times the fundamental frequency f, each with the amplitude set on its slider. Muted and zero harmonics drop out.',
      peak: 'The result is the tallest point of the waveform drawn on screen.',
    },
    loudness: {
      heading: 'Loudness',
      body: 'Every Timbre plays at the same loudness: before it sounds, its amplitudes are scaled so the wave’s root-mean-square (RMS) level matches every other Timbre. This is that RMS before scaling.',
    },
    phase: {
      heading: 'Phase',
      body: 'Every harmonic starts in sine phase, with no phase shift. Shifting a harmonic’s phase would change the picture of the waveform but not what you hear: the ear follows the strengths of the harmonics, not how their peaks line up.',
    },
  },

  scene3d: {
    unavailable: 'This view needs 3D graphics, which this browser can’t show.',
    resetView: 'Reset view',
    resetViewShort: 'Reset view',
    hint: 'Drag to rotate · scroll or pinch to zoom',
  },

  tuningSystemsLab: {
    sceneLabel: 'Pitch spiral',
    legendLabel: 'Systems compared',
    systemsHeading: 'Systems compared',
    slot: (k: number) => `System ${k}`,
    edoSteps: (k: number) => `Steps per octave, system ${k}`,
    add: 'Add a tuning system',
    remove: (name: string) => `Remove ${name}`,
    tonicHint: 'Every system on the spiral is built from this Tonic.',
    pickHint: 'Click a note on the spiral or in a table to hear it, then a second note for the interval.',
    tablesLabel: 'Every note of each system',
    columns: { note: 'Note', cents: 'Cents', ratio: 'Ratio', fromEdo12: 'From 12-EDO' },
    noRatio: '—',
    pureTarget: (ratio: string) => `pure ${ratio}`,
    pureTargetKey: 'Pure target of the interval',
    picked: (note: string) => `${note}. Pick a second note for the interval.`,
    pickedNote: (note: string, system: string) => `${note} (${system})`,
    interval: (low: string, high: string, size: string, pure: string, target: string, off: string | null) =>
      `${low} → ${high}: ${size}. The pure ${pure} is ${target}, so this is ${off === null ? 'pure' : off}.`,
    offPure: (cents: string, wide: boolean) => `${cents} ${wide ? 'wide' : 'narrow'}`,
  },

  tuningSystemsMath: {
    fromEdo12: {
      heading: 'Cents from 12-EDO',
      body: (note: string) =>
        `${note} sits c cents above the Tonic. The nearest 12-EDO note is k semitones above the Tonic, at 100·k cents, so the difference is:`,
    },
    ratio: {
      heading: 'From ratio to cents',
      body: (note: string) =>
        `${note} is an exact ratio r above the Tonic. Cents measure it on a scale where every octave is 1200¢:`,
    },
    interval: {
      heading: 'The interval',
      body: 'The interval between the two notes is the difference of their cents. It aims at the nearest 5-limit pure interval, the ink ring on the spiral; the gap is how far it is off pure:',
    },
    spiral: {
      heading: 'One turn per octave',
      body: 'Each note sits at an angle around the spiral in proportion to its cents above the Tonic, which is at the front; going up an octave makes one full turn and one step up.',
      empty: 'Pick a note to see where it sits.',
    },
  },

  latticeLab: {
    sceneLabel: 'Lattice of pure ratios',
    legendLabel: 'Key',
    legend: {
      shape: 'Chord shape',
      three: '×3 fifths',
      five: '×5 major thirds',
      seven: '×7 harmonic sevenths',
    },
    axes: { three: '×3 fifths →', five: '×5 major thirds ↗', seven: '×7 harmonic sevenths' },
    hint: 'Click nodes on the lattice to build a chord and hear it; click a note again to take it out.',
    nodeLabel: (name: string, ratio: string) => `${name} ${ratio}`,
    limit: {
      legend: 'Directions',
      five: '×3 and ×5 (5-limit)',
      seven: '×3, ×5 and ×7 (7-limit)',
      hint: 'The 7-limit turns the lattice to show a third direction: ×7, the harmonic seventh.',
    },
    chordHeading: 'Chord',
    chordLabel: 'Chord notes',
    chordEmpty: 'No notes yet: click nodes on the lattice, or add one below.',
    remove: (note: string) => `Remove ${note}`,
    add: 'Add a note',
    addPlaceholder: 'Choose a note…',
    play: 'Play chord',
    clear: 'Clear chord',
    tonicHint: 'The lattice is built from this Tonic: 1/1 is the Tonic itself.',
    readout: {
      empty: 'Click nodes on the lattice to build a chord.',
      chord: (names: string, ratios: string, proportion: string | null) =>
        proportion === null ? `${names}: ${ratios}` : `${names}: ${ratios} = ${proportion}`,
    },
    mode: { legend: 'Explore', chord: 'Build a chord', pump: 'Comma pump' },
    pump: {
      hint: 'Step through pure chords, each keeping the note it shares with the chord before, and see where home ends up.',
      select: 'Progression',
      names: {
        syntonic: 'Syntonic comma',
        pythagorean: 'Pythagorean comma',
        'lesser-diesis': 'Lesser diesis',
        'greater-diesis': 'Greater diesis',
        septimal: 'Septimal comma',
      } satisfies Record<CommaPumpId, string>,
      /** "C–Am–Dm–G–C: home comes back 21.5¢ flat (80/81)." */
      description: (chords: string, size: string, sharp: boolean, comma: string) =>
        `${chords}: home comes back ${size} ${sharp ? 'sharp' : 'flat'} (${comma}).`,
      /** Chord symbols: "C", "Am", "G7". */
      symbol: (root: string, type: ChordType) =>
        `${root}${({ minor: 'm', 'dominant-7th': '7' } as Partial<Record<ChordType, string>>)[type] ?? ''}`,
      next: 'Next chord',
      play: 'Play to home',
      stop: 'Stop',
      reset: 'Reset',
      drone: 'Drone on 1/1',
      droneHint: 'Holds the starting note at its original pitch, so you can hear the drift against it.',
      maxed: (loops: number) => `That’s ${loops} loops: Reset to start again.`,
      legend: { path: 'Path of the roots', chord: 'Current chord' },
      readout: {
        position: (index: number, total: number, home: boolean) =>
          index === 0 && home ? 'Home' : `Chord ${index + 1} of ${total}`,
        chord: (symbol: string, notes: string, held: string | null) =>
          `${symbol}: ${notes}${held === null ? '' : `, keeping ${held}`}`,
        notHome: 'Not home yet: step to the end of the loop.',
        drift: (loops: number, cents: string) => `After ${loops} loop${loops === 1 ? '' : 's'}: ${cents}`,
      },
    },
  },

  latticeMath: {
    factors: {
      heading: (ratio: string) => `Prime factors of ${ratio}`,
      emptyHeading: 'Prime factors',
      body: (note: string) =>
        `Every pure ratio is a product of primes. ${note}’s powers of 3, 5 and 7 are its place on the lattice (a, b, c); the power of 2 only moves it by octaves.`,
    },
    cents: {
      heading: 'Its size in cents',
      body: (note: string) => `${note} is the ratio r above the Tonic; on a scale of 1200¢ to the octave:`,
    },
    frequency: {
      heading: 'Its frequency',
      body: (tonic: string) =>
        `The Tonic ${tonic} sounds at its 12-EDO pitch from the Reference pitch; every node multiplies it by its ratio r:`,
    },
    chord: {
      heading: 'The chord in whole numbers',
      body: 'Bring the ratios to a common denominator and the chord becomes a row of whole numbers: the harmonics of one low note. Small numbers ring smoothly.',
    },
    lattice: {
      heading: 'Why a lattice',
      body: 'Each step right multiplies by 3 (a pure fifth), each step up-right by 5 (a pure major third), each step along ×7 by 7 (a harmonic seventh), with octaves folded away. Two routes to the same letter name can land on different nodes: the gap between them is a comma.',
    },
    empty: 'Add a note to the chord to see its prime factors.',
    pump: {
      start: {
        heading: 'The starting chord',
        body: (symbol: string, notes: string) =>
          `The pump starts on the pure ${symbol} chord on 1/1: ${notes}. Press Next chord to step on.`,
      },
      held: {
        heading: (note: string) => `Keeping ${note}`,
        body: (symbol: string, note: string, interval: string) =>
          `${symbol} keeps ${note} at its exact pitch from the chord before. In the pure chord ${note} is the ${interval} above the root, so the root r is ${note} divided by that interval (octaves ignored):`,
      },
      root: (symbol: string) => `${symbol}’s root`,
      comma: {
        heading: 'The comma',
        body: (chords: string, home: string, ratio: string) =>
          `One loop, ${chords}, comes home on ${home} at ${ratio} instead of 1/1. Its size:`,
      },
      drift: {
        heading: 'The drift so far',
        body: 'Every loop moves home by the same comma, so after k loops the drift is k times it:',
      },
      why: {
        heading: 'Why the pump drifts',
        body: 'Every chord is pure and every step keeps one note exactly, so nothing is ever out of tune. But the roots move by pure fifths, thirds and sevenths, and around the loop those steps multiply to a comma instead of whole octaves: home lands on a different node with the same letter name.',
      },
    },
  },

  beatsLab: {
    heading: 'Beats',
    sceneLabel: 'Interference ribbon',
    legendLabel: 'Ribbon key',
    legend: { tone1: 'Tone 1', tone2: 'Tone 2', sum: 'Sum', swell: 'In step' },
    lanes: { tone1: 'Tone 1', tone2: 'Tone 2', sum: 'Sum' },
    now: 'now',
    ago: (seconds: string) => `${seconds} s ago`,
    caption: (phone: boolean) =>
      `The last ${phone ? 'half second' : 'second'}. The waves are drawn slowed down so each cycle shows; the beats keep their real timing.`,
    rateLabel: 'Beat rate',
    rateUnit: 'beats per second',
    tones: (f1: string, f2: string, gapCents: string) =>
      `Tone 1: A4 at ${f1} · Tone 2: ${f2}, ${gapCents} higher`,
    unison: 'No beats: the tones are in unison.',
    countable: 'Count the swells: that many each second.',
    tooFast: 'Beats this fast are too fast to count: they blur into roughness.',
    play: 'Play the two tones',
    stop: 'Stop the two tones',
    playShort: 'Play',
    stopShort: 'Stop',
    gapLabel: 'Gap between the tones',
    gapHint: 'Tone 2 sits this far above tone 1 (A4, the Reference pitch).',
  },

  beatsMath: {
    rate: {
      heading: 'Beat rate',
      body: 'The two tones drift in and out of step. Each time tone 2 gains a whole cycle on tone 1 they line up and the sum swells, so it swells as many times a second as the frequencies differ:',
    },
    gap: {
      heading: 'The gap in cents',
      body: 'Tone 1 is A4 at the Reference pitch and tone 2 sits the gap above it. Measured as an interval, the gap is:',
    },
    swell: {
      heading: 'Why the sum swells',
      body: 'For sine waves, sin a + sin b = 2 cos((a − b)/2) · sin((a + b)/2): one tone at the average frequency whose loudness rises and falls. Its loud moments come once every T seconds:',
      unison: 'At a unison the tones never drift apart, so the sum holds steady.',
    },
    harmonics: {
      heading: 'Harmonics beat faster',
      body: 'Harmonic k of each tone sits at k times its frequency, so those harmonics are k times as far apart and beat k times as fast. The 2nd harmonics:',
    },
    roughness: {
      heading: 'Beats or roughness',
      body: 'Beats are easiest to follow at around 4 a second. Above about 15–20 a second they blur into roughness, a buzz rather than a wobble, and once the tones are about a critical band apart (roughly 100 Hz around A4) they sound as two separate, smooth notes.',
    },
  },

  /** The roughness landscape (issue #29). Say only "roughness" here (decision #15). */
  roughnessLab: {
    heading: 'Roughness',
    intro: 'See how rough every three-note chord sounds: smooth chords sit in the valleys.',
    sceneLabel: 'Roughness landscape',
    legendLabel: 'Landscape key',
    legend: { pure: 'Pure chord', edo12: '12-EDO version', played: 'Last played' },
    axes: { lower: 'lower interval', upper: 'upper interval', height: 'roughness' },
    caption: (phone: boolean) =>
      `Height: relative roughness, 0–1, scaled for the current Timbre (the roughest chord shown is 1). ${
        phone ? 'Tap a pin to name it; tap anywhere to hear that chord.' : 'Click any point to hear that chord.'
      }`,
    /** "major 4:5:6", "dominant 7th 20:25:36 (no 5th)". */
    pinName: (type: string, proportion: string, withoutFifth: boolean) =>
      `${type} ${proportion}${withoutFifth ? ' (no 5th)' : ''}`,
    /** "12-EDO major". */
    edo12Name: (type: string) => `12-EDO ${type}`,
    play: (name: string) => `Play ${name}`,
    pointName: (lower: string, upper: string) => `${lower} + ${upper}`,
    readout: {
      empty: 'Play a chord to see how rough it is.',
      lower: 'Lower interval',
      upper: 'Upper interval',
      roughness: 'Relative roughness',
      on: (bottom: string, hz: string) => `on ${bottom} (${hz})`,
    },
    bottomLabel: 'Bottom note',
    bottomHint: 'Every chord on the landscape is built up from this note. Low chords are rougher.',
    showEdo12: 'Show 12-EDO versions',
    showEdo12Hint: 'Adds each chord as 12-EDO plays it, joined to its pure version.',
    pinsHeading: 'Chords on the landscape',
    pinsHint: 'Root position at pure tuning; the 7th chords leave out their fifth to fit three notes.',
    pinsRoughness: 'Relative roughness',
  },

  roughnessMath: {
    bottom: {
      heading: 'The bottom note',
      body: (bottom: string) =>
        `Every chord on the landscape stands on ${bottom}, calculated in 12-EDO from the Reference pitch:`,
    },
    pair: {
      heading: 'Two partials',
      body: (s: string, gap: string) =>
        `As two sine partials move apart, roughness rises, peaks and fades: Sethares’ fit to Plomp and Levelt’s listening data. The weaker partial sets the strength. x = s · Δf is their gap Δf scaled to the register by s = 0.24 / (0.0207 · f₁ + 18.96), f₁ the lower. For the bottom two fundamentals, s = ${s} and Δf = ${gap}:`,
    },
    chord: {
      heading: 'The whole chord',
      body: (chord: string, partials: number, pairs: number) =>
        `A chord’s roughness R adds d over every pair of its partials, all three notes pooled: for ${chord}, ${partials} partials make ${pairs} pairs. The landscape divides by its roughest chord, Rₘₐₓ, so heights run from 0 to 1:`,
    },
    ingredient: {
      heading: 'Roughness is one ingredient',
      body: 'Roughness is one ingredient of consonance, not the whole of it. How smooth a chord sounds also depends on harmonicity (how closely its partials fit one harmonic series) and on familiarity (what your ears are used to). This model measures neither, so read the landscape as roughness only.',
    },
  },

  notFound: {
    title: 'Page not found',
    body: 'There is no page at this address.',
    home: 'Go to the home page',
  },
} as const;

/**
 * Every user-facing string on the site, in one place so it can be translated later.
 * Vocabulary follows GLOSSARY.md.
 */
import {
  type CommaId,
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
  },

  notFound: {
    title: 'Page not found',
    body: 'There is no page at this address.',
    home: 'Go to the home page',
  },
} as const;

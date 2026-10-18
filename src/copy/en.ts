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

  notFound: {
    title: 'Page not found',
    body: 'There is no page at this address.',
    home: 'Go to the home page',
  },
} as const;

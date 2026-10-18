/**
 * Every user-facing string on the site, in one place so it can be translated later.
 * Vocabulary follows GLOSSARY.md.
 */
import type { CommaId, TimbrePresetId, TuningSystemId } from '../core';
import type { LabId } from '../labs/ids';

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
      names: {
        '12-edo': '12-EDO',
        pythagorean: 'Pythagorean',
        just: '5-limit just intonation',
        meantone: '¼-comma meantone',
        'werckmeister-iii': 'Werckmeister III',
        vallotti: 'Vallotti',
        'kirnberger-iii': 'Kirnberger III',
      } satisfies Record<TuningSystemId, string>,
      /** Shorter names for the phone top-bar chip. */
      shortNames: {
        '12-edo': '12-EDO',
        pythagorean: 'Pythagorean',
        just: '5-limit JI',
        meantone: 'Meantone',
        'werckmeister-iii': 'Werckmeister III',
        vallotti: 'Vallotti',
        'kirnberger-iii': 'Kirnberger III',
      } satisfies Record<TuningSystemId, string>,
      /** The phone top-bar chip; the Tonic is left out for EDOs. */
      chip: (system: string, tonic: string | null) => (tonic ? `${system} in ${tonic}` : system),
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
      presets: {
        sine: 'Sine',
        organ: 'Organ-like',
        string: 'String-like',
        brass: 'Brass-like',
        voice: 'Voice-like',
      } satisfies Record<TimbrePresetId, string>,
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

  notFound: {
    title: 'Page not found',
    body: 'There is no page at this address.',
    home: 'Go to the home page',
  },
} as const;

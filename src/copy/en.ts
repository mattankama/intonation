/**
 * Every user-facing string on the site, in one place so it can be translated later.
 * Vocabulary follows GLOSSARY.md.
 */
import type { TimbrePresetId } from '../core';
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
    tuningChip: '12-EDO',
    visualPlaceholder: 'This Lab’s visual is on its way.',
    controlsPlaceholder: 'This Lab’s controls are on their way.',
    documentTitle: (page: string) => `${page} · Intonation`,
  },

  settings: {
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
    referencePitch: {
      heading: 'Reference pitch',
      body: 'Every pitch on the site is calculated from the frequency given to A4. Standard pitch is 440 Hz; many Baroque ensembles play at 415 Hz, roughly a semitone lower.',
    },
    sources: {
      iso16: 'ISO 16:1975, Acoustics — Standard tuning frequency (standard musical pitch).',
      barbour: 'J. Murray Barbour, Tuning and Temperament: A Historical Survey (1951).',
    },
  },

  notFound: {
    title: 'Page not found',
    body: 'There is no page at this address.',
    home: 'Go to the home page',
  },
} as const;

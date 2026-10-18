/**
 * Every user-facing string on the site, in one place so it can be translated later.
 * Vocabulary follows GLOSSARY.md.
 */
import type { TimbrePresetId } from '../core';
import type { LabId } from '../labs/ids';

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

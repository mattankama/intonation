/**
 * Acoustics core: the pure, UI-free source of every number the site shows.
 * Import from here, never from the files behind it.
 */
export { type Ratio, ratio, ratioValue } from './ratio';
export { CENTS_PER_OCTAVE, cents } from './cents';
export { type Note, REFERENCE_NOTE, semitonesFromA4, edo12Frequency, edo12NoteName } from './pitch';
export {
  type TuningSystemId,
  TUNING_SYSTEM_IDS,
  isEdo,
  type Tuning,
  type ChainOfFifths,
  type ResolvedPitch,
  type KeyConstruction,
  type CommaId,
  centsAboveTonic,
  keySpelling,
  tonicSpelling,
  keyConstruction,
  commaRatio,
  noteName,
  chainOfFifths,
  resolvePitch,
} from './tuning';
export {
  type Harmonics,
  type TimbrePresetId,
  TIMBRE_PRESET_IDS,
  BRIGHTNESS_MIN,
  BRIGHTNESS_MAX,
  presetHarmonics,
  withBrightness,
  sumOfSquares,
  timbreRms,
  waveValue,
  wavePeak,
  type CustomTimbre,
  type TimbreChoice,
  HARMONIC_COUNT,
  LEVEL_MAX,
  isCustomTimbre,
  customTimbreFrom,
  customHarmonics,
  editHarmonic,
  timbreHarmonics,
} from './timbre';

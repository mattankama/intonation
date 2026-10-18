/**
 * Shared settings: the state every Lab shares, carried in the URL query string.
 *
 * Each setting is one entry in SETTING_FIELDS: its URL key, its default, and how to
 * parse and format it. A missing or invalid value falls back to the default, and a
 * default value is left out of the URL so links stay short.
 */

import {
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  TIMBRE_PRESET_IDS,
  type TimbrePresetId,
} from '../core';

export interface Settings {
  /** Frequency of A4 in Hz. */
  referencePitch: number;
  /** The shared Timbre preset. */
  timbre: TimbrePresetId;
  /** Brightness b in aₙ × n^b, −1 to +1 in steps of 0.1 (not applied to Sine). */
  brightness: number;
  /** Master volume, 0–100 %. */
  volume: number;
}

export const REFERENCE_PITCH_PRESETS = [415, 432, 440, 442] as const;
/** Bounds for a custom Reference pitch, wide enough for historical pitch standards. */
export const REFERENCE_PITCH_MIN = 380;
export const REFERENCE_PITCH_MAX = 500;

interface SettingField<K extends keyof Settings> {
  /** Query-string key. */
  key: string;
  defaultValue: Settings[K];
  /** Returns undefined for anything invalid. */
  parse(raw: string): Settings[K] | undefined;
  format(value: Settings[K]): string;
}

type SettingFields = { [K in keyof Settings]: SettingField<K> };

const DECIMAL = /^\d+(\.\d+)?$/;
const SIGNED_DECIMAL = /^-?\d+(\.\d+)?$/;
const WHOLE = /^\d+$/;

export const SETTING_FIELDS: SettingFields = {
  referencePitch: {
    key: 'ref',
    defaultValue: 440,
    parse(raw) {
      if (!DECIMAL.test(raw)) return undefined;
      const hz = Math.round(Number(raw) * 100) / 100;
      return hz >= REFERENCE_PITCH_MIN && hz <= REFERENCE_PITCH_MAX ? hz : undefined;
    },
    format: (hz) => String(hz),
  },
  timbre: {
    key: 'timbre',
    defaultValue: 'sine',
    parse: (raw) => TIMBRE_PRESET_IDS.find((id) => id === raw),
    format: (id) => id,
  },
  brightness: {
    key: 'bright',
    defaultValue: 0,
    parse(raw) {
      if (!SIGNED_DECIMAL.test(raw)) return undefined;
      const b = Math.round(Number(raw) * 10) / 10;
      return b >= BRIGHTNESS_MIN && b <= BRIGHTNESS_MAX ? b + 0 : undefined;
    },
    format: (b) => String(b),
  },
  volume: {
    key: 'vol',
    defaultValue: 80,
    parse(raw) {
      if (!WHOLE.test(raw)) return undefined;
      const v = Number(raw);
      return v <= 100 ? v : undefined;
    },
    format: (v) => String(v),
  },
};

const FIELD_NAMES = Object.keys(SETTING_FIELDS) as (keyof Settings)[];

export const DEFAULT_SETTINGS: Settings = Object.fromEntries(
  FIELD_NAMES.map((name) => [name, SETTING_FIELDS[name].defaultValue]),
) as unknown as Settings;

function assign<K extends keyof Settings>(settings: Settings, name: K, value: Settings[K] | undefined) {
  if (value !== undefined) settings[name] = value;
}

export function readSettings(params: URLSearchParams): Settings {
  const settings = { ...DEFAULT_SETTINGS };
  for (const name of FIELD_NAMES) {
    const field = SETTING_FIELDS[name];
    const raw = params.get(field.key);
    if (raw !== null) assign(settings, name, field.parse(raw));
  }
  return settings;
}

function write<K extends keyof Settings>(params: URLSearchParams, name: K, value: Settings[K]) {
  const field: SettingField<K> = SETTING_FIELDS[name];
  if (value === field.defaultValue) params.delete(field.key);
  else params.set(field.key, field.format(value));
}

/** Returns a copy of params with the settings written in; other parameters are kept. */
export function writeSettings(params: URLSearchParams, settings: Settings): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const name of FIELD_NAMES) write(next, name, settings[name]);
  return next;
}

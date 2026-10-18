/**
 * Shared settings: the state every Lab shares, carried in the URL query string.
 *
 * Each setting is one entry in SETTING_FIELDS: its URL key, its default, and how to
 * parse and format it. A missing or invalid value falls back to the default, and a
 * default value is left out of the URL so links stay short.
 */

export interface Settings {
  /** Frequency of A4 in Hz. */
  referencePitch: number;
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
};

const FIELD_NAMES = Object.keys(SETTING_FIELDS) as (keyof Settings)[];

export const DEFAULT_SETTINGS: Settings = Object.fromEntries(
  FIELD_NAMES.map((name) => [name, SETTING_FIELDS[name].defaultValue]),
) as unknown as Settings;

export function readSettings(params: URLSearchParams): Settings {
  const settings = { ...DEFAULT_SETTINGS };
  for (const name of FIELD_NAMES) {
    const field = SETTING_FIELDS[name];
    const raw = params.get(field.key);
    const value = raw === null ? undefined : field.parse(raw);
    if (value !== undefined) settings[name] = value;
  }
  return settings;
}

/** Returns a copy of params with the settings written in; other parameters are kept. */
export function writeSettings(params: URLSearchParams, settings: Settings): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const name of FIELD_NAMES) {
    const field = SETTING_FIELDS[name];
    const value = settings[name];
    if (value === field.defaultValue) next.delete(field.key);
    else next.set(field.key, field.format(value));
  }
  return next;
}

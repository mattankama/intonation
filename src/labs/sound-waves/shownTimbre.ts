import { type CustomTimbre, customTimbreFrom, isCustomTimbre } from '../../core';
import type { Settings } from '../../state/settings';

/**
 * What the harmonic bars and sliders show: the Custom Timbre itself, or the selected
 * preset as heard (brightness included) in the same 1 % levels it would start from.
 */
export function shownTimbre({ timbre, brightness }: Settings): CustomTimbre {
  return isCustomTimbre(timbre) ? timbre : customTimbreFrom(timbre, brightness);
}

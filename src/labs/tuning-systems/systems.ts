/**
 * The Tuning systems Lab's own URL state: the systems compared, in colour order.
 * `?systems=12-edo,meantone` (comma-separated ids, 1 to 4); the default is left out.
 */
import { type TuningSystemId, parseTuningSystem } from '../../core';

export const SYSTEMS_KEY = 'systems';
export const MAX_SYSTEMS = 4;

export const DEFAULT_SYSTEMS: readonly TuningSystemId[] = ['12-edo', 'meantone', 'pythagorean', 'just'];

/** The compared systems: valid, distinct, at most four; the default when none is valid. */
export function readSystems(params: URLSearchParams): readonly TuningSystemId[] {
  const systems: TuningSystemId[] = [];
  for (const raw of (params.get(SYSTEMS_KEY) ?? '').split(',')) {
    const system = parseTuningSystem(raw);
    if (system && !systems.includes(system) && systems.length < MAX_SYSTEMS) systems.push(system);
  }
  return systems.length > 0 ? systems : DEFAULT_SYSTEMS;
}

const isDefault = (systems: readonly TuningSystemId[]) =>
  systems.length === DEFAULT_SYSTEMS.length && systems.every((s, i) => s === DEFAULT_SYSTEMS[i]);

/** A copy of params with the systems written in; other parameters are kept. */
export function writeSystems(
  params: URLSearchParams,
  systems: readonly TuningSystemId[],
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (isDefault(systems)) next.delete(SYSTEMS_KEY);
  else next.set(SYSTEMS_KEY, systems.join(','));
  return next;
}

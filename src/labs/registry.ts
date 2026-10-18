/**
 * The Lab registry: one entry per Lab, in the fixed order. The home page, the left
 * rail, the phone menu and the router all read from here.
 *
 * To fill in a Lab, give its entry any of Visual / Controls / Math. The shell shows a
 * placeholder for each one that is missing.
 */
import type { ComponentType } from 'react';
import { copy } from '../copy/en';
import type { Settings } from '../state/settings';
import { beatsAndRoughnessLab } from './beats-and-roughness';
import { LAB_IDS, type LabId } from './ids';
import { soundWavesLab } from './sound-waves';
import { tuningSystemsLab } from './tuning-systems';

export interface LabProps {
  settings: Settings;
}

export interface LabDefinition {
  id: LabId;
  path: string;
  title: string;
  intro: string;
  /** Centre visual area. */
  Visual?: ComponentType<LabProps>;
  /** Inspector "Controls" tab. */
  Controls?: ComponentType<LabProps>;
  /** Lab-specific sections of the inspector's "The math" tab. */
  Math?: ComponentType<LabProps>;
  /** References listed at the end of The math (from copy). */
  sources?: readonly string[];
}

type LabParts = Pick<LabDefinition, 'Visual' | 'Controls' | 'Math' | 'sources'>;

/** Each Lab's own parts, added as Labs are built (e.g. 'sound-waves': soundWavesLab). */
const components: Partial<Record<LabId, LabParts>> = {
  'sound-waves': soundWavesLab,
  'beats-and-roughness': beatsAndRoughnessLab,
  'tuning-systems': tuningSystemsLab,
};

export const LABS: readonly LabDefinition[] = LAB_IDS.map((id) => ({
  id,
  path: `/${id}`,
  ...copy.labs[id],
  ...components[id],
}));

export function findLabByPath(pathname: string): LabDefinition | undefined {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return LABS.find((lab) => lab.path === trimmed);
}

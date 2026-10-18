import type { LabDefinition } from '../registry';
import {
  BEATS_AND_ROUGHNESS_SOURCES,
  BeatsAndRoughnessControls,
  BeatsAndRoughnessMath,
  BeatsAndRoughnessVisual,
} from './BeatsAndRoughness';

/** Beats & roughness: two tones beating on a 3D interference ribbon (issue #28). */
export const beatsAndRoughnessLab: Pick<LabDefinition, 'Visual' | 'Controls' | 'Math' | 'sources'> = {
  Visual: BeatsAndRoughnessVisual,
  Controls: BeatsAndRoughnessControls,
  Math: BeatsAndRoughnessMath,
  sources: BEATS_AND_ROUGHNESS_SOURCES,
};

import type { LabDefinition } from '../registry';
import { TuningSystemsControls } from './TuningSystemsControls';
import { TUNING_SYSTEMS_SOURCES, TuningSystemsMath } from './TuningSystemsMath';
import { TuningSystemsVisual } from './TuningSystemsVisual';

/** Tuning systems: up to four systems on a 3D pitch spiral, with every note in a table (issue #26). */
export const tuningSystemsLab: Pick<LabDefinition, 'Visual' | 'Controls' | 'Math' | 'sources'> = {
  Visual: TuningSystemsVisual,
  Controls: TuningSystemsControls,
  Math: TuningSystemsMath,
  sources: TUNING_SYSTEMS_SOURCES,
};

import type { LabDefinition } from '../registry';
import { LatticeControls } from './LatticeControls';
import { LATTICE_SOURCES, LatticeMath } from './LatticeMath';
import { LatticeVisual } from './LatticeVisual';

/** Just-intonation lattice: build chords as shapes on a 3D lattice of pure ratios (issue #30). */
export const latticeLab: Pick<LabDefinition, 'Visual' | 'Controls' | 'Math' | 'sources'> = {
  Visual: LatticeVisual,
  Controls: LatticeControls,
  Math: LatticeMath,
  sources: LATTICE_SOURCES,
};

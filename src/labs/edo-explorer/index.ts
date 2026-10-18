import type { LabDefinition } from '../registry';
import { EdoExplorerControls } from './EdoExplorerControls';
import { EDO_EXPLORER_SOURCES, EdoExplorerMath } from './EdoExplorerMath';
import { EdoExplorerVisual } from './EdoExplorerVisual';

/** EDO explorer: how well each N-EDO from 5 to 72 approximates the pure intervals (issue #27). */
export const edoExplorerLab: Pick<LabDefinition, 'Visual' | 'Controls' | 'Math' | 'sources'> = {
  Visual: EdoExplorerVisual,
  Controls: EdoExplorerControls,
  Math: EdoExplorerMath,
  sources: EDO_EXPLORER_SOURCES,
};

import type { LabDefinition } from '../registry';
import { ChordComparisonControls } from './ChordComparisonControls';
import { CHORD_COMPARISON_SOURCES, ChordComparisonMath } from './ChordComparisonMath';
import { ChordComparisonVisual } from './ChordComparisonVisual';

/** Chord comparison: one chord in up to four tuning systems beside its pure chord (issue #25). */
export const chordComparisonLab: Pick<LabDefinition, 'Visual' | 'Controls' | 'Math' | 'sources'> = {
  Visual: ChordComparisonVisual,
  Controls: ChordComparisonControls,
  Math: ChordComparisonMath,
  sources: CHORD_COMPARISON_SOURCES,
};

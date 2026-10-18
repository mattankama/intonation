/**
 * The Beats & roughness Lab's parts. Each topic is a section of its own: beats (issue #28)
 * now; the roughness landscape (#29) joins it below in each part.
 */
import type { LabProps } from '../registry';
import { BeatsControls } from './BeatsControls';
import { BEATS_SOURCES, BeatsMath } from './BeatsMath';
import { BeatsVisual } from './BeatsVisual';

export function BeatsAndRoughnessVisual({ settings }: LabProps) {
  return (
    <div className="br-visual">
      <BeatsVisual settings={settings} />
    </div>
  );
}

export function BeatsAndRoughnessControls({ settings }: LabProps) {
  return (
    <div className="br-controls-stack">
      <BeatsControls settings={settings} />
    </div>
  );
}

export function BeatsAndRoughnessMath({ settings }: LabProps) {
  return <BeatsMath settings={settings} />;
}

export const BEATS_AND_ROUGHNESS_SOURCES = [...BEATS_SOURCES];

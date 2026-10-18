/**
 * The Beats & roughness Lab's parts. Each topic is a section of its own: beats (issue #28)
 * first, then the roughness landscape (issue #29), in each part.
 */
import type { LabProps } from '../registry';
import { BeatsControls } from './BeatsControls';
import { BEATS_SOURCES, BeatsMath } from './BeatsMath';
import { BeatsVisual } from './BeatsVisual';
import { RoughnessControls } from './RoughnessControls';
import { ROUGHNESS_SOURCES, RoughnessMath } from './RoughnessMath';
import { RoughnessVisual } from './RoughnessVisual';

export function BeatsAndRoughnessVisual({ settings }: LabProps) {
  return (
    <div className="br-visual">
      <BeatsVisual settings={settings} />
      <RoughnessVisual settings={settings} />
    </div>
  );
}

export function BeatsAndRoughnessControls({ settings }: LabProps) {
  return (
    <div className="br-controls-stack">
      <BeatsControls settings={settings} />
      <RoughnessControls settings={settings} />
    </div>
  );
}

export function BeatsAndRoughnessMath({ settings }: LabProps) {
  return (
    <>
      <BeatsMath settings={settings} />
      <RoughnessMath settings={settings} />
    </>
  );
}

export const BEATS_AND_ROUGHNESS_SOURCES = [...new Set([...BEATS_SOURCES, ...ROUGHNESS_SOURCES])];

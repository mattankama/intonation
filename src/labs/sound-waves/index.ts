import type { LabDefinition } from '../registry';
import { SOUND_WAVES_SOURCES, SoundWavesMath } from './SoundWavesMath';
import { SoundWavesControls } from './SoundWavesControls';
import { SoundWavesVisual } from './SoundWavesVisual';

/** Sound waves: build a Timbre from its harmonics and watch the waveform (issue #24). */
export const soundWavesLab: Pick<LabDefinition, 'Visual' | 'Controls' | 'Math' | 'sources'> = {
  Visual: SoundWavesVisual,
  Controls: SoundWavesControls,
  Math: SoundWavesMath,
  sources: SOUND_WAVES_SOURCES,
};

import { useEffect, useMemo } from 'react';
import { audioEngine } from '../audio/engine';
import { presetHarmonics } from '../core';
import type { Settings } from '../state/settings';

/** Keeps the audio engine's Timbre and master volume in step with the shared settings. */
export function useAudioSettings({ timbre, brightness, volume }: Settings): void {
  const harmonics = useMemo(() => presetHarmonics(timbre, brightness), [timbre, brightness]);
  useEffect(() => audioEngine.setTimbre(harmonics), [harmonics]);
  useEffect(() => audioEngine.setVolume(volume), [volume]);
}

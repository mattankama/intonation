import { type Harmonics, timbreHarmonics, wavePeak, waveValue } from '../../core';
import { copy } from '../../copy/en';
import type { LabProps } from '../registry';
import { shownTimbre } from './shownTimbre';

const text = copy.soundWaves;

/** SVG user units; the drawing stretches to fill its box. */
const WIDTH = 600;
const HEIGHT = 200;
const PADDING = 12;
const PERIODS = 2;
const SAMPLES = 600;

/** Two periods of Σ aₙ·sin(nθ), scaled so the peak just fits. */
function wavePath(harmonics: Harmonics, peak: number): string {
  const mid = HEIGHT / 2;
  const scale = (mid - PADDING) / peak;
  const round = (v: number) => Math.round(v * 100) / 100;
  const points: string[] = [];
  for (let s = 0; s <= SAMPLES; s++) {
    const theta = (2 * Math.PI * PERIODS * s) / SAMPLES;
    const x = (WIDTH * s) / SAMPLES;
    const y = mid - waveValue(harmonics, theta) * scale;
    points.push(`${s === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`);
  }
  return points.join(' ');
}

/** Harmonic bars 1–16 above the live waveform they add up to. */
export function SoundWavesVisual({ settings }: LabProps) {
  const shown = shownTimbre(settings);
  const harmonics = timbreHarmonics(settings.timbre, settings.brightness);
  const peak = wavePeak(harmonics);

  return (
    <div className="sw-visual">
      <div className="sw-bars" role="img" aria-label={text.barsLabel}>
        {shown.levels.map((level, i) => (
          <div key={i} className="sw-bar-column" data-muted={shown.muted[i]} aria-hidden="true">
            <div className="sw-bar-track">
              <div className="sw-bar" style={{ height: `${level}%` }} />
            </div>
            <span className="sw-bar-number">{i + 1}</span>
          </div>
        ))}
      </div>
      <figure className="sw-wave">
        <svg
          className="sw-wave-plot"
          role="img"
          aria-label={text.waveformLabel}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
        >
          <line className="sw-wave-axis" x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} />
          <line className="sw-wave-axis" x1={WIDTH / 2} y1={0} x2={WIDTH / 2} y2={HEIGHT} />
          {peak > 0 && <path className="sw-wave-line" d={wavePath(harmonics, peak)} />}
        </svg>
        <figcaption className="sw-wave-caption">{peak > 0 ? text.waveformCaption : text.silent}</figcaption>
      </figure>
    </div>
  );
}

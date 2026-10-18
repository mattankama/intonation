import type { LatticeNode } from '../../core';
import { copy } from '../../copy/en';
import { formatRatio } from '../../format/numbers';
import { lazyScene, usePhoneLayout } from '../../scene3d';
import type { LabProps } from '../registry';
import type { LatticeSceneProps } from './LatticeScene';
import { toggleNode } from './chord';
import { chordNotes, playChord, proportionText, useLattice } from './state';

const text = copy.latticeLab;
const LatticeScene = lazyScene<LatticeSceneProps>(() => import('./LatticeScene'), {
  label: text.sceneLabel,
  className: 'jl-scene',
});

/** The lattice with its key and a readout of the chord. */
export function LatticeVisual({ settings }: LabProps) {
  const [state, setState] = useLattice();
  const phone = usePhoneLayout();
  const onToggle = (node: LatticeNode) => {
    const chord = toggleNode(state.chord, node);
    setState({ ...state, chord });
    playChord(chord, settings);
  };

  return (
    <div className="jl-visual">
      <ul className="jl-legend" aria-label={text.legendLabel}>
        <li className="jl-legend-item">
          <ShapeSwatch />
          {text.legend.shape}
        </li>
        <li className="jl-legend-item">{text.legend.three}</li>
        <li className="jl-legend-item">{text.legend.five}</li>
        {state.limit === 7 && <li className="jl-legend-item">{text.legend.seven}</li>}
      </ul>
      <LatticeScene
        limit={state.limit}
        chord={state.chord}
        tonic={settings.tonic}
        phone={phone}
        onToggle={onToggle}
      />
      <ChordReadout chord={state.chord} tonic={settings.tonic} />
    </div>
  );
}

function ChordReadout({ chord, tonic }: { chord: readonly LatticeNode[]; tonic: number }) {
  const notes = chordNotes(chord, tonic);
  const message =
    notes.length === 0
      ? text.readout.empty
      : text.readout.chord(
          notes.map((n) => n.name).join('–'),
          notes.map((n) => formatRatio(n.ratio)).join(' · '),
          proportionText(notes),
        );
  return (
    <p className="jl-readout" role="status">
      {notes.length > 0 && <ShapeSwatch />}
      {message}
    </p>
  );
}

/** A small soft-gold triangle: the key to the chord shapes on the lattice. */
function ShapeSwatch() {
  return (
    <svg className="jl-shape-swatch" width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
      <polygon points="1,11 13,11 7,1" />
    </svg>
  );
}

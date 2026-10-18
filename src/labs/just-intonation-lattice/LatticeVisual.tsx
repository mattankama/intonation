import { type LatticeNode, commaPumpDrift, commaPumpLength, factorsCents } from '../../core';
import { copy } from '../../copy/en';
import { formatRatio, formatSignedCents } from '../../format/numbers';
import { lazyScene, usePhoneLayout } from '../../scene3d';
import type { LabProps } from '../registry';
import type { LatticeSceneProps } from './LatticeScene';
import { toggleNode } from './latticeState';
import { pumpView } from './geometry';
import { chordNotes, pitchLabel, proportionText, stepSymbol } from './labels';
import { usePumpSound } from './pumpPlayback';
import { type PumpPicture, usePumpPicture } from './pumpPicture';
import { playChord, playNode } from './sound';
import { useLattice, usePump } from './urlState';

const text = copy.latticeLab;
const LatticeScene = lazyScene<LatticeSceneProps>(() => import('./LatticeScene'), {
  label: text.sceneLabel,
  className: 'jl-scene',
});

/** The lattice with its key and a readout of the chord, or of the comma pump (issue #31). */
export function LatticeVisual({ settings }: LabProps) {
  const [state, setState] = useLattice();
  const [pumpState] = usePump();
  const pump = usePumpPicture(pumpState);
  const phone = usePhoneLayout();
  usePumpSound(settings, pump !== null);
  const onToggle = (node: LatticeNode) => {
    const chord = toggleNode(state.chord, node);
    setState({ ...state, chord });
    playChord(chord, settings);
  };
  const limit = pump?.limit ?? state.limit;

  return (
    <div className="jl-visual">
      <ul className="jl-legend" aria-label={text.legendLabel}>
        <li className="jl-legend-item">
          <ShapeSwatch />
          {pump ? text.pump.legend.chord : text.legend.shape}
        </li>
        {pump && (
          <li className="jl-legend-item">
            <PathSwatch />
            {text.pump.legend.path}
          </li>
        )}
        <li className="jl-legend-item">{text.legend.three}</li>
        <li className="jl-legend-item">{text.legend.five}</li>
        {limit === 7 && <li className="jl-legend-item">{text.legend.seven}</li>}
      </ul>
      {pump ? (
        <LatticeScene
          limit={limit}
          chord={pump.chord}
          path={pump.path}
          view={pumpView({ phone, limit }, pump.frame, pump.chord)}
          tonic={settings.tonic}
          phone={phone}
          onToggle={(node) => playNode(node, settings)}
        />
      ) : (
        <LatticeScene limit={limit} chord={state.chord} tonic={settings.tonic} phone={phone} onToggle={onToggle} />
      )}
      {pump ? <PumpReadout pump={pump} tonic={settings.tonic} /> : <ChordReadout chord={state.chord} tonic={settings.tonic} />}
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

/** Where the pump is ("Chord 3 of 4 · Dm: …, keeping A 5/3") and how far home has drifted. */
function PumpReadout({ pump, tonic }: { pump: PumpPicture; tonic: number }) {
  const { current, id } = pump;
  const t = text.pump.readout;
  return (
    <div className="jl-readout jl-pump-readout" role="status">
      <p className="jl-readout-line">
        <ShapeSwatch />
        {t.position(current.position, commaPumpLength(id), current.loop > 0)} ·{' '}
        {t.chord(
          stepSymbol(tonic, current),
          current.notes.map((n) => pitchLabel(tonic, n.pitch)).join(' · '),
          current.held && pitchLabel(tonic, current.held.pitch),
        )}
      </p>
      <p className="jl-drift">
        {current.loop === 0
          ? t.notHome
          : t.drift(current.loop, formatSignedCents(factorsCents(commaPumpDrift(id, current.loop)), 'controls'))}
      </p>
    </div>
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

/** A short teal line: the key to the comma pump's path. */
function PathSwatch() {
  return (
    <svg className="jl-path-swatch" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <polyline points="1,10 9,3 17,6" />
    </svg>
  );
}

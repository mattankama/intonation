import { useCallback, useId, useMemo, useState } from 'react';
import { audioEngine } from '../audio/engine';
import { type Note, type TuningSystemId, isEdo, resolvePitch, tonicSpelling } from '../core';
import { copy } from '../copy/en';
import type { LabDefinition } from '../labs/registry';
import { Sources } from '../math/MathParts';
import { NoteMath, noteMathSources } from '../math/NoteMath';
import { tuningOf } from '../state/settings';
import { useSettings } from '../state/useSettings';
import { ChordButtons } from './ChordButtons';
import { Inspector } from './Inspector';
import { Keyboard } from './Keyboard';
import { LabNav, SettingsFields } from './LabNav';
import { Wordmark } from './Wordmark';
import { useAudioSettings } from './useAudioSettings';
import { useDocumentTitle } from './useDocumentTitle';

/** The audio engine's id for a keyboard key (its step or pitch class, and octave). */
const voiceId = (note: Note) => `${note.pitchClass}:${note.octave}`;

/**
 * The "Instrument workspace" (decision #12): left rail, centre visual, right inspector
 * with Controls / The math, keyboard along the bottom. Below 700px: a top bar with
 * setting chips and a menu, then the visual, the tabs and the keyboard.
 */
export function LabPage({ lab }: { lab: LabDefinition }) {
  const [settings] = useSettings();
  // The note last played, and the tuning system it was played in.
  const [played, setPlayed] = useState<{ note: Note; system: TuningSystemId } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  useDocumentTitle(copy.shell.documentTitle(lab.title));
  useAudioSettings(settings);

  const tuning = useMemo(() => tuningOf(settings), [settings]);
  const frequencyOf = useCallback(
    (note: Note) => resolvePitch(tuning, note, settings.referencePitch).frequency,
    [tuning, settings.referencePitch],
  );
  // A key of another tuning system (another N, say) is a different note: forget it.
  const lastNote = played?.system === tuning.system ? played.note : null;
  const onNoteOn = (note: Note) => {
    audioEngine.noteOn(voiceId(note), frequencyOf(note));
    setPlayed({ note, system: tuning.system });
  };
  const onNoteOff = (note: Note) => audioEngine.noteOff(voiceId(note));
  const onPluck = (note: Note) => {
    audioEngine.pluck(voiceId(note), frequencyOf(note));
    setPlayed({ note, system: tuning.system });
  };

  const { Visual, Controls, Math } = lab;
  const sources = [...(lastNote ? noteMathSources(tuning) : []), ...(lab.sources ?? [])];
  const math = (
    <>
      {lastNote ? (
        <NoteMath note={lastNote} tuning={tuning} referencePitch={settings.referencePitch} />
      ) : (
        <p className="placeholder-text">{copy.math.empty}</p>
      )}
      {Math && <Math settings={settings} />}
      <Sources items={sources} />
    </>
  );

  return (
    <div className="lab-layout">
      {/* On phones the rail becomes the menu opened from the top bar. */}
      <aside id={menuId} className="rail" data-menu-open={menuOpen}>
        <Wordmark />
        <h2 className="rail-heading">{copy.shell.labsHeading}</h2>
        <LabNav current={lab.id} />
        <h2 className="rail-heading">{copy.shell.settingsHeading}</h2>
        <SettingsFields />
      </aside>

      <header className="mobilebar">
        <Wordmark compact />
        <span className="chip chip-shrink">
          {copy.settings.tuningSystem.chip(
            copy.settings.tuningSystem.name(tuning.system, 'short'),
            isEdo(tuning.system) ? null : tonicSpelling(tuning.tonic),
          )}
        </span>
        <span className="chip">
          {copy.settings.referencePitch.chip(String(settings.referencePitch))}
        </span>
        <button
          type="button"
          className="button-tertiary menu-button ml-focusable"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? copy.shell.closeMenu : copy.shell.openMenu}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </header>

      <main className="lab-centre">
        <div className="lab-head">
          <h1 className="lab-title">{lab.title}</h1>
          <p className="lab-intro">{lab.intro}</p>
        </div>
        <div className="lab-visual">
          {Visual ? (
            <Visual settings={settings} />
          ) : (
            <p className="placeholder-text">{copy.shell.visualPlaceholder}</p>
          )}
        </div>
      </main>

      <Inspector
        controls={
          Controls ? (
            <Controls settings={settings} />
          ) : (
            <p className="placeholder-text">{copy.shell.controlsPlaceholder}</p>
          )
        }
        math={math}
      />

      <div className="keys">
        <Keyboard tuning={tuning} onNoteOn={onNoteOn} onNoteOff={onNoteOff} onPluck={onPluck} />
        <ChordButtons tuning={tuning} referencePitch={settings.referencePitch} />
      </div>
    </div>
  );
}

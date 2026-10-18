import { useCallback, useId, useState } from 'react';
import { audioEngine } from '../audio/engine';
import { type Note, edo12Frequency, edo12NoteName } from '../core';
import { copy } from '../copy/en';
import type { LabDefinition } from '../labs/registry';
import { Sources } from '../math/MathParts';
import { NOTE_MATH_SOURCES, NoteMath } from '../math/NoteMath';
import { useSettings } from '../state/useSettings';
import { Inspector } from './Inspector';
import { Keyboard } from './Keyboard';
import { LabNav, SettingsFields } from './LabNav';
import { Wordmark } from './Wordmark';
import { useAudioSettings } from './useAudioSettings';
import { useDocumentTitle } from './useDocumentTitle';

/**
 * The "Instrument workspace" (decision #12): left rail, centre visual, right inspector
 * with Controls / The math, keyboard along the bottom. Below 700px: a top bar with
 * setting chips and a menu, then the visual, the tabs and the keyboard.
 */
export function LabPage({ lab }: { lab: LabDefinition }) {
  const [settings] = useSettings();
  const [lastNote, setLastNote] = useState<Note | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  useDocumentTitle(copy.shell.documentTitle(lab.title));
  useAudioSettings(settings);

  const frequencyOf = useCallback(
    (note: Note) => edo12Frequency(note, settings.referencePitch),
    [settings.referencePitch],
  );
  const onNoteOn = (note: Note) => {
    audioEngine.noteOn(edo12NoteName(note), frequencyOf(note));
    setLastNote(note);
  };
  const onNoteOff = (note: Note) => audioEngine.noteOff(edo12NoteName(note));
  const onPluck = (note: Note) => {
    audioEngine.pluck(edo12NoteName(note), frequencyOf(note));
    setLastNote(note);
  };

  const { Visual, Controls, Math } = lab;
  const sources = [...(lastNote ? NOTE_MATH_SOURCES : []), ...(lab.sources ?? [])];
  const math = (
    <>
      {lastNote ? (
        <NoteMath note={lastNote} referencePitch={settings.referencePitch} />
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
        <span className="chip">{copy.shell.tuningChip}</span>
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
        <Keyboard onNoteOn={onNoteOn} onNoteOff={onNoteOff} onPluck={onPluck} />
      </div>
    </div>
  );
}

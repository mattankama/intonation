import { copy } from '../copy/en';
import type { LabId } from '../labs/ids';
import { LABS } from '../labs/registry';
import { Link } from '../state/Link';
import { settingsHref, useSettings } from '../state/useSettings';
import { ReferencePitchField } from './ReferencePitchField';

/** The six Labs as a vertical list; the current one is marked. */
export function LabNav({ current }: { current: LabId }) {
  const [settings] = useSettings();
  return (
    <nav aria-label={copy.shell.labsHeading}>
      <ul className="lab-nav">
        {LABS.map((lab) => (
          <li key={lab.id}>
            <Link
              className="lab-nav-link ml-focusable"
              href={settingsHref(lab.path, settings)}
              aria-current={lab.id === current ? 'page' : undefined}
            >
              {lab.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The shared settings, stacked as form fields. More settings join this list. */
export function SettingsFields() {
  return (
    <div className="settings-fields">
      <ReferencePitchField />
    </div>
  );
}

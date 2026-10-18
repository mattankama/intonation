import { copy } from '../copy/en';
import { LABS } from '../labs/registry';
import { Link } from '../state/Link';
import { settingsHref, useSettings } from '../state/useSettings';
import { Wordmark } from '../shell/Wordmark';
import { useDocumentTitle } from '../shell/useDocumentTitle';

/** The home page, in the design system's index template (decision #18). */
export function HomePage() {
  const [settings] = useSettings();
  useDocumentTitle(copy.siteName);
  return (
    <div className="home">
      <header className="home-masthead">
        <Wordmark />
      </header>
      <main className="home-main">
        <div className="home-hero">
          <h1 className="home-headline">{copy.home.headline}</h1>
          <p className="home-intro">{copy.home.intro}</p>
        </div>
        <h2 className="visually-hidden">{copy.home.labsHeading}</h2>
        <ul className="lab-cards">
          {LABS.map((lab) => (
            <li key={lab.id}>
              <Link className="lab-card ml-focusable" href={settingsHref(lab.path, settings)}>
                {/* Placeholder until the SVG ink previews land (issue #32). */}
                <div className="lab-card-preview" aria-hidden="true" />
                <h3 className="lab-card-title">{lab.title}</h3>
                <p className="lab-card-intro">{lab.intro}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

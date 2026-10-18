import { copy } from '../copy/en';
import { Link } from '../state/Link';
import { settingsHref, useSettings } from '../state/useSettings';

/** "Intonation" in the serif stack and brand red, linking home. */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  const [settings] = useSettings();
  return (
    <Link
      className={`wordmark ml-focusable${compact ? ' wordmark-compact' : ''}`}
      href={settingsHref('/', settings)}
    >
      {copy.siteName}
    </Link>
  );
}

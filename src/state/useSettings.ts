import { useCallback, useMemo } from 'react';
import { hrefFor, navigate, useLocation } from './location';
import { type Settings, readSettings, writeSettings } from './settings';

/** The shared settings, read from and written to the current URL. */
export function useSettings(): [Settings, (change: Partial<Settings>) => void] {
  const { pathname, params } = useLocation();
  const query = params.toString();
  const settings = useMemo(() => readSettings(new URLSearchParams(query)), [query]);

  const update = useCallback(
    (change: Partial<Settings>) => {
      const next = writeSettings(new URLSearchParams(query), { ...settings, ...change });
      navigate(hrefFor(pathname, next), { replace: true });
    },
    [pathname, query, settings],
  );

  return [settings, update];
}

/** A link to another page that carries the shared settings but no Lab-specific state. */
export function settingsHref(pathname: string, settings: Settings): string {
  return hrefFor(pathname, writeSettings(new URLSearchParams(), settings));
}

/**
 * A tiny router over the History API. Moving between pages pushes a history entry, so
 * back and forward step between Labs; changing a setting replaces the current entry,
 * so back doesn't step through every value a control passed through.
 */
import { useSyncExternalStore } from 'react';

const CHANGE = 'intonation:locationchange';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

const snapshot = () => window.location.pathname + window.location.search;

export interface AppLocation {
  pathname: string;
  params: URLSearchParams;
}

export function useLocation(): AppLocation {
  const href = useSyncExternalStore(subscribe, snapshot);
  const url = new URL(href, window.location.origin);
  return { pathname: url.pathname, params: url.searchParams };
}

export function hrefFor(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function navigate(href: string, { replace = false } = {}): void {
  if (href === snapshot()) return;
  if (replace) window.history.replaceState(null, '', href);
  else window.history.pushState(null, '', href);
  window.dispatchEvent(new Event(CHANGE));
}

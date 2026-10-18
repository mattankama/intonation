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

// The site's path prefix: '' in dev, '/intonation' on GitHub Pages (vite.config.ts).
// Everything inside the app speaks prefix-free paths like '/' and '/sound-waves'; the
// prefix is only added and removed here, at the address bar.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** The address-bar path with the site prefix taken off. */
export function appPathname(): string {
  const path = window.location.pathname;
  return (path.startsWith(BASE) ? path.slice(BASE.length) : path) || '/';
}

/** An in-app href as the browser needs it, prefix included. */
export function siteHref(href: string): string {
  return BASE + href;
}

const snapshot = () => appPathname() + window.location.search;

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
  if (replace) window.history.replaceState(null, '', siteHref(href));
  else window.history.pushState(null, '', siteHref(href));
  window.dispatchEvent(new Event(CHANGE));
}

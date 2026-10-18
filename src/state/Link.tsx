import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { navigate, siteHref } from './location';

/** An in-app link: a real <a href> that navigates without reloading the page. */
export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    navigate(href);
    window.scrollTo(0, 0);
  };
  return <a href={siteHref(href)} onClick={handleClick} {...rest} />;
}

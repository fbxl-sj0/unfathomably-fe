/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/components/browser-link.tsx

  Purpose:

    Render untrusted or server-provided URLs without confusing external links
    with routes owned by the current frontend.

  Responsibilities:

    * route same-origin HTTP links through React Router
    * open remote HTTP links as normal protected anchors
    * leave malformed and unsafe links inert

  This file intentionally does NOT contain:

    * URL preview fetching
    * ActivityPub object resolution
    * navigation policy for application-owned route constants
*/

import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import { resolveBrowserLink } from '@/utils/compare-urls.ts';

interface BrowserLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
}

const BrowserLink = forwardRef<HTMLAnchorElement, BrowserLinkProps>(({
  children,
  href,
  rel,
  target,
  ...props
}, ref) => {
  const resolved = resolveBrowserLink(href);

  if (!resolved) {
    return <a ref={ref} {...props}>{children}</a>;
  }

  if (!resolved.external) {
    return (
      <Link ref={ref} to={resolved.href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a
      ref={ref}
      {...props}
      href={resolved.href}
      rel={rel || 'noopener noreferrer'}
      target={target || '_blank'}
    >
      {children}
    </a>
  );
});

BrowserLink.displayName = 'BrowserLink';

export default BrowserLink;

/* end of src/components/browser-link.tsx */

/*
 * Unfathomably FE
 * File: compare-urls.ts
 *
 * Purpose: Compare browser and ActivityPub URL representations without
 * weakening origin, path, or query matching.
 *
 * This file intentionally does not resolve handles or fetch remote URLs.
 */

const normalizePathname = (pathname: string): string => {
  const normalized = pathname.replace(/\/+$/, '');

  return normalized || '/';
};

interface BrowserLinkTarget {
  external: boolean;
  href: string;
}

const supportedHttpProtocols = new Set(['http:', 'https:']);

/**
 * Resolve a browser link without using string-prefix origin checks.
 *
 * Same-origin HTTP links become router-safe relative paths. Remote HTTP links
 * remain absolute, while malformed, credential-bearing, and non-HTTP values
 * fail closed so callers can render inert text instead of a dangerous anchor.
 */
const resolveBrowserLink = (value: string, base = window.location.href): BrowserLinkTarget | null => {
  try {
    const candidate = value.trim();

    if (!candidate) return null;

    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(candidate);
    const isRelativeReference = /^(?:\/|\.\/|\.\.\/|\?|#)/.test(candidate);

    if (!hasScheme && !isRelativeReference) return null;

    const baseUrl = new URL(base);
    const url = new URL(candidate, baseUrl);

    if (!supportedHttpProtocols.has(baseUrl.protocol) || !supportedHttpProtocols.has(url.protocol)) {
      return null;
    }

    if (baseUrl.username || baseUrl.password || url.username || url.password) {
      return null;
    }

    if (url.origin === baseUrl.origin) {
      return {
        external: false,
        href: `${url.pathname}${url.search}${url.hash}`,
      };
    }

    return { external: true, href: url.href };
  } catch {
    return null;
  }
};

/**
 * Compare absolute HTTP URLs after the normalization performed by browsers.
 * ActivityPub actors commonly publish an origin URL without the trailing slash,
 * while an HTML anchor exposes the same URL with `/` appended.
 */
const sameHttpUrl = (left: string, right: string): boolean => {
  try {
    const leftUrl = new URL(left);
    const rightUrl = new URL(right);

    if (!supportedHttpProtocols.has(leftUrl.protocol) || !supportedHttpProtocols.has(rightUrl.protocol)) {
      return false;
    }

    if (leftUrl.username || leftUrl.password || rightUrl.username || rightUrl.password) {
      return false;
    }

    return leftUrl.origin === rightUrl.origin
      && normalizePathname(leftUrl.pathname) === normalizePathname(rightUrl.pathname)
      && leftUrl.search === rightUrl.search;
  } catch {
    return false;
  }
};

export { resolveBrowserLink, sameHttpUrl };
export type { BrowserLinkTarget };

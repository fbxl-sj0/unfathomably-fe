/*
 * Unfathomably FE
 * File: compare-urls.test.ts
 *
 * Purpose: Cover the URL equivalence rules used for ActivityPub mentions.
 *
 * This file intentionally does not perform network requests.
 */

import { describe, expect, it } from 'vitest';

import { resolveBrowserLink, sameHttpUrl } from './compare-urls.ts';

describe('sameHttpUrl', () => {
  it('accepts browser-normalized origin URLs', () => {
    expect(sameHttpUrl('https://example.com', 'https://example.com/')).toBe(true);
  });

  it('accepts equivalent paths with a trailing slash', () => {
    expect(sameHttpUrl('https://example.com/users/alice', 'https://example.com/users/alice/')).toBe(true);
  });

  it('does not collapse different paths or queries', () => {
    expect(sameHttpUrl('https://example.com/users/alice', 'https://example.com/users/bob')).toBe(false);
    expect(sameHttpUrl('https://example.com/users/alice?page=1', 'https://example.com/users/alice?page=2')).toBe(false);
  });

  it('fails closed for malformed URLs', () => {
    expect(sameHttpUrl('not a URL', 'not a URL')).toBe(false);
    expect(sameHttpUrl('not a URL', 'also not a URL')).toBe(false);
  });
});

describe('resolveBrowserLink', () => {
  const base = 'https://social.example/app';

  it('converts relative and same-origin absolute URLs into router paths', () => {
    expect(resolveBrowserLink('/@alice/posts/1?view=full#replies', base)).toEqual({
      external: false,
      href: '/@alice/posts/1?view=full#replies',
    });
    expect(resolveBrowserLink('https://social.example/settings', base)).toEqual({
      external: false,
      href: '/settings',
    });
  });

  it('does not mistake lookalike hosts for the local origin', () => {
    expect(resolveBrowserLink('https://social.example.evil.test/phish', base)).toEqual({
      external: true,
      href: 'https://social.example.evil.test/phish',
    });
  });

  it('rejects credentials, unsafe schemes, and malformed values', () => {
    expect(resolveBrowserLink('https://user:pass@social.example/private', base)).toBeNull();
    expect(resolveBrowserLink('javascript:alert(1)', base)).toBeNull();
    expect(resolveBrowserLink('not a URL', base)).toBeNull();
  });
});

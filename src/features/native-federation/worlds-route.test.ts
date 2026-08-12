/*
 * Project: Unfathomably FE
 *
 * File: native-federation/worlds-route.test.ts
 *
 * Purpose:
 *   Protect Worlds family routes from collapsing into the generic feed.
 *
 * Responsibilities:
 *   - prove WrappedRoute match parameters select the requested family
 *   - prove nested page layouts can fall back to the current pathname
 *   - prove root and alias routes remain generic
 *
 * This file intentionally does NOT render discovery panels or make API calls.
 */

import { describe, expect, it } from 'vitest';

import { resolveWorldsRouteFamily } from './worlds-route.ts';

describe('resolveWorldsRouteFamily', () => {
  it('prefers the family supplied by WrappedRoute', () => {
    expect(resolveWorldsRouteFamily('books', '/worlds/video')).toBe('books');
  });

  it.each([
    ['/worlds/books', 'books'],
    ['/worlds/marketplace', 'marketplace'],
    ['/worlds/development/', 'development'],
  ])('recovers %s from a nested page pathname', (pathname, family) => {
    expect(resolveWorldsRouteFamily(undefined, pathname)).toBe(family);
  });

  it.each(['/worlds', '/federation', '/worlds/books/details'])(
    'does not invent a family for %s',
    (pathname) => {
      expect(resolveWorldsRouteFamily(undefined, pathname)).toBeUndefined();
    },
  );

  it('does not throw on a malformed encoded segment', () => {
    expect(resolveWorldsRouteFamily(undefined, '/worlds/%E0%A4%A')).toBe('%E0%A4%A');
  });
});

/* end of src/features/native-federation/worlds-route.test.ts */

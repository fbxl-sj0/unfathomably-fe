/*
 * Unfathomably FE
 * File: search.test.ts
 *
 * Purpose: Verify exact actor identifiers that should request remote resolution.
 *
 * This file intentionally does not perform account searches or network requests.
 */

import { describe, expect, it } from 'vitest';

import { looksLikeActorIdentifier } from './search.ts';

describe('looksLikeActorIdentifier', () => {
  it('recognizes Bluesky handles with or without their display prefix', () => {
    expect(looksLikeActorIdentifier('jd-vance-1.bsky.social')).toBe(true);
    expect(looksLikeActorIdentifier('@jd-vance-1.bsky.social')).toBe(true);
  });

  it('keeps ordinary search phrases local', () => {
    expect(looksLikeActorIdentifier('JD Vance')).toBe(false);
    expect(looksLikeActorIdentifier('not/a/handle')).toBe(false);
  });
});

/* end of search.test.ts */

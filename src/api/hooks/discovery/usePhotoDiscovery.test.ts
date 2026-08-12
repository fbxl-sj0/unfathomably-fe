/*
 * Project: Unfathomably FE
 * File: api/hooks/discovery/usePhotoDiscovery.test.ts
 * Purpose: Protect fail-closed photograph interaction capability parsing.
 * Responsibilities: Verify missing, malformed, allowed, and denied values.
 * This file intentionally does not make discovery network requests.
 */

import { describe, expect, it } from 'vitest';

import { normalizePhotoDiscoveryCapabilities } from './usePhotoDiscovery.ts';

describe('normalizePhotoDiscoveryCapabilities', () => {
  it('fails closed when capability metadata is missing or malformed', () => {
    expect(normalizePhotoDiscoveryCapabilities(undefined)).toEqual({
      announce: false,
      like: false,
      reply: false,
    });

    expect(normalizePhotoDiscoveryCapabilities({ announce: 'yes', like: 1, reply: null })).toEqual({
      announce: false,
      like: false,
      reply: false,
    });
  });

  it('preserves only explicit boolean permissions', () => {
    expect(normalizePhotoDiscoveryCapabilities({ announce: true, like: false, reply: true })).toEqual({
      announce: true,
      like: false,
      reply: true,
    });
  });
});

/* end of api/hooks/discovery/usePhotoDiscovery.test.ts */

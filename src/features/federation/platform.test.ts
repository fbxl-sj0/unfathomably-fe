/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/federation/platform.test.ts

  Purpose:

    Prove the frontend keeps a stable platform-family contract for native
    federation UI work.

  Responsibilities:

    * test known software family mappings
    * test NodeInfo and ActivityPub fallback shapes
    * ensure every family has a render hint

  This file intentionally does NOT contain:

    * network mocks
    * React component rendering
    * backend API assertions
*/

import { describe, expect, it } from 'vitest';

import {
  classifyFederationPlatform,
  FEDERATION_PLATFORM_FIXTURES,
  FEDERATION_RENDER_HINTS,
  type FederationFamily,
} from './platform.ts';

describe('federation platform classification', () => {
  it('classifies named fediverse software into native UI families', () => {
    for (const { software, family } of FEDERATION_PLATFORM_FIXTURES) {
      expect(classifyFederationPlatform({ software: { name: software } })).toEqual(expect.objectContaining({
        family,
        confidence: 'software',
      }));
    }
  });

  it('classifies nested NodeInfo metadata', () => {
    expect(classifyFederationPlatform({
      nodeinfo: {
        software: {
          name: 'lemmy',
          version: '1.0.0',
        },
      },
    })).toEqual({
      platform: 'lemmy',
      label: 'Lemmy',
      family: 'groups',
      confidence: 'software',
    });
  });

  it('classifies actor generator metadata', () => {
    expect(classifyFederationPlatform({
      type: 'Person',
      generator: {
        type: 'Application',
        name: 'Pixelfed',
      },
    })).toEqual(expect.objectContaining({
      platform: 'pixelfed',
      family: 'photo',
      confidence: 'software',
    }));
  });

  it('falls back to ActivityPub object type when software is unknown', () => {
    expect(classifyFederationPlatform({ type: 'Audio' })).toEqual(expect.objectContaining({
      platform: 'activitypub-audio',
      family: 'audio',
      confidence: 'object',
    }));

    expect(classifyFederationPlatform({ object: { type: 'Group' } })).toEqual(expect.objectContaining({
      platform: 'activitypub-group',
      family: 'groups',
      confidence: 'object',
    }));
  });

  it('keeps unknown input safe and generic', () => {
    expect(classifyFederationPlatform({ software: { name: 'some-new-fediverse-thing' } })).toEqual({
      platform: 'unknown',
      label: 'Unknown',
      family: 'generic',
      confidence: 'unknown',
    });
  });

  it('has a render hint for every known family', () => {
    const families = new Set<FederationFamily>([
      ...FEDERATION_PLATFORM_FIXTURES.map(({ family }) => family),
      'audio',
      'video',
      'longform',
      'microblog',
      'photo',
      'books',
      'bookmarks',
      'groups',
      'events',
      'local',
      'generic',
    ]);

    for (const family of families) {
      expect(FEDERATION_RENDER_HINTS[family]).toEqual(expect.objectContaining({
        layout: expect.any(String),
        primaryAction: expect.any(String),
      }));
    }
  });
});

/* end of src/features/federation/platform.test.ts */

/*
 * Project: Unfathomably FE
 *
 * File: native-federation/presentation-family.test.ts
 *
 * Purpose:
 *   Protect Worlds family selection from hostname and free-text promotion.
 *
 * Responsibilities:
 *   - prove Mastodon hostnames do not define a native family
 *   - prove explicit family, platform, and object type remain useful signals
 *
 * This file intentionally does NOT render the Worlds page.
 */

import { describe, expect, it } from 'vitest';

import { classifyNativePresentation } from './presentation-family.ts';

describe('classifyNativePresentation', () => {
  it.each([
    'https://mastodon.games/@player/1',
    'https://mastodon.music/@listener/1',
    'https://mastodon.video/@viewer/1',
  ])('does not infer a family from the canonical hostname %s', (canonicalId) => {
    expect(classifyNativePresentation({
      canonical_id: canonicalId,
      fields: { platform: 'mastodon' },
      type: 'Note',
    })).toBeNull();
  });

  it('honors the bounded native family emitted by the backend', () => {
    expect(classifyNativePresentation({
      canonical_id: 'https://social.example/objects/1',
      fields: { family: 'markets', platform: 'unfathomably' },
      type: 'Note',
    })).toBe('marketplace');
  });

  it('uses an exact verified platform identifier', () => {
    expect(classifyNativePresentation({
      canonical_id: 'https://chess.example/games/1',
      fields: { platform: 'castling' },
      type: 'Note',
    })).toBe('games');
  });

  it.each([
    ['Audio', 'audio'],
    ['Video', 'video'],
    ['Event', 'events'],
    ['ValueFlows:EconomicEvent', 'coordination'],
  ] as const)('uses the concrete %s object shape', (type, family) => {
    expect(classifyNativePresentation({
      canonical_id: 'https://ordinary.example/objects/1',
      type,
    })).toBe(family);
  });
});

/* end of src/features/native-federation/presentation-family.test.ts */

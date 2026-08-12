/*
 * Project: Unfathomably FE
 * File: mention.test.ts
 * Purpose: Protect actor-aware mention routing.
 * Responsibilities: Verify native Group routes and ordinary account routes.
 * This file intentionally does not render React components or issue API calls.
 */

import { describe, expect, it } from 'vitest';

import { mentionPath } from './mention.tsx';

describe('mentionPath', () => {
  it('routes Group actors to the native group page', () => {
    expect(mentionPath({ acct: 'news@forum.example', actor_type: 'Group' }))
      .toBe('/group/news@forum.example');
  });

  it('routes ordinary actors to the account page', () => {
    expect(mentionPath({ acct: 'alice@example.com', actor_type: 'Person' }))
      .toBe('/@alice@example.com');
    expect(mentionPath({ acct: 'service@example.com', actor_type: 'Service' }))
      .toBe('/@service@example.com');
  });
});

/* end of mention.test.ts */

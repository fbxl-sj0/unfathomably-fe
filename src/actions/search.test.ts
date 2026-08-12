/*
 * Project: Unfathomably FE
 * ------------------------
 * File: search.test.ts
 * Purpose: Protect the search request contract used by continuation requests.
 * Responsibilities: Preserve active query constraints across pagination.
 * This file intentionally does NOT contain API transport or rendering tests.
 */

import { describe, expect, it } from 'vitest';

import { buildSearchParams } from './search.ts';

describe('buildSearchParams()', () => {
  it('preserves the complete search context for continuation requests', () => {
    expect(buildSearchParams('video:true', 'statuses', {
      accountId: '42',
      offset: 40,
      shortVideosOnly: true,
    })).toEqual({
      q: 'video:true',
      resolve: true,
      limit: 20,
      type: 'statuses',
      account_id: '42',
      offset: 40,
      short_videos_only: true,
    });
  });
});

/* end of search.test.ts */

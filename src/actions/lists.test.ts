/*
  Project: Unfathomably FE
  File: actions/lists.test.ts

  Purpose:
    Verify list request payload construction.

  Responsibilities:
    Preserve optional emoji values, support clearing an emoji, and avoid
    adding extension fields when a direct caller did not provide them.

  This file intentionally does NOT contain:
    Network mocks or list editor rendering tests.
*/

import { describe, expect, it } from 'vitest';

import { buildListParams } from './lists.ts';

describe('buildListParams', () => {
  it('trims and includes a list emoji', () => {
    expect(buildListParams('Friends', true, '  party_blob  ')).toEqual({
      title: 'Friends',
      exclusive: true,
      emoji: 'party_blob',
    });
  });

  it('sends null when an existing list emoji is cleared', () => {
    expect(buildListParams('Friends', false, '   ')).toEqual({
      title: 'Friends',
      exclusive: false,
      emoji: null,
    });
  });

  it('omits emoji for callers using the standard Mastodon list contract', () => {
    expect(buildListParams('Friends', false)).toEqual({
      title: 'Friends',
      exclusive: false,
    });
  });
});

/* end of actions/lists.test.ts */

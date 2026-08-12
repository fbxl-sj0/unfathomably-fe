/*
 * Project: Unfathomably FE
 * ------------------------
 * File: status-filter.test.ts
 * Purpose: Protect status filter-result normalization.
 * Responsibilities: Prefer exact matches while supporting legacy filter objects.
 * This file intentionally does NOT contain status rendering tests.
 */

import { fromJS } from 'immutable';
import { describe, expect, it } from 'vitest';

import { normalizeFilterResults } from './status.ts';

describe('normalizeFilterResults()', () => {
  it('uses exact matches from a legacy Pleroma filter result', () => {
    const status = fromJS({
      filtered: [{
        filter: {
          id: '1',
          phrase: 'cat',
          context: ['home'],
          irreversible: false,
          whole_word: true,
        },
        keyword_matches: ['CAT'],
        status_matches: [],
      }],
    });

    expect(normalizeFilterResults(status).get('filtered').toJS()).toEqual(['CAT']);
  });

  it('falls back to the normalized filter title when match metadata is absent', () => {
    const status = fromJS({
      filtered: [{
        filter: { id: '1', phrase: 'cat', context: ['home'], irreversible: false },
        keyword_matches: [],
        status_matches: [],
      }],
    });

    expect(normalizeFilterResults(status).get('filtered').toJS()).toEqual(['cat']);
  });
});

/* end of status-filter.test.ts */
